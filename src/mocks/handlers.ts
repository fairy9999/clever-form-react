/**
 * MSW 请求处理器：后端 100% Mock，无真实网络依赖。
 * 全部响应使用统一包裹 { code: 200, message, data }。
 */
import { HttpResponse, delay, http } from 'msw';
import { getAllChildren } from '@/utils/controls';
import type { FormMenuItem } from '@/types/form';
import type { CascadeNode } from '@/types/form';
import { buildFormDataMapBatch, db, ensureFormDataId } from './db';
import { randomHex32, uid } from './fixtures/shared';

const ok = <T>(data: T, message = 'OK') => HttpResponse.json({ code: 200, message, data });
const fail = (message: string, code = 400) =>
  HttpResponse.json({ code, message, data: null }, { status: 200 });

/** 级联数据（虚构三级行政区划风格的演示树） */
const CASCADE_TREE: Record<string, CascadeNode[]> = {
  '': [
    { value: 'east', label: '东区', isLeaf: false },
    { value: 'west', label: '西区', isLeaf: false },
  ],
  east: [
    { value: 'hangzhou', label: '杭州楼', isLeaf: false },
    { value: 'ningbo', label: '宁波楼', isLeaf: false },
  ],
  west: [{ value: 'chengdu', label: '成都楼', isLeaf: false }],
  'east/hangzhou': [
    { value: 'xihu', label: '西湖机房', isLeaf: true },
    { value: 'binjiang', label: '滨江机房', isLeaf: true },
  ],
  'east/ningbo': [{ value: 'haishu', label: '海曙机房', isLeaf: true }],
  'west/chengdu': [{ value: 'wuhou', label: '武侯机房', isLeaf: true }],
};

/** 简单验证码 SVG（data URI） */
function makeCaptchaImg(code: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="90" height="32"><rect width="90" height="32" fill="#f0f2f5"/><text x="12" y="22" font-size="18" font-family="monospace" fill="#333" letter-spacing="4">${code}</text><line x1="4" y1="26" x2="86" y2="8" stroke="#bbb"/></svg>`;
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

export const handlers = [
  /* ---------- 认证 ---------- */
  http.get('*/api/auth/captcha', async () => {
    const code = Math.random().toString(36).slice(2, 6).toUpperCase();
    const id = uid('cap');
    db.captchas.set(id, code);
    return ok({ id, imgBase64: makeCaptchaImg(code) });
  }),

  http.post('*/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as {
      username: string;
      password: string;
      captchaId: string;
      captchaCode: string;
    };
    const expect = db.captchas.get(body.captchaId);
    db.captchas.delete(body.captchaId);
    if (!expect || expect.toUpperCase() !== String(body.captchaCode ?? '').toUpperCase()) {
      return fail('验证码不正确');
    }
    const user = db.users.find((u) => u.username === body.username && u.password === body.password);
    if (!user) return fail('账号或密码不正确');
    return ok({ token: `demo-token-${randomHex32().slice(0, 16)}` });
  }),

  /* ---------- 系统 / 实体 ---------- */
  http.get('*/api/systems', async () => ok(db.systems)),

  http.get('*/api/entities', async ({ request }) => {
    const systemId = new URL(request.url).searchParams.get('systemId');
    return ok(db.entities.filter((e) => !systemId || e.systemId === systemId));
  }),

  http.get('*/api/entities/detail', async ({ request }) => {
    const entityId = new URL(request.url).searchParams.get('entityId');
    const entity = db.entities.find((e) => e.entityId === entityId);
    return entity ? ok(entity) : fail('实体不存在');
  }),

  http.post('*/api/entities/create', async ({ request }) => {
    const body = (await request.json()) as {
      systemId: string;
      entityName: string;
      extraJson?: Record<string, unknown>;
    };
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const entity = {
      entityId: `ENT-${Date.now().toString(36).toUpperCase()}`,
      systemId: body.systemId,
      entityName: body.entityName,
      creatorName: '系统管理员',
      createDate: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
      dataJson: JSON.stringify(body.extraJson ?? {}),
    };
    db.entities.unshift(entity);
    return ok(entity);
  }),

  http.post('*/api/entities/delete', async ({ request }) => {
    const { entityId } = (await request.json()) as { entityId: string };
    const idx = db.entities.findIndex((e) => e.entityId === entityId);
    if (idx === -1) return fail('实体不存在');
    db.entities.splice(idx, 1);
    delete db.savedData[entityId];
    return ok({ deleted: true });
  }),

  /* ---------- 表单定义 ---------- */
  http.get('*/api/forms/by-system', async ({ request }) => {
    const systemId = new URL(request.url).searchParams.get('systemId') ?? '';
    const forms = db.formsBySystem[systemId] ?? [];
    const items: FormMenuItem[] = forms.map((f) => ({
      formId: f.formId,
      formName: f.formName,
      formOrder: f.formOrder,
      enabled: f.enabled,
      controlCount: getAllChildren(f.tree).filter((c) => c.selectedControlType !== 'group-box').length,
      formLayout: f.formLayout,
      formDesc: f.formDesc,
    }));
    return ok(items);
  }),

  http.get('*/api/forms/controls-tree', async ({ request }) => {
    const formId = new URL(request.url).searchParams.get('formId') ?? '';
    for (const forms of Object.values(db.formsBySystem)) {
      const form = forms.find((f) => f.formId === formId);
      if (form) {
        return ok({
          metadata: {
            formId: form.formId,
            formName: form.formName,
            formLayout: form.formLayout,
            syncFromEntity: form.syncFromEntity,
          },
          data: form.tree,
        });
      }
    }
    return fail('表单不存在');
  }),

  http.get('*/api/forms/menu-rules', async ({ request }) => {
    const systemId = new URL(request.url).searchParams.get('systemId') ?? '';
    return ok(db.menuRules[systemId] ?? []);
  }),

  /* ---------- 表单数据 ---------- */
  http.get('*/api/form-data/map-batch', async ({ request }) => {
    const entityId = new URL(request.url).searchParams.get('entityId') ?? '';
    return ok(buildFormDataMapBatch(entityId));
  }),

  http.get('*/api/form-data/detail', async ({ request }) => {
    const url = new URL(request.url);
    const entityId = url.searchParams.get('entityId') ?? '';
    const formId = url.searchParams.get('formId') ?? '';
    const rec = db.savedData[entityId]?.[formId];
    return ok({
      metadata: { formId, formInstanceId: rec?.formDataId ?? '' },
      data: rec?.data ?? {},
    });
  }),

  http.post('*/api/form-data/save', async ({ request }) => {
    const body = (await request.json()) as {
      entityId: string;
      formId: string;
      data: Record<string, unknown>;
      isComplete: boolean;
    };
    if (!body.entityId || !body.formId) return fail('参数缺失');
    const formDataId = ensureFormDataId(body.entityId, body.formId);
    const rec = db.savedData[body.entityId][body.formId];
    rec.data = body.data ?? {};
    rec.status = body.isComplete ? 3 : 2;
    return ok({ formDataId, formEntryStatus: rec.status });
  }),

  /* ---------- 上传（内存存储） ---------- */
  http.post('*/api/upload', async ({ request }) => {
    const form = await request.formData();
    const files = form.getAll('files').filter((f): f is File => f instanceof File);
    if (files.length === 0) return fail('未选择文件');
    const results = [];
    for (const file of files) {
      const sizeLimit = 20 * 1024 * 1024;
      if (file.size > sizeLimit) {
        results.push({ success: false, name: file.name, message: '文件超过 20MB 限制' });
        continue;
      }
      const stored = `${randomHex32()}_${file.name}`;
      db.uploads.set(stored, { blob: file, type: file.type, size: file.size });
      results.push({ success: true, name: stored });
    }
    return ok(results);
  }),

  http.post('*/api/upload/delete', async ({ request }) => {
    const { fileName } = (await request.json()) as { fileName: string };
    db.uploads.delete(fileName);
    return ok({ deleted: true });
  }),

  http.get('*/api/upload/preview', async ({ request }) => {
    const name = new URL(request.url).searchParams.get('name') ?? '';
    const rec = db.uploads.get(name);
    if (!rec) return new HttpResponse('文件不存在', { status: 404 });
    return new HttpResponse(rec.blob, { headers: { 'Content-Type': rec.type || 'application/octet-stream' } });
  }),

  /* ---------- 级联 / 预设 ---------- */
  http.get('*/api/cascade', async ({ request }) => {
    const parent = new URL(request.url).searchParams.get('parent') ?? '';
    await delay(120);
    return ok(CASCADE_TREE[parent] ?? []);
  }),

  http.get('*/api/presets/personnel', async () =>
    ok([
      { Name: '王志强', Tel_No: '13800000001' },
      { Name: '李建国', Tel_No: '13900000002' },
      { Name: '赵国栋', Tel_No: '13700000003' },
    ]),
  ),

  http.get('*/api/presets/areas', async () =>
    ok([
      { UAName: '示范园区 1 号楼', UACode: 'UA-001' },
      { UAName: '示范园区 2 号楼', UACode: 'UA-002' },
    ]),
  ),
];
