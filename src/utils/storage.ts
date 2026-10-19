/**
 * 本地令牌存取。键名由环境变量 VITE_TOKEN_KEY 决定，
 * localStorage 不可用（隐私模式 / 测试环境）时静默降级为内存。
 */
export interface TokenStorage {
  get(): string | null;
  set(token: string): void;
  clear(): void;
}

export function createTokenStorage(key: string): TokenStorage {
  let memory: string | null = null;
  const available = (() => {
    try {
      return typeof localStorage !== 'undefined';
    } catch {
      return false;
    }
  })();
  return {
    get() {
      if (!available) return memory;
      try {
        return localStorage.getItem(key);
      } catch {
        return memory;
      }
    },
    set(token: string) {
      memory = token;
      if (!available) return;
      try {
        localStorage.setItem(key, token);
      } catch {
        /* 降级为内存 */
      }
    },
    clear() {
      memory = null;
      if (!available) return;
      try {
        localStorage.removeItem(key);
      } catch {
        /* 忽略 */
      }
    },
  };
}
