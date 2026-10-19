import { create } from 'zustand';
import { env } from '@/config/env';
import { createTokenStorage } from '@/utils/storage';

const tokenStorage = createTokenStorage(env.tokenKey);

interface AuthState {
  token: string | null;
  /** 已在本地存在令牌（用于路由守卫初始化） */
  hydrate: () => void;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  hydrate: () => set({ token: tokenStorage.get() }),
  setToken: (token) => {
    tokenStorage.set(token);
    set({ token });
  },
  logout: () => {
    tokenStorage.clear();
    set({ token: null });
  },
}));
