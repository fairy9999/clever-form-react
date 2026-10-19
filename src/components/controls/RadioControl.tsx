import { Radio } from 'antd';
import type { BaseControlProps } from './types';
import { parsePrivateAttr } from '@/utils/privateAttr';

/** 单选（再次点击取消选中；每行选项数可配置） */
export function RadioControl({ control, value, options, onChange, viewOnly }: BaseControlProps) {
  const attrs = parsePrivateAttr(control);
  const perLine = attrs.numberOfOptionsPerLine ?? 0;
  const list = options ?? [];
  const currentStr = value === null || value === undefined ? '' : String(value);

  return (
    <Radio.Group
      value={currentStr === '' ? null : currentStr}
      disabled={viewOnly || control.disabled}
      onChange={(e) => onChange(e.target.value)}
      className={perLine > 0 ? 'cf-option-grid' : undefined}
      style={perLine > 0 ? { gridTemplateColumns: `repeat(${perLine}, minmax(0, 1fr))` } : undefined}
    >
      {list.map((opt) => (
        <Radio
          key={String(opt.value)}
          value={String(opt.value)}
          onClick={() => {
            // 再次点击已选中项 → 取消选中（浏览器 click 事件先于 change 触发）
            if (currentStr === String(opt.value) && !viewOnly && !control.disabled) onChange(null);
          }}
        >
          {opt.label}
          {opt.desc && <span className="cf-option-desc">{opt.desc}</span>}
        </Radio>
      ))}
    </Radio.Group>
  );
}
