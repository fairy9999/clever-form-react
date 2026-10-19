import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, App, Button, Card, Form, Input } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { getCaptcha, login } from '@/api';
import { useAuthStore } from '@/store/authStore';
import { APP_NAME } from '@/config/env';

/** 登录页（Mock 账号：admin / 123456） */
export function LoginPage() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const auth = useAuthStore();
  const [captcha, setCaptcha] = useState<{ id: string; imgBase64: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshCaptcha = () => {
    getCaptcha().then(setCaptcha);
  };

  useEffect(() => {
    refreshCaptcha();
  }, []);

  const onFinish = async (values: { username: string; password: string; captchaCode: string }) => {
    if (!captcha) return;
    setLoading(true);
    try {
      const result = await login(values.username, values.password, captcha.id, values.captchaCode);
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
      <Card className="cf-login-card" title={`${APP_NAME} · 动态表单演示`}>
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="演示账号：admin / 123456（纯前端 Mock，无真实后端）"
        />
        <Form layout="vertical" onFinish={(v) => void onFinish(v as never)}>
          <Form.Item name="username" rules={[{ required: true, message: '请输入账号' }]} initialValue="admin">
            <Input prefix={<UserOutlined />} placeholder="账号" size="large" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]} initialValue="123456">
            <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
          </Form.Item>
          <Form.Item name="captchaCode" rules={[{ required: true, message: '请输入验证码' }]}>
            <div className="cf-captcha-row">
              <Input placeholder="验证码" size="large" maxLength={4} />
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
            登录
          </Button>
        </Form>
      </Card>
    </div>
  );
}
