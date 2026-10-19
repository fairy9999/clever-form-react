import { InputNumber, Select } from 'antd';
import type { BaseControlProps } from './types';
import { parsePrivateAttr } from '@/utils/privateAttr';
import type { UnitValue } from '@/types/control';

/** 带单位数值输入（值结构 { magnitude, units }） */
export function InputNumberUnitControl({ control, value, onChange, viewOnly }: BaseControlProps) {
  const units = parsePrivateAttr(control).units ?? [];
  const unitOptions = units.map((u) => ({ value: u.unit, label: u.unit }));
  const current: UnitValue =
    value !== null && typeof value === 'object'
      ? (value as UnitValue)
      : { magnitude: null, units: units[0]?.unit ?? null };

  const emit = (patch: Partial<UnitValue>) => onChange({ ...current, ...patch });

  return (
    <div className="cf-unit-control">
      <InputNumber
        style={{ flex: 1 }}
        value={current.magnitude === '' || current.magnitude === undefined ? null : Number(current.magnitude)}
        disabled={viewOnly || control.disabled}
        placeholder={`请输入${control.nameZh}`}
        onChange={(v) => emit({ magnitude: v === null || v === undefined ? '' : v })}
      />
      <Select
        style={{ width: 96 }}
        value={current.units ?? unitOptions[0]?.value ?? null}
        options={unitOptions}
        disabled={viewOnly || control.disabled || unitOptions.length === 0}
        onChange={(u) => emit({ units: u })}
      />
    </div>
  );
}
