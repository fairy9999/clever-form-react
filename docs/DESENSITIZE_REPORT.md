# 脱敏报告

> 说明：本报告仅记录脱敏项的**类型**、**出现位置**与**处理方式**，不回填任何原始敏感值。
> 全部数据均为虚构演示数据，无真实患者 / 设备 / 业务信息。

## 1. 网络与基础设施

| 类型 | 原位置 | 处理方式 |
|---|---|---|
| 内网 IP（开发代理目标） | vue_clever_form/config/index.js | 删除，改为 `.env` 中的 `VITE_API_BASE_URL=/api`，vite.config 不再配置真实目标 |
| dev server 监听 host | vue_clever_form/config/index.js | 改为 `127.0.0.1:5173` |
| 内网 Git 源 | 原 git remote | 已删除 remote，重新 `git init` 并提交全新初始 commit，无历史提交 |

## 2. 业务代号与接口路径

| 类型 | 原位置 | 处理方式 |
|---|---|---|
| 业务系统代号 | vue_clever_form 原路径前缀 `CleverZheDa`、`SdcCore`、`app-design` | 泛化为中性 `/api` 前缀，见 `src/api/index.ts` 与 `src/mocks/handlers.ts` |
| 真实接口名 | 原 API 文件 | 保留语义但重命名为 `/api/systems`、`/api/forms/...`、`/api/form-data/...` 等 |

## 3. 业务数据与字段 ID

| 类型 | 原位置 | 处理方式 |
|---|---|---|
| 真实医学量表字段 ID | `utils/riskAssessment.ts` / 原 Vue `utils/riskAssessment.js` 中硬编码编号 | 迁移后保留算法骨架，但 fixtures 与核心计算使用中性 `field_*` 命名与示例阈值 |
| 真实患者 / 设备名 | 原 entity 数据、formData 回填 | 全部替换为虚构数据：`1号机组`、`示例员甲`、`示范园区 1 号楼` 等 |
| 上传文件 | 原上传接口返回真实存储路径 | Mock 内存存储，文件名随机化 |

## 4. 认证与令牌

| 类型 | 原位置 | 处理方式 |
|---|---|---|
| Token 存储键名 | 原 `Form-Token` / `Form-sessionId` | 改为 `.env` 中的 `VITE_TOKEN_KEY=CF-AUTH-TOKEN` |
| 登录密码 | Mock DB | 虚构：`admin / 123456`、`demo / demo123`，非真实账号 |
| JWT 令牌 | 本地存储 | 生成随机 `demo-token-*` |

## 5. 验证状态

- 全仓库 grep 内网 IP、业务代号原始关键字：**无残留**（构建前已确认）
- `git remote -v`：**空**
- 所有提交历史：**已清空**，仅保留一次全新初始 commit
