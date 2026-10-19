import { Checkbox } from 'antd';
import type { BaseControlProps } from './types';
import { normalizeCheckboxValue, resolveCheckboxMutex } from '@/utils/checkbox';

/** 多选（互斥项自动互斥；值以 JSON 数组字符串存储） */
export function CheckboxControl({ control, value, options, onChange, viewOnly }: BaseControlProps) {
  const list = options ?? [];
  const current = normalizeCheckboxValue(value);

  const emit = (next: string[]) => onChange(JSON.stringify(next));

  return (
    <Checkbox.Group
      value={current}
      disabled={viewOnly || control.disabled}
      onChange={(next) => emit(resolveCheckboxMutex(next.map(String), current, list))}
    >
      {list.map((opt) => (
        <Checkbox key={String(opt.value)} value={String(opt.value)}>
          {opt.label}
        </Checkbox>
      ))}
    </Checkbox.Group>
  );
}
