/**
 * 隐藏时清值（纯函数版）。
 * 与原版 clearControlData 行为一致：
 * - disabled 且配置了默认值：不清空，保证默认值存在
 * - input-number-unit：数值清空、单位重置为首个默认单位（保留已选单位）
 * - 其余置 null，并递归处理子控件
 */
import type { ControlDef, FormDataValue } from '@/types/control';
import { parsePrivateAttr } from './privateAttr';
import { getControlValue, setControlValue } from './path';
import { getAllChildren } from './controls';

function getDefaultUnit(control: ControlDef): string | null {
  const units = parsePrivateAttr(control).units;
  if (units && units.length > 0 && units[0].unit !== undefined && units[0].unit !== null) {
    return units[0].unit;
  }
  return null;
}

/** 清空单个控件的值，返回新的 formData */
export function clearControlDataPure(control: ControlDef, formData: FormDataValue): FormDataValue {
  // 不可填写状态且存在默认值：补默认值而非清空
  if (control.disabled) {
    const defaultValue = parsePrivateAttr(control).defaultValue;
    if (defaultValue !== undefined && defaultValue !== null && defaultValue !== '') {
      const current = getControlValue(formData, control);
      if (current === null || current === '' || (Array.isArray(current) && current.length === 0)) {
        return setControlValue(formData, control, defaultValue);
      }
      return formData;
    }
  }

  if (control.selectedControlType === 'input-number-unit') {
    const defaultUnit = getDefaultUnit(control);
    const current = getControlValue(formData, control);
    if (!current || typeof current !== 'object') {
      return setControlValue(formData, control, { magnitude: '', units: defaultUnit });
    }
    const field = current as { magnitude?: unknown; units?: unknown };
    if (field.magnitude === '' && field.units !== undefined && field.units !== null) {
      return formData;
    }
    const next = {
      magnitude: '',
      units: field.units === undefined || field.units === null ? defaultUnit : field.units,
    };
    return setControlValue(formData, control, next);
  }

  return setControlValue(formData, control, null);
}

/**
 * 批量清空所有隐藏控件的值。
 * visibility 由调用方传入（控件 identifier → 是否可见），避免与评估逻辑耦合。
 */
export function applyHiddenClears(
  controls: ControlDef[],
  formData: FormDataValue,
  isVisible: (control: ControlDef) => boolean,
): FormDataValue {
  let next = formData;
  for (const control of getAllChildren(controls)) {
    if (control.selectedControlType === 'group-box') continue;
    if (control._isDynamicClone) continue; // 克隆控件随记录整体增删，不单独清理
    if (!isVisible(control)) {
      next = clearControlDataPure(control, next);
    }
  }
  return next;
}
