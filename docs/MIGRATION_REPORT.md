# 迁移报告

> 源：`vue_clever_form`
> 目标：`clever-form-react`（React 18 + TypeScript + Vite 5 + Ant Design 5 + Zustand + React Router 6）

## 1. 迁移映射表

| 源文件（Vue） | 目标文件（React） | 说明 |
|---|---|---|
| `src/main.js` | `src/main.tsx` | 入口；新增 MSW 异步启动 |
| `src/App.vue` | `src/App.tsx` | 路由挂载 |
| `src/router/index.js` | `src/router/index.tsx` | React Router 6，含登录守卫 |
| `src/views/form.vue` | `src/pages/FormPage.tsx` | 工作台：左侧菜单 + 表单渲染 + 保存 |
| `src/views/data-collect.vue` | `src/pages/FormPage.tsx mode=collect` | 合并为同一组件 |
| `src/views/data-view.vue` | `src/pages/FormPage.tsx mode=view` | 合并为同一组件 |
| `src/views/system-list.vue` | `src/pages/SystemListPage.tsx` | — |
| `src/views/entity-list.vue` | `src/pages/EntityListPage.tsx` | — |
| `src/views/login.vue` | `src/pages/LoginPage.tsx` | — |
| `src/views/mainForm.vue` | `src/pages/FormPage.tsx` | 功能已合并到 FormPage |
| `src/components/Control*.vue` × 14 | `src/components/controls/*.tsx` | 逐个迁移 |
| `src/components/formIndex.vue` | — | 孤儿文件，无人引用，已丢弃 |
| `src/store/*`（Vuex） | `src/store/*Store.ts`（Zustand） | 拆为 authStore / sessionStore |
| `src/utils/*.js` | `src/utils/*.ts` | 纯 JS 逻辑 1:1 迁移，补充单测 |
| `src/api/*.js` | `src/api/*.ts` | 路径泛化 |
| `src/styles/*.scss` | `src/styles/index.scss` | 复用类名体系 |
| `build/` + `config/`（webpack） | `vite.config.ts` | Vite 替代 webpack |
| 真实后端 | `src/mocks/*` | MSW 100% Mock |

## 2. Vue → React 关键特性映射

| Vue 特性 | React 实现 | 注意点 |
|---|---|---|
| `v-model` | `value + onChange` 受控组件 | 所有控件统一 props |
| `v-if` | `{cond && <X/>}` | — |
| `v-show` | `style={{ display }}` | — |
| `this.$set` | 不可变更新 `setIn` / `setControlValue` | 路径写入时沿路径浅克隆 |
| `watch: { deep: true }` | `useMemo` / `useEffect` | 显式声明依赖 |
| `computed` | `useMemo` | — |
| `$refs` | `useRef` | 仅 Upload 等控件内部使用 |
| `$emit` | 回调 props | `onChange` / `onBatchChange` |
| Vuex | Zustand | 登录态持久化到 localStorage |
| `Vue.nextTick` | 直接 setState（React 批处理） | 无需显式 nextTick |
| 动态组件 | `ControlRenderer` switch | 根据 `selectedControlType` 分发 |

## 3. 迁移中遇到的问题与解法

### 问题 1：原项目存在孤儿文件

- `src/components/formIndex.vue` 引用不存在的 `@/components/dynamicForm/index`。
- 审计后发现该文件本身无人引用，不影响构建，迁移时直接丢弃。
- 真正的渲染器是 `src/views/form.vue`（1296 行）。

### 问题 2：后端下发 jsCode 的执行风险

- 原 `form.vue` / `mainForm.vue` 大量使用 `new Function(jsCode)` 与 `eval()`。
- 本期不迁移执行能力，统一用 `src/runtime/safeJsExecutor.ts` 桩替代，默认关闭，保留 TODO。

### 问题 3：动态复制组的显隐状态串扰

- Vue 版 `this.$set` 响应式新增字段，React 必须显式不可变更新。
- 解法：`cloneChildrenForRecord` 为每条记录克隆控件并打 `_isDynamicClone` 标记，`path.ts` 按 `_dynamicGroupPath` + `_dynamicIndex` 从记录数组读写。

### 问题 4：跨表单依赖与菜单显隐

- Vue 版通过全局 this / Vuex 跨表单读取；React 版通过 `sessionStore.dataByFormId` 集中管理，页面初始化时批量加载各表单已存数据。

### 问题 5：分组路径存储

- 原 `customGroup` 字段数据存在 `_custom_group_<name>` 对象下。
- `path.ts` 用 `getPropName` / `splitPath` 统一处理顶层、分组、动态记录三种路径。

## 4. 已知差异与未完成项

| 项 | 状态 | 说明 |
|---|---|---|
| jsCode 动态执行 | 挂起 | 已加 safeJsExecutor 桩，待后端 jsCode 契约明确后启用 |
| InputControl.vue | 未迁移 | 原组件无人引用，视为历史遗留 |
| UploadControlForClever.vue | 未迁移 | 同上 |
| 分片上传 | 未迁移 | 原仅在 APP 端使用，当前 Web 版用普通上传 |
| 表单之间显隐实时联动 | 已实现 | 通过 sessionStore 批量加载已存数据 |
| 控件默认值恢复 | 已实现 | `clear.ts` 对 disabled 控件回填默认值 |

## 5. 验证结果

- `npx tsc --noEmit`：通过
- `npm run test`：59 个单测通过
- `npm run build`：通过
- 浏览器实测：登录 → 系统列表 → 实体列表 → 填报/详情 → 切换表单 → 保存全链路可跑通
