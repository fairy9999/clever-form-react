import { Input } from 'antd';
import type { BaseControlProps } from './types';

/** 多行文本 */
export function InputTextareaControl({ control, value, onChange, viewOnly }: BaseControlProps) {
  return (
    <Input.TextArea
      rows={3}
      value={value === null || value === undefined ? '' : String(value)}
      disabled={viewOnly || control.disabled}
      readOnly={control.readonly}
      placeholder={control.placeholder ?? `请输入${control.nameZh}`}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
