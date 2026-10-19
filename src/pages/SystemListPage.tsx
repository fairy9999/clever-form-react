import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Col, Row, Spin, Typography } from 'antd';
import { LogoutOutlined, ReloadOutlined } from '@ant-design/icons';
import { getSystems } from '@/api';
import { useAuthStore } from '@/store/authStore';
import type { SystemItem } from '@/types/form';

/** 系统列表（首页） */
export function SystemListPage() {
  const navigate = useNavigate();
  const auth = useAuthStore();
  const [systems, setSystems] = useState<SystemItem[] | null>(null);

  const load = () => {
    getSystems().then(setSystems);
  };

  useEffect(load, []);

  return (
    <div className="cf-page">
      <div className="cf-page-head">
        <Typography.Title level={3} style={{ margin: 0 }}>
          系统列表
        </Typography.Title>
        <div>
          <Button icon={<ReloadOutlined />} onClick={load} style={{ marginRight: 8 }}>
            刷新
          </Button>
          <Button icon={<LogoutOutlined />} onClick={() => { auth.logout(); navigate('/login', { replace: true }); }}>
            退出登录
          </Button>
        </div>
      </div>
      {!systems ? (
        <div className="cf-center"><Spin /></div>
      ) : (
        <Row gutter={[16, 16]}>
          {systems.map((s) => (
            <Col xs={24} md={12} xl={6} key={s.systemId}>
              <Card
                hoverable
                className="cf-system-card"
                title={s.systemName}
                onClick={() => navigate(`/systems/${s.systemId}/entities`)}
              >
                <p className="cf-card-line">创建者：{s.creatorName}</p>
                <p className="cf-card-line">创建日期：{s.createDate}</p>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
