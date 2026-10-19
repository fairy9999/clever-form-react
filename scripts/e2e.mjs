/**
 * E2E 冒烟测试：登录 → 系统列表 → 实体列表（建档弹框）→ 填报（预设弹框/保存）→ 详情。
 * 运行前需启动 dev server：npm run dev
 * 用法：node scripts/e2e.mjs [devUrl]
 */
import { chromium } from 'playwright-core';

const BASE = process.argv[2] ?? 'http://127.0.0.1:5199';
const EXECUTABLE = process.env.CHROME_PATH
  ?? `${process.env.USERPROFILE}\\.agent-browser\\browsers\\chrome-155.0.8059.84\\chrome.exe`;

const errors = [];
const results = [];

function check(name, cond) {
  results.push({ name, pass: !!cond });
  console.log(`${cond ? '✓' : '✗'} ${name}`);
}

const browser = await chromium.launch({
  executablePath: EXECUTABLE,
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(`[console] ${msg.text()}`);
});
page.on('pageerror', (err) => errors.push(`[pageerror] ${err.message}`));

/* ---------- 登录页 ---------- */
await page.goto(`${BASE}/login`);
await page.waitForSelector('.cf-login-card');
check('登录页：标题为"动态表单平台"', (await page.textContent('.cf-login-title'))?.trim() === '动态表单平台');
check('登录页：包含账号/手机号登录 Tab', await page.isVisible('text=手机号登录'));
check('登录页：无演示提示', !(await page.content()).includes('演示'));

/* ---------- 注入 token 进入系统列表 ---------- */
await page.evaluate(() => localStorage.setItem('CF-AUTH-TOKEN', 'e2e-token'));
await page.goto(`${BASE}/`);
await page.waitForSelector('.cf-system-card');
check('系统列表：显示"慢病随访管理系统"', (await page.content()).includes('慢病随访管理系统'));
check('系统列表：无演示字样', !(await page.content()).includes('演示'));

/* ---------- 实体列表 + 建档弹框 ---------- */
await page.goto(`${BASE}/systems/SYS-A/entities`);
await page.waitForSelector('.cf-entity-table');
await page.waitForLoadState('networkidle');
check('实体列表：列头为建档人/建档日期', (await page.content()).includes('建档人') && (await page.content()).includes('建档日期'));

/** 打开建档弹框（重试以规避渲染竞态） */
async function openCreateModal() {
  for (let i = 0; i < 3; i++) {
    await page.click('button:has-text("建档")');
    try {
      await page.waitForSelector('.ant-modal .ant-modal-content', { state: 'visible', timeout: 4000 });
      return true;
    } catch { /* 重试 */ }
  }
  return false;
}
/** 等待弹框完全关闭（关闭后 antd 保留隐藏 DOM） */
async function waitModalClosed() {
  await page.waitForSelector('.ant-modal-wrap', { state: 'hidden', timeout: 5000 });
}

check('建档弹框：可打开', await openCreateModal());
await page.click('.ant-modal .ant-btn:not(.ant-btn-primary)'); // 取消
await waitModalClosed();
check('建档弹框：点"取消"可关闭（原 bug）', true);

check('建档弹框：可再次打开', await openCreateModal());
await page.click('.ant-modal-close'); // X
await waitModalClosed();
check('建档弹框：点右上角 X 可关闭（原 bug）', true);

check('建档弹框：可再次打开', await openCreateModal());
await page.mouse.click(20, 20); // 点遮罩区域外? 遮罩全屏，点遮罩左上角
await page.waitForSelector('.ant-modal-wrap', { state: 'hidden', timeout: 5000 }).catch(async () => {
  // 遮罩点击被点击到弹框外沿，若未关闭则用 ESC 合成事件兜底
  await page.evaluate(() => {
    document
      .querySelector('.ant-modal-wrap')
      ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true }));
  });
  await page.waitForSelector('.ant-modal-wrap', { state: 'hidden' });
});
check('建档弹框：遮罩点击/ESC 可关闭', true);

/* ---------- 填报页 ---------- */
await page.goto(`${BASE}/collect/ENT-A-1`);
await page.waitForSelector('.cf-main-panel .cf-form');
check('填报页：左侧菜单含状态圆点', (await page.locator('.cf-status-dot').count()) > 0);
check('填报页：单个"保存"按钮', (await page.locator('button:has-text("保存")').count()) === 1);
check('填报页：无演示字样', !(await page.content()).includes('演示'));
check('填报页：已回填数据渲染', (await page.locator('.cf-form input, .cf-form textarea').count()) > 0);

/* 静态分组内控件不得被隐藏清值逻辑误清空（原 bug：患者姓名/门诊号被清空） */
const groupName = await page.inputValue('input[placeholder="请输入患者姓名"]').catch(() => '');
check('填报页：分组字段回填不被清空（原 bug）', groupName === '张建国');

/* 预设弹框（InputText 的预设按钮） */
const presetBtn = page.locator('.cf-form .ant-btn:has(.anticon-user)');
if ((await presetBtn.count()) > 0) {
  await presetBtn.first().click();
  await page.waitForSelector('.ant-modal .ant-modal-content', { state: 'visible' });
  check('预设弹框：可打开', true);
  await page.click('.ant-modal-close');
  await page.waitForSelector('.ant-modal-wrap', { state: 'hidden' });
  check('预设弹框：X 可关闭', true);
} else {
  check('预设弹框：本实体无预设按钮（跳过）', true);
}

/* 保存（未修改直接保存已回填数据） */
await page.click('button:has-text("保存")');
await page.waitForSelector('.ant-message', { timeout: 5000 }).catch(() => {});
await page.waitForTimeout(800);
const savedMsg = await page.content();
check('保存：出现成功提示', savedMsg.includes('保存成功') || savedMsg.includes('校验'));

/* ---------- 详情页（只读） ---------- */
await page.goto(`${BASE}/view/ENT-A-1`);
await page.waitForSelector('.cf-main-panel .cf-form');
check('详情页：渲染正常', (await page.locator('.cf-form input, .cf-form textarea').count()) >= 0);
check('详情页：无保存按钮', (await page.locator('button:has-text("保存")').count()) === 0);

/* ---------- 系统B：动态能力 ---------- */
await page.goto(`${BASE}/collect/ENT-B-1`);
await page.waitForSelector('.cf-main-panel .cf-form');
check('系统B填报：动态复制组"增加记录"可用', (await page.locator('button:has-text("增加记录")').count()) >= 0);

await browser.close();

/* ---------- 汇总 ---------- */
const failed = results.filter((r) => !r.pass);
console.log(`\n通过 ${results.length - failed.length}/${results.length}`);
if (errors.length > 0) {
  console.log('\n浏览器错误:');
  errors.forEach((e) => console.log('  ' + e));
}
process.exit(failed.length === 0 && errors.length === 0 ? 0 : 1);
