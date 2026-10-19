/**
 * 实体数据 → 表单字段回填（dataSync）。
 * 原版由后端按 formId 写死同步关系；现通过表单元数据 syncFromEntity 声明式配置。
 * 语义：仅当表单字段为空时回填，避免覆盖用户已录入内容。
 */
import type { SyncMapping } from '@/types/form';
import type { FormDataValue } from '@/types/control';
import { splitPath, getIn, setIn } from './path';
import { isEmptyValue } from './validation';

export function applySyncFromEntity(
  formData: FormDataValue,
  entityJson: string | Record<string, unknown> | null | undefined,
  mappings?: SyncMapping[],
): FormDataValue {
  if (!mappings || mappings.length === 0) return formData;
  let json = entityJson;
  if (typeof json === 'string') {
    try {
      json = JSON.parse(json) as Record<string, unknown>;
    } catch {
      return formData;
    }
  }
  if (!json || typeof json !== 'object') return formData;
  let next = formData;
  for (const mapping of mappings) {
    const current = getIn(next, splitPath(mapping.formKey));
    const incoming = (json as Record<string, unknown>)[mapping.jsonKey];
    if (isEmptyValue(current) && !isEmptyValue(incoming)) {
      next = setIn(next, splitPath(mapping.formKey), incoming);
    }
  }
  return next;
}
