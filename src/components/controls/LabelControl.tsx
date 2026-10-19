import type { ControlDef } from '@/types/control';
import { parsePrivateAttr } from '@/utils/privateAttr';

/** 说明文字控件（纯展示，无数据） */
export function LabelControl({ control }: { control: ControlDef }) {
  const attrs = parsePrivateAttr(control);
  const align = attrs.orientation === 'center' ? 'center' : attrs.orientation === 'right' ? 'right' : 'left';
  return (
    <div
      className="cf-label-control"
      style={{
        textAlign: align,
        color: attrs.bodyFontColor || 'inherit',
        fontSize: attrs.bodyFontSize ? `${attrs.bodyFontSize}px` : undefined,
        fontWeight: attrs.titleFontSize ? attrs.titleFontSize : undefined,
      }}
    >
      {attrs.explanation || control.nameZh}
    </div>
  );
}
