/**
 * 表单数据映射（formDataMap）工具：三层嵌套结构的展平与查找。
 */
import type { FormDataMapItem } from '@/types/form';

export type FormDataMapBatch = FormDataMapItem[][][];

/** 展平三层嵌套结构并按 formId 查找 */
export function findFormDataMapItem(
  batch: FormDataMapBatch | null | undefined,
  formId: string | number,
): FormDataMapItem | undefined {
  if (!Array.isArray(batch)) return undefined;
  for (const layer1 of batch) {
    if (!Array.isArray(layer1)) continue;
    for (const layer2 of layer1) {
      if (!Array.isArray(layer2)) continue;
      const found = layer2.find((item) => String(item.formId) === String(formId));
      if (found) return found;
    }
  }
  return undefined;
}

/** 统计实体下已完成表单数量 */
export function countCompleted(batch: FormDataMapBatch | null | undefined): number {
  if (!Array.isArray(batch)) return 0;
  return batch.flat(2).filter((item) => item && item.formEntryStatus === 3).length;
}
