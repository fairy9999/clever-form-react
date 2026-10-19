import { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Spin } from 'antd';
import { router } from '@/router';

/** 应用根组件：路由装载 */
export function App() {
  return (
    <Suspense
      fallback={
        <div className="cf-center">
          <Spin tip="页面加载中..." />
        </div>
      }
    >
      <RouterProvider router={router} />
    </Suspense>
  );
}
