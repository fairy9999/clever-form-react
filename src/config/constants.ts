/** 表单录入状态 */
export const ENTRY_STATUS = {
  /** 已建档未录入 */
  NOT_ENTERED: 1,
  /** 录入未完成 */
  PARTIAL: 2,
  /** 已完成 */
  COMPLETE: 3,
} as const;

export type EntryStatus = (typeof ENTRY_STATUS)[keyof typeof ENTRY_STATUS];

/** 菜单状态点颜色：1 红 / 2 黄 / 3 绿 */
export function statusColor(status?: number): string {
  if (status === 3) return '#52c41a';
  if (status === 2) return '#faad14';
  return '#f5222d';
}

export function statusText(status?: number): string {
  if (status === 3) return '已完成';
  if (status === 2) return '未完成';
  return '未完成';
}

/** 多选控件的互斥特殊值（历史约定：值 998/98 或文案为“不详/其他”） */
export const MUTEX_CHECKBOX_VALUES = ['998', '98'];
export const MUTEX_CHECKBOX_LABELS = ['不详', '其他'];

/** 数据分组键前缀 */
export const CUSTOM_GROUP_PREFIX = '_custom_group_';
