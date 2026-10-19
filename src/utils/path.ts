import type { ControlDef, FormDataValue, UnitValue } from '@/types/control';
import { CUSTOM_GROUP_PREFIX } from '@/config/constants';

/**
 * 根据控件生成数据路径 prop 名：
 * 有 customGroup 时为 "_custom_group_<组名>.<identifier>"，否则为 identifier。
 */
export function getPropName(control: Pick<ControlDef, 'identifier' | 'customGroup'>): string {
  if (control.customGroup) {
    return `${CUSTOM_GROUP_PREFIX}${control.customGroup}.${control.identifier}`;
  }
  return control.identifier;
}

/** 将 prop 名拆分为路径段（约定 identifier 不含 '.'） */
export function splitPath(propName: string): string[] {
  return propName.split('.');
}

/** 按路径安全取值，取不到返回 undefined */
export function getIn(obj: unknown, path: string[]): unknown {
  return path.reduce<unknown>(
    (acc, key) => (acc !== null && typeof acc === 'object' ? (acc as Record<string, unknown>)[key] : undefined),
    obj,
  );
}

/** 按路径不可变写入，返回新对象（沿路径浅克隆） */
export function setIn(obj: FormDataValue, path: string[], value: unknown): FormDataValue {
  if (path.length === 0) return obj;
  const [head, ...rest] = path;
  const source = obj as unknown;
  const clone: Record<string, unknown> =
    Array.isArray(source) ? ([...source] as unknown as Record<string, unknown>) : { ...(source as Record<string, unknown>) };
  if (rest.length === 0) {
    clone[head] = value;
    return clone as FormDataValue;
  }
  const child = clone[head];
  clone[head] = setIn(
    child !== null && typeof child === 'object' ? (child as FormDataValue) : {},
    rest,
    value,
  );
  return clone as FormDataValue;
}

/**
 * 读取控件当前值。
 * - 动态克隆控件：从所属记录（扁平结构）按 identifier 读取
 * - 普通控件：按 customGroup 分组路径或顶层 identifier 读取
 */
export function getControlValue(formData: FormDataValue, control: ControlDef): unknown {
  if (control._isDynamicClone && control._dynamicGroupPath) {
    const records = getIn(formData, splitPath(control._dynamicGroupPath));
    if (!Array.isArray(records)) return null;
    const record = records[control._dynamicIndex ?? -1] as Record<string, unknown> | undefined;
    if (!record) return null;
    const v = record[control.identifier];
    return v === undefined ? null : v;
  }
  if (control.customGroup) {
    const group = (formData as Record<string, unknown>)[`${CUSTOM_GROUP_PREFIX}${control.customGroup}`];
    if (!group || typeof group !== 'object') return null;
    const v = (group as Record<string, unknown>)[control.identifier];
    return v === undefined ? null : v;
  }
  const v = (formData as Record<string, unknown>)[control.identifier];
  return v === undefined ? null : v;
}

/** 写入控件值（不可变），返回新的 formData */
export function setControlValue(formData: FormDataValue, control: ControlDef, value: unknown): FormDataValue {
  if (control._isDynamicClone && control._dynamicGroupPath) {
    const path = splitPath(control._dynamicGroupPath);
    const records = (getIn(formData, path) as unknown[]) ?? [];
    const idx = control._dynamicIndex ?? 0;
    const record = {
      ...((records[idx] as Record<string, unknown>) ?? {}),
      [control.identifier]: value,
    };
    const newRecords = [...records];
    newRecords[idx] = record;
    return setIn(formData, path, newRecords);
  }
  return setIn(formData, splitPath(getPropName(control)), value);
}

/** 取带单位数值控件的数值部分（非该类型或空值返回 null） */
export function getMagnitude(value: unknown): number | string | null {
  if (value !== null && typeof value === 'object' && 'magnitude' in (value as UnitValue)) {
    const m = (value as UnitValue).magnitude;
    return m === undefined ? null : m;
  }
  return null;
}
