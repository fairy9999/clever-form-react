import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Col, Empty, Pagination, Row, Spin, Typography } from 'antd';
import { FolderOpenOutlined, LogoutOutlined, ReloadOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { getSystems } from '@/api';
import { useAuthStore } from '@/store/authStore';
import type { SystemItem } from '@/types/form';

const PAGE_SIZE = 8;

/** 系统列表（首页） */
export function SystemListPage() {
  const navigate = useNavigate();
  const auth = useAuthStore();
  const [systems, setSystems] = useState<SystemItem[] | null>(null);
  const [page, setPage] = useState(1);

  const load = () => {
    getSystems().then(setSystems);
  };

  useEffect(load, []);

  const pageData = useMemo(() => {
    if (!systems) return [];
    return systems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [systems, page]);

  return (
    <div className="cf-page">
      <div className="cf-page-head">
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            系统列表
          </Typography.Title>
          <Typography.Text type="secondary">
            共 {systems?.length ?? 0} 个业务系统，点击卡片进入档案列表
          </Typography.Text>
        </div>
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
      ) : systems.length === 0 ? (
        <Empty description="暂无系统" />
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {pageData.map((s) => (
              <Col xs={24} md={12} xl={6} key={s.systemId}>
                <Card
                  hoverable
                  className="cf-system-card"
                  onClick={() => navigate(`/systems/${s.systemId}/entities`)}
                >
                  <div className="cf-system-card-head">
                    <span className="cf-system-card-icon">
                      <FolderOpenOutlined />
                    </span>
                    <span className="cf-system-card-title" title={s.systemName}>
                      {s.systemName}
                    </span>
                  </div>
                  <p className="cf-card-desc">{s.systemDesc}</p>
                  <div className="cf-card-meta">
                    <span>
                      <UserOutlined /> {s.creatorName}
                    </span>
                    <span>{s.createDate.slice(0, 10)}</span>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
          <div className="cf-pagination">
            <TeamOutlined style={{ marginRight: 8 }} />
            <Pagination
              current={page}
              pageSize={PAGE_SIZE}
              total={systems.length}
              onChange={setPage}
              showSizeChanger={false}
              showTotal={(t) => `共 ${t} 个系统`}
            />
          </div>
        </>
      )}
    </div>
  );
}
