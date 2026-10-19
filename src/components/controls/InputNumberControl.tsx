import { InputNumber } from 'antd';
import type { BaseControlProps } from './types';
import { parsePrivateAttr } from '@/utils/privateAttr';
import { applyAccuracy } from '@/utils/validation';

/** 数值输入（精度 / 区间 / 后缀） */
export function InputNumberControl({ control, value, onChange, viewOnly }: BaseControlProps) {
  const attrs = parsePrivateAttr(control);
  return (
    <InputNumber
      style={{ width: '100%' }}
      value={value === null || value === undefined || value === '' ? null : Number(value)}
      precision={attrs.checkedNumberAccuracy}
      disabled={viewOnly || control.disabled}
      readOnly={control.readonly}
      placeholder={control.placeholder ?? `请输入${control.nameZh}`}
      addonAfter={attrs.suffix}
      onChange={(v) => {
        if (v === null || v === undefined) {
          onChange(null);
          return;
        }
        onChange(applyAccuracy(Number(v), attrs.checkedNumberAccuracy));
      }}
    />
  );
}
