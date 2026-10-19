import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { App, Button, Form, Input, Modal, Popconfirm, Space, Table, Typography } from 'antd';
import { ArrowLeftOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { createEntity, deleteEntity, getEntities } from '@/api';
import { useSessionStore } from '@/store/sessionStore';
import type { EntityItem } from '@/types/form';

/** 实体列表（建档 / 进入填报 / 查看详情） */
export function EntityListPage() {
  const { systemId = '' } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const setSystem = useSessionStore((s) => s.setSystem);
  const system = useSessionStore((s) => s.system);
  const [entities, setEntities] = useState<EntityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form] = Form.useForm();

  const load = () => {
    setLoading(true);
    getEntities(systemId)
      .then(setEntities)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [systemId]);

  const columns = [
    { title: '实体名称', dataIndex: 'entityName' },
    { title: '创建人', dataIndex: 'creatorName', width: 140 },
    { title: '创建时间', dataIndex: 'createDate', width: 180 },
    {
      title: '操作',
      width: 260,
      render: (_: unknown, record: EntityItem) => (
        <Space>
          <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => navigate(`/collect/${record.entityId}`)}>
            填报
          </Button>
          <Button size="small" onClick={() => navigate(`/view/${record.entityId}`)}>
            详情
          </Button>
          <Popconfirm
            title="确认删除该实体？"
            description="实体及其表单数据将一并删除"
            okText="删除"
            cancelText="取消"
            onConfirm={async () => {
              await deleteEntity(record.entityId);
              message.success('已删除');
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

  return (
    <div className="cf-page">
      <div className="cf-page-head">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}/>
          <Typography.Title level={3} style={{ margin: 0 }}>
            {system?.systemName ?? systemId} · 实体列表
          </Typography.Title>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setCreateOpen(true); }}>
          新建实体
        </Button>
      </div>
      <Table rowKey="entityId" columns={columns} dataSource={entities} loading={loading} pagination={false} />

      <Modal
        title="新建实体"
        open={createOpen}
        okText="创建"
        cancelText="取消"
        onOk={() =>
          form
            .validateFields()
            .then(async (values: { entityName: string; deviceName?: string; deviceNo?: string }) => {
              const extraJson: Record<string, unknown> = {};
              if (values.deviceName) extraJson.deviceName = values.deviceName;
              if (values.deviceNo) extraJson.deviceNo = values.deviceNo;
              await createEntity({ systemId, entityName: values.entityName, extraJson });
              message.success('创建成功（附加字段将随 dataSync 回填表单）');
              setCreateOpen(false);
              load();
            })
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="entityName" label="实体名称" rules={[{ required: true, message: '请输入实体名称' }]}>
            <Input placeholder="如：5号机组·巡检记录" />
          </Form.Item>
          <Form.Item name="deviceName" label="附加字段·设备名称（dataSync 演示）">
            <Input placeholder="留空则不回填" />
          </Form.Item>
          <Form.Item name="deviceNo" label="附加字段·设备编号（dataSync 演示）">
            <Input placeholder="留空则不回填" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
