/**
 * 控件校验（纯函数）。
 * 规则与原版 generateRules 对齐：
 * - jsExplainInfo 存在时该字段常显错误（后端校验提示）
 * - required：空值报错（空数组 / 空字符串视为空；0 / false 有效）
 * - privateAttr.range 或 checkedUnit.range：数值区间
 * - privateAttr.validator：正则校验
 */
import type { ControlDef, UnitValue } from '@/types/control';
import { parsePrivateAttr } from './privateAttr';
import { getMagnitude } from './path';

/** 判空：null / undefined / '' / 空数组 / 空白字符串 / JSON 空数组字符串 */
export function isEmptyValue(v: unknown): boolean {
  if (v === null || v === undefined || v === '') return true;
  if (typeof v === 'string') {
    const trimmed = v.trim();
    if (trimmed === '') return true;
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed) && parsed.length === 0) return true;
      } catch {
        /* 非法 JSON 按非空处理 */
      }
    }
    return false;
  }
  if (Array.isArray(v) && v.length === 0) return true;
  return false;
}

function toNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * 校验单个控件，返回第一条错误信息；通过返回 null。
 * isViewOnly=true 时（详情态）跳过 required 校验（与原版"只查看不校验"一致）。
 */
export function validateControl(control: ControlDef, value: unknown, isViewOnly = false): string | null {
  if (control.jsExplainInfo) return control.jsExplainInfo;

  const attrs = parsePrivateAttr(control);

  // required（带单位控件按 magnitude 判空）
  if (control.required && !isViewOnly) {
    const empty =
      control.selectedControlType === 'input-number-unit'
        ? isEmptyValue(getMagnitude(value))
        : isEmptyValue(value);
    if (empty) return `请完成${control.nameZh}`;
  }

  // 区间校验
  const range = attrs.range ?? attrs.checkedUnit?.range;
  if (range) {
    const raw = control.selectedControlType === 'input-number-unit' ? getMagnitude(value) : value;
    const n = toNumber(raw);
    if (n !== null) {
      const min = toNumber(range.minValue);
      const max = toNumber(range.maxValue);
      if (min !== null && n < min) return `${control.nameZh}不能小于${min}`;
      if (max !== null && n > max) return `${control.nameZh}不能大于${max}`;
    }
  }

  // 正则校验
  const validator = attrs.validator;
  if (validator && validator.value && !isEmptyValue(value)) {
    const target =
      control.selectedControlType === 'input-number-unit'
        ? String(getMagnitude(value) ?? '')
        : Array.isArray(value)
          ? value.map(String).join(',')
          : typeof value === 'object' && value !== null
            ? JSON.stringify(value)
            : String(value);
    try {
      if (!new RegExp(validator.value).test(target)) {
        return validator.errorExplain || `${control.nameZh}格式不正确`;
      }
    } catch {
      // 非法正则跳过校验
    }
  }

  return null;
}

/** 按精度四舍五入（checkedNumberAccuracy），digits 非法时原样返回 */
export function applyAccuracy(value: number, digits?: number): number {
  const d = Number(digits);
  if (!Number.isFinite(d) || d < 0) return value;
  const factor = Math.pow(10, d);
  return Math.round(value * factor) / factor;
}

/** 批量校验：返回 identifier（prop 名）→ 错误信息 */
export function validateForm(
  entries: Array<{ control: ControlDef; value: unknown }>,
  isViewOnly = false,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const { control, value } of entries) {
    const msg = validateControl(control, value, isViewOnly);
    if (msg) errors[control.identifier] = msg;
  }
  return errors;
}

/** 判断控件值是否为带单位数值结构 */
export function isUnitValue(value: unknown): value is UnitValue {
  return value !== null && typeof value === 'object' && 'magnitude' in (value as Record<string, unknown>);
}
