import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { createBrowserRouter } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { LoginPage } from '@/pages/LoginPage';
import { SystemListPage } from '@/pages/SystemListPage';
import { EntityListPage } from '@/pages/EntityListPage';
import { FormPage } from '@/pages/FormPage';

/** 登录守卫：无令牌跳转登录页，记住来源路径 */
function RequireAuth() {
  const token = useAuthStore((s) => s.token);
  const location = useLocation();
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}

/**
 * 路由表（对齐原 Vue 版 8 条路由的演示范围）：
 * /login                    登录
 * /                         系统列表（首页）
 * /systems/:systemId/entities  实体列表（建档）
 * /collect/:entityId        填报（编辑态，对应原 data-collect）
 * /view/:entityId           详情（只读态，对应原 data-view）
 */
export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <RequireAuth />,
    children: [
      { index: true, element: <SystemListPage /> },
      { path: 'systems/:systemId/entities', element: <EntityListPage /> },
      { path: 'collect/:entityId', element: <FormPage mode="collect" /> },
      { path: 'view/:entityId', element: <FormPage mode="view" /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
