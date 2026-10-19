import { TimePicker } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import type { BaseControlProps } from './types';
import { parsePrivateAttr } from '@/utils/privateAttr';

/** 时间选择（值按 HH:mm / HH:mm:ss 字符串存储） */
export function TimePickerControl({ control, value, onChange, viewOnly }: BaseControlProps) {
  const attrs = parsePrivateAttr(control);
  const format = attrs.timeFormat ?? 'HH:mm';
  const parse = (v: unknown): Dayjs | null => {
    if (v === null || v === undefined || v === '') return null;
    const d = dayjs(String(v), format);
    return d.isValid() ? d : null;
  };
  return (
    <TimePicker
      style={{ width: '100%' }}
      value={parse(value)}
      format={format}
      disabled={viewOnly || control.disabled}
      placeholder={control.placeholder ?? `请选择${control.nameZh}`}
      onChange={(t) => onChange(t ? t.format(format) : null)}
    />
  );
}
