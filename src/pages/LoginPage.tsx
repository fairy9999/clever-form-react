import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { App, Button, Form, Input, Tabs } from 'antd';
import { LockOutlined, MobileOutlined, UserOutlined } from '@ant-design/icons';
import { getCaptcha, login } from '@/api';
import { useAuthStore } from '@/store/authStore';
import { APP_NAME } from '@/config/env';

type AccountValues = { username: string; password: string; captchaCode: string };
type MobileValues = { mobile: string; password: string; captchaCode: string };

/** 登录页 */
export function LoginPage() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const auth = useAuthStore();
  const [captcha, setCaptcha] = useState<{ id: string; imgBase64: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'account' | 'mobile'>('account');

  const refreshCaptcha = () => {
    getCaptcha().then(setCaptcha);
  };

  useEffect(() => {
    refreshCaptcha();
  }, []);

  const doLogin = async (account: string, password: string, captchaId: string, captchaCode: string) => {
    setLoading(true);
    try {
      const result = await login(account, password, captchaId, captchaCode);
      auth.setToken(result.token);
      message.success('登录成功');
      navigate('/', { replace: true });
    } catch (e) {
      message.error(e instanceof Error ? e.message : '登录失败');
      refreshCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cf-login-page">
      <div className="cf-login-card">
        <div className="cf-login-title">{APP_NAME}</div>
        <Tabs
          centered
          activeKey={activeTab}
          onChange={(k) => setActiveTab(k as 'account' | 'mobile')}
          items={[
            { key: 'account', label: '账号登录' },
            { key: 'mobile', label: '手机号登录' },
          ]}
        />
        {activeTab === 'account' ? (
          <Form<AccountValues>
            layout="vertical"
            requiredMark={false}
            onFinish={(v) => captcha && void doLogin(v.username, v.password, captcha.id, v.captchaCode)}
          >
            <Form.Item name="username" rules={[{ required: true, message: '请输入账号' }]}>
              <Input prefix={<UserOutlined />} placeholder="账号" size="large" autoComplete="off" />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
            </Form.Item>
            <Form.Item name="captchaCode" rules={[{ required: true, message: '请输入验证码' }]}>
              <div className="cf-captcha-row">
                <Input prefix={<LockOutlined />} placeholder="验证码" size="large" maxLength={4} autoComplete="off" />
                {captcha && (
                  <img
                    className="cf-captcha-img"
                    src={captcha.imgBase64}
                    alt="验证码"
                    title="点击刷新"
                    onClick={refreshCaptcha}
                  />
                )}
              </div>
            </Form.Item>
            <Button type="primary" htmlType="submit" size="large" block loading={loading}>
              {loading ? '登录中...' : '登 录'}
            </Button>
          </Form>
        ) : (
          <Form<MobileValues>
            layout="vertical"
            requiredMark={false}
            onFinish={(v) => captcha && void doLogin(v.mobile, v.password, captcha.id, v.captchaCode)}
          >
            <Form.Item name="mobile" rules={[{ required: true, message: '请输入手机号' }]}>
              <Input prefix={<MobileOutlined />} placeholder="手机号" size="large" autoComplete="off" />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
            </Form.Item>
            <Form.Item name="captchaCode" rules={[{ required: true, message: '请输入验证码' }]}>
              <div className="cf-captcha-row">
                <Input prefix={<LockOutlined />} placeholder="验证码" size="large" maxLength={4} autoComplete="off" />
                {captcha && (
                  <img
                    className="cf-captcha-img"
                    src={captcha.imgBase64}
                    alt="验证码"
                    title="点击刷新"
                    onClick={refreshCaptcha}
                  />
                )}
              </div>
            </Form.Item>
            <Button type="primary" htmlType="submit" size="large" block loading={loading}>
              {loading ? '登录中...' : '登 录'}
            </Button>
          </Form>
        )}
        <div className="cf-login-footer">Copyright © {new Date().getFullYear()} Dynamic Form Platform</div>
      </div>
    </div>
  );
}
