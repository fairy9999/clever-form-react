import { useState } from 'react';
import { Button, Input, Space } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import type { BaseControlProps } from './types';
import { getPresetConfig } from '@/utils/privateAttr';
import { PresetDialog } from '../form/PresetDialog';

/** 单行文本（含预设信息快捷回填按钮） */
export function InputTextControl({ control, value, onChange, onBatchChange, viewOnly }: BaseControlProps) {
  const preset = getPresetConfig(control);
  const [presetOpen, setPresetOpen] = useState(false);

  return (
    <Space.Compact block>
      <Input
        value={value === null || value === undefined ? '' : String(value)}
        disabled={viewOnly || control.disabled}
        readOnly={control.readonly}
        placeholder={control.placeholder ?? `请输入${control.nameZh}`}
        onChange={(e) => onChange(e.target.value)}
      />
      {preset && !viewOnly && !control.disabled && (
        <Button icon={<UserOutlined />} onClick={() => setPresetOpen(true)}>
          {preset.buttonName || '预设'}
        </Button>
      )}
      {preset && (
        <PresetDialog
          open={presetOpen}
          config={preset}
          onClose={() => setPresetOpen(false)}
          onPick={(result) => {
            // main 回填本控件；adjoin 按配置回填到相邻控件（identifier）。
            // 必须合并为一次批量更新：分开调 onChange/onBatchChange 会基于同一个旧闭包值，
            // 后者会把前者写入的字段覆盖掉（表现为"选人后姓名不回显"）。
            const values: Record<string, unknown> = { [control.identifier]: result.main };
            if (preset.adjoinIdentifier && result.adjoin !== undefined) {
              values[preset.adjoinIdentifier] = result.adjoin;
            }
            if (onBatchChange) {
              onBatchChange(values);
            } else {
              onChange(result.main);
            }
            setPresetOpen(false);
          }}
        />
      )}
    </Space.Compact>
  );
}
