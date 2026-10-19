import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { App, Button, Form, Input, Modal, Popconfirm, Space, Table, Typography } from 'antd';
import { ArrowLeftOutlined, DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { createEntity, deleteEntity, getEntities, getSystems } from '@/api';
import { useSessionStore } from '@/store/sessionStore';
import type { EntityItem } from '@/types/form';

/** 实体列表（建档 / 数据录入 / 详情查看） */
export function EntityListPage() {
  const { systemId = '' } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const setSystem = useSessionStore((s) => s.setSystem);
  const system = useSessionStore((s) => s.system);
  const [entities, setEntities] = useState<EntityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (!systemId) return;
    // 直接刷新进入时 sessionStore 为空，从系统列表恢复当前系统
    if (!system || system.systemId !== systemId) {
      getSystems().then((list) => setSystem(list.find((s) => s.systemId === systemId) ?? null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [systemId]);

  const load = () => {
    setLoading(true);
    getEntities(systemId)
      .then(setEntities)
      .finally(() => setLoading(false));
  };

  useEffect(load, [systemId]);

  const columns = [
    { title: '档案名称', dataIndex: 'entityName' },
    { title: '建档人', dataIndex: 'creatorName', width: 140 },
    { title: '建档日期', dataIndex: 'createDate', width: 180 },
    {
      title: '操作',
      width: 260,
      render: (_: unknown, record: EntityItem) => (
        <Space>
          <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => navigate(`/collect/${record.entityId}`)}>
            录入
          </Button>
          <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/view/${record.entityId}`)}>
            详情
          </Button>
          <Popconfirm
            title="提示"
            description="您确定要删除这条记录吗？此操作不可撤销。"
            okText="确定"
            cancelText="取消"
            onConfirm={async () => {
              await deleteEntity(record.entityId);
              message.success('删除成功');
              load();
            }}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleCreate = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      const extraJson: Record<string, unknown> = {};
      if (values.patientName) extraJson.patientName = values.patientName;
      if (values.patientNo) extraJson.patientNo = values.patientNo;
      await createEntity({ systemId, entityName: values.entityName, extraJson });
      message.success('创建成功');
      setCreateOpen(false);
      load();
    } catch (e) {
      message.error(e instanceof Error ? e.message : '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cf-page">
      <div className="cf-page-head">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}/>
          <Typography.Title level={3} style={{ margin: 0 }}>
            {system?.systemName ?? systemId}
          </Typography.Title>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setCreateOpen(true); }}>
          建档
        </Button>
      </div>
      <Table
        rowKey="entityId"
        columns={columns}
        dataSource={entities}
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: false, showTotal: (t) => `共 ${t} 条档案` }}
        // scroll={{ y: 440 }}
        className="cf-entity-table"
      />

      <Modal
        title="建档"
        open={createOpen}
        okText="确 定"
        cancelText="取 消"
        confirmLoading={submitting}
        onOk={() => void handleCreate()}
        onCancel={() => setCreateOpen(false)}
        width={480}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="entityName" label="档案名称" rules={[{ required: true, message: '请输入档案名称' }]}>
            <Input placeholder="请输入档案名称，如：张建国高血压随访档案" />
          </Form.Item>
          <Form.Item name="patientName" label="患者姓名">
            <Input placeholder="请输入患者姓名" />
          </Form.Item>
          <Form.Item name="patientNo" label="病历号">
            <Input placeholder="请输入病历号" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
