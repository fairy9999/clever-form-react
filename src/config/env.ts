/**
 * 运行环境配置。所有取值均来自环境变量，源码中不出现任何真实环境地址。
 */
const raw = import.meta.env;

export const env = {
  /** 接口基础路径 */
  apiBaseUrl: (raw.VITE_API_BASE_URL as string) || '/api',
  /** 是否启用 MSW 浏览器端 Mock */
  enableMsw: raw.VITE_ENABLE_MSW !== 'false',
  /** 是否启用动态脚本执行（默认关闭，见 src/runtime/safeJsExecutor.ts） */
  enableSafeJs: raw.VITE_ENABLE_SAFE_JS === 'true',
  /** 本地令牌存储键 */
  tokenKey: (raw.VITE_TOKEN_KEY as string) || 'CF-AUTH-TOKEN',
} as const;

export const APP_NAME = '动态表单工具';
