import axios from 'axios';
import { env } from '@/config/env';
import { useAuthStore } from '@/store/authStore';

/** 统一响应包裹 */
interface Envelope<T = unknown> {
  code: number | string;
  message?: string;
  data: T;
}

export const http = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 15000,
});

http.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => {
    const body = response.data as Envelope;
    // Mock 与真实后端约定：code 200 / '200' / 'OK' 均视为成功
    if (body && typeof body === 'object' && 'code' in body) {
      if (String(body.code) !== '200' && body.code !== 'OK') {
        return Promise.reject(new Error(body.message || `请求失败（${body.code}）`));
      }
      return body.data as never;
    }
    return response.data as never;
  },
  (error) => {
    if (error?.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(new Error(error?.response?.data?.message || error?.message || '网络异常'));
  },
);

/** 类型化 GET/POST 快捷方法 */
export function getData<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  return http.get(url, { params }) as Promise<T>;
}

export function postData<T>(url: string, body?: unknown): Promise<T> {
  return http.post(url, body) as Promise<T>;
}
