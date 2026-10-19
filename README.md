# clever-form-react

基于 schema 驱动的 React 动态表单渲染引擎，由 Vue 2 动态表单系统迁移重构而来。

```bash
npm install
npm run dev        # 默认 MSW Mock，无需后端
npm run build      # 生产构建
npm run test       # Vitest 单测
```

## 在线演示能力（2 套 Mock fixtures）

| 演示系统 | 入口 | 覆盖能力 |
|---|---|---|
| 示例·设备巡检管理系统 | 登录后选第一个系统 | 14 类控件 + 静态分组 + 预设回填 + 实体数据同步 + 附件上传 + 菜单显隐规则 |
| 示例·动态表单能力演示 | 登录后选第二个系统 | 控件联动显隐 / 选项过滤 / 单位值依赖 / 动态复制组 / 评分自动汇总 |

默认演示账号：`admin` / `123456`（验证码需按页面显示填写，纯前端 Mock）。

## 技术栈

React 18 · TypeScript · Vite 5 · Ant Design 5 · Zustand · React Router 6 · MSW · Vitest · Sass

## 关键设计

- **schema 驱动**：后端返回 JSON 配置，前端渲染控件树，零硬编码业务字段。
- **统一控件契约**：所有控件遵循 `config / value / onChange / formContext`。
- **显隐规则引擎**：DISPLAY / SKIP / default / 选项过滤，支持跨表单依赖。
- **动态复制组**：记录级克隆、增删、独立显隐评估。
- **不可变更新**：React 侧显式不可变 setState，替代原 Vue `this.$set`。
- **可插拔脚本执行**：后端下发 `jsCode` 统一走 `src/runtime/safeJsExecutor.ts`，默认关闭。

## 目录结构

```
src/
  api/                  # axios 请求封装
  components/controls/  # 14 个表单控件
  components/form/      # FormRenderer / GroupBoxRenderer / ControlItem / ControlRenderer
  config/               # 环境配置与常量
  mocks/                # MSW handlers + 2 套 fixtures + 内存 DB
  pages/                # Login / SystemList / EntityList / FormPage
  router/               # 路由表与登录守卫
  runtime/              # safeJsExecutor
  store/                # Zustand（authStore / sessionStore）
  styles/               # 全局 scss
  types/                # TS 类型
  utils/                # 核心引擎：visibility / validation / expression / path / controls ...
docs/
  MIGRATION_REPORT.md   # 迁移报告与 Vue→React 映射表
  DESENSITIZE_REPORT.md # 脱敏记录
```

## 切换真实后端

`.env` 中修改：

```
VITE_USE_MSW=false
VITE_API_BASE_URL=http://your-api/api
```

接口路径见 `src/api/index.ts`。

## 状态

已完成迁移，构建通过，59 个单元测试通过，浏览器验证可跑通登录 → 系统列表 → 实体列表 → 填报/详情 → 保存全链路。
