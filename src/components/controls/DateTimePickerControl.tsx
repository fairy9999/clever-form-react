import { DatePicker } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import type { BaseControlProps } from './types';
import { parsePrivateAttr } from '@/utils/privateAttr';

/**
 * 日期（时间）选择。精度由 checkedAccuracy 决定：
 * 年 → 年选择器；月 → 月选择器；时/分 → 日期时间；日/缺省 → 日期。
 * 值统一按所选精度格式化为字符串存储。
 */
export function DateTimePickerControl({ control, value, onChange, viewOnly }: BaseControlProps) {
  const attrs = parsePrivateAttr(control);
  const accuracy = attrs.checkedAccuracy ?? '日';
  const withTime = accuracy === '时' || accuracy === '分';

  const format = accuracy === '年' ? 'YYYY' : accuracy === '月' ? 'YYYY-MM' : withTime ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD';

  const parse = (v: unknown): Dayjs | null => {
    if (v === null || v === undefined || v === '') return null;
    const d = dayjs(String(v));
    return d.isValid() ? d : null;
  };

  const upper = attrs.timeUpperLimit;
  const lower = attrs.timeLowerLimit;
  const customRange = attrs.range_date;

  return (
    <DatePicker
      style={{ width: '100%' }}
      value={parse(value)}
      picker={accuracy === '年' ? 'year' : accuracy === '月' ? 'month' : 'date'}
      showTime={withTime ? { format: 'HH:mm:ss' } : false}
      format={format}
      disabled={viewOnly || control.disabled}
      placeholder={control.placeholder ?? `请选择${control.nameZh}`}
      disabledDate={(d) => {
        if (upper === 'currentTime' && d.isAfter(dayjs(), 'day')) return true;
        if (lower === 'currentTime' && d.isBefore(dayjs(), 'day')) return true;
        if (customRange?.minDate && d.isBefore(dayjs(customRange.minDate), 'day')) return true;
        if (customRange?.maxDate && d.isAfter(dayjs(customRange.maxDate), 'day')) return true;
        return false;
      }}
      onChange={(d) => onChange(d ? d.format(format) : null)}
    />
  );
}
