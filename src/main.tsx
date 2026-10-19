import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App as AntdApp, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { env } from '@/config/env';
import { useAuthStore } from '@/store/authStore';
import { App } from '@/App';
import '@/styles/index.scss';

dayjs.locale('zh-cn');

/** 入口：按环境启动 MSW Mock → 恢复登录态 → 挂载应用 */
async function bootstrap() {
  if (env.enableMsw) {
    const { worker } = await import('@/mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }

  // 从本地存储恢复令牌（路由守卫初始化）
  useAuthStore.getState().hydrate();

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: '#1677ff', borderRadius: 6 } }}>
        <AntdApp>
          <App />
        </AntdApp>
      </ConfigProvider>
    </StrictMode>,
  );
}

bootstrap();
