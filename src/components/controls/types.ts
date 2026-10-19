import type { OptionItem } from '@/types/control';

/** 所有控件组件的公共 Props */
export interface BaseControlProps {
  control: import('@/types/control').ControlDef;
  /** 当前值（formData 中的原始值，可能是 JSON 字符串等历史格式） */
  value: unknown;
  /** 经规则过滤后的选项（radio / checkbox / select 使用） */
  options?: OptionItem[];
  /** 值变化 */
  onChange: (value: unknown) => void;
  /** 批量回填同级控件（预设信息选择后同时填多个控件），键为 identifier */
  onBatchChange?: (values: Record<string, unknown>) => void;
  /** 详情态：只读不可编辑 */
  viewOnly?: boolean;
}
