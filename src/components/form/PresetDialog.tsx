import { useEffect, useState } from 'react';
import { Modal, Table } from 'antd';
import type { PresetConfig } from '@/types/control';
import { getPresetAreas, getPresetPersons } from '@/api';

export interface PresetPickResult {
  main: string;
  adjoin?: string;
}

interface PresetDialogProps {
  open: boolean;
  config: PresetConfig;
  onClose: () => void;
  onPick: (result: PresetPickResult) => void;
}

/** 预设信息选择弹窗（人员 / 地址 / 机构） */
export function PresetDialog({ open, config, onClose, onPick }: PresetDialogProps) {
  const [persons, setPersons] = useState<Array<{ key: string; Name: string; Tel_No: string }>>([]);
  const [areas, setAreas] = useState<Array<{ key: string; UAName: string; UACode: string }>>([]);

  useEffect(() => {
    if (!open) return;
    if (config.buttonType === 'person') {
      getPresetPersons(config.type).then((list) =>
        setPersons(list.map((p, i) => ({ key: String(i), Name: p.Name, Tel_No: p.Tel_No }))),
      );
    } else if (config.buttonType === 'address') {
      getPresetAreas().then((list) =>
        setAreas(list.map((a, i) => ({ key: String(i), UAName: a.UAName, UACode: a.UACode }))),
      );
    }
  }, [open, config]);

  const personColumns = [
    { title: '姓名', dataIndex: 'Name' },
    { title: '联系电话', dataIndex: 'Tel_No' },
    {
      title: '操作',
      width: 80,
      render: (_: unknown, record: { Name: string; Tel_No: string }) => (
        <a onClick={() => onPick({ main: record.Name, adjoin: record.Tel_No })}>选择</a>
      ),
    },
  ];

  const areaColumns = [
    { title: '名称', dataIndex: 'UAName' },
    {
      title: '操作',
      width: 80,
      render: (_: unknown, record: { UAName: string }) => (
        <a onClick={() => onPick({ main: record.UAName })}>选择</a>
      ),
    },
  ];

  const institutions = [
    { key: 'i1', name: '示例运维服务中心' },
    { key: 'i2', name: '示例设备制造厂' },
    { key: 'i3', name: '示例质量检测站' },
  ];

  return (
    <Modal
      open={open}
      title={config.buttonName || '选择预设信息'}
      footer={null}
      onCancel={onClose}
      width={480}
    >
      {config.buttonType === 'person' && (
        <Table size="small" rowKey="key" columns={personColumns} dataSource={persons} pagination={false} />
      )}
      {config.buttonType === 'address' && (
        <Table size="small" rowKey="key" columns={areaColumns} dataSource={areas} pagination={false} />
      )}
      {config.buttonType === 'institution' && (
        <Table
          size="small"
          rowKey="key"
          columns={[
            { title: '机构名称', dataIndex: 'name' },
            {
              title: '操作',
              width: 80,
              render: (_: unknown, record: { name: string }) => (
                <a onClick={() => onPick({ main: record.name })}>选择</a>
              ),
            },
          ]}
          dataSource={institutions}
          pagination={false}
        />
      )}
    </Modal>
  );
}
