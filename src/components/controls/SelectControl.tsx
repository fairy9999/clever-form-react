import { Select } from 'antd';
import type { BaseControlProps } from './types';

/** 下拉选择 */
export function SelectControl({ control, value, options, onChange, viewOnly }: BaseControlProps) {
  return (
    <Select
      style={{ width: '100%' }}
      value={value === null || value === undefined || value === '' ? null : String(value)}
      options={(options ?? []).map((o) => ({ value: String(o.value), label: o.label }))}
      allowClear
      disabled={viewOnly || control.disabled}
      placeholder={control.placeholder ?? `请选择${control.nameZh}`}
      onChange={(v) => onChange(v ?? null)}
    />
  );
}
