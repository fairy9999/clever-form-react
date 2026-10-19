/**
 * 多选互斥逻辑（纯函数）。
 * 与原版 CheckboxControl 一致：值 998/98 或文案"不详"为互斥项；
 * 扩展约定：文案"其他"同样互斥。
 */
import type { OptionItem } from '@/types/control';
import { MUTEX_CHECKBOX_LABELS, MUTEX_CHECKBOX_VALUES } from '@/config/constants';

/** 选项是否为互斥项 */
export function isMutexOption(option: OptionItem | undefined, value?: string | number): boolean {
  if (option) {
    if (MUTEX_CHECKBOX_VALUES.includes(String(option.value))) return true;
    if (MUTEX_CHECKBOX_LABELS.includes(option.label)) return true;
    return false;
  }
  if (value === undefined) return false;
  if (MUTEX_CHECKBOX_VALUES.includes(String(value))) return true;
  return false;
}

/** 多选值可能是 JSON 字符串，统一解析为数组 */
export function normalizeCheckboxValue(value: unknown): string[] {
  if (value === null || value === undefined || value === '') return [];
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String);
      if (parsed === null || parsed === undefined || parsed === '') return [];
      return [String(parsed)];
    } catch {
      return value ? [value] : [];
    }
  }
  return [String(value)];
}

/**
 * 依据互斥规则修正本次勾选结果：
 * - 原未选互斥项、本次勾选了互斥项 → 仅保留该互斥项
 * - 已有互斥项、本次又勾选普通项 → 取消互斥项
 * - 普通多选不受影响
 */
export function resolveCheckboxMutex(
  nextValues: string[],
  prevValues: string[],
  options: OptionItem[],
): string[] {
  const optionOf = (v: string) => options.find((o) => String(o.value) === String(v));
  const nextMutex = nextValues.find((v) => isMutexOption(optionOf(v), v));
  const prevMutex = prevValues.find((v) => isMutexOption(optionOf(v), v));

  if (nextMutex !== undefined && prevMutex === undefined) {
    return [nextMutex];
  }
  if (nextMutex !== undefined && prevMutex !== undefined && nextValues.length > 1) {
    return nextValues.filter((v) => !isMutexOption(optionOf(v), v));
  }
  return nextValues;
}
