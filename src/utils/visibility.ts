/**
 * 显隐规则评估（纯函数，无副作用）。
 * 原版在评估过程中直接改写 formData（clearControlData）；React 版将"隐藏时清值"
 * 拆分到 clear.ts 的 applyHiddenClears 中，由组件在 effect 里执行。
 */
import type { ControlDef, OptionItem, RuleItem } from '@/types/control';
import { parsePrivateAttr } from './privateAttr';
import { findControlByIdentifier } from './controls';
import { getControlValue } from './path';

export interface VisibilityContext {
  /** 当前表单数据 */
  formData: Record<string, unknown>;
  /** 跨表单依赖数据，以 formId 为键 */
  ruleFormData: Record<string, Record<string, unknown>>;
  /** 当前表单完整控件树（用于依赖控件定位） */
  controls: ControlDef[];
  /** 动态复制记录的扁平数据（评估克隆控件时传入） */
  recordData?: Record<string, unknown>;
}

/** 值等价比较：统一转字符串，空值不等于任何规则值 */
function looseEqual(a: unknown, b: unknown): boolean {
  if (a === null || a === undefined || a === '') return false;
  return String(a) === String(b);
}

function parseCheckboxValue(v: unknown): unknown[] {
  if (typeof v === 'string') {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return Array.isArray(v) ? v : [];
}

/** 获取规则依赖控件的值 */
export function getDependValue(rule: RuleItem, ctx: VisibilityContext): unknown {
  if (String(rule.belongFormId) === String(rule.dependFormId)) {
    const source = ctx.recordData ?? ctx.formData;
    if (rule.dependControlType === 'input-number-unit') {
      const dep = findControlByIdentifier(ctx.controls, rule.dependControlIdentifier!);
      const v = dep ? getControlValue(source as Record<string, unknown>, dep) : (source as Record<string, unknown>)[rule.dependControlIdentifier!];
      const mag = v !== null && typeof v === 'object' ? (v as { magnitude?: unknown }).magnitude : v;
      return mag === undefined ? null : mag;
    }
    // 动态记录内优先扁平读取（同记录兄弟控件），否则按控件定义回退到全局读取
    if (ctx.recordData && rule.dependControlIdentifier! in ctx.recordData) {
      const v = ctx.recordData[rule.dependControlIdentifier!];
      return v === undefined ? null : v;
    }
    const dep = findControlByIdentifier(ctx.controls, rule.dependControlIdentifier!);
    if (dep) return getControlValue(ctx.formData, dep);
    // 控件树中不存在依赖控件（如规则配置缺失）时扁平回退
    const v = (ctx.formData as Record<string, unknown>)[rule.dependControlIdentifier!];
    return v === undefined ? null : v;
  }
  // 跨表单：从 ruleFormData 中按 formId 取
  const fd = ctx.ruleFormData[String(rule.dependFormId)];
  if (!fd) return null;
  if (rule.controlCustomGroup) {
    const group = fd[`_custom_group_${rule.controlCustomGroup}`];
    const v = group && typeof group === 'object' ? (group as Record<string, unknown>)[rule.dependControlIdentifier!] : undefined;
    return v === undefined ? null : v;
  }
  const v = fd[rule.dependControlIdentifier!];
  return v === undefined ? null : v;
}

/** 评估单条规则是否命中 */
export function checkRule(rule: RuleItem, ctx: VisibilityContext, noDepMeansTrue = false): boolean {
  if (!rule.dependControlIdentifier) return noDepMeansTrue;
  let dependValue = getDependValue(rule, ctx);
  if (rule.dependControlType === 'checkbox') {
    const values = parseCheckboxValue(dependValue).map(String);
    return values.includes(String(rule.ruleValue));
  }
  return looseEqual(dependValue, rule.ruleValue);
}

/**
 * 控件是否应显示。
 * - ruleType 'default'：强制隐藏；动态克隆控件带原始声明式规则时按原始规则回退评估
 * - 'DISPLAY'：按 AND/OR 汇总规则，满足才显示
 * - 'SKIP'：默认显示，命中任一规则则隐藏
 * - 空值：始终显示
 */
export function shouldShowControl(control: ControlDef, ctx: VisibilityContext): boolean {
  if (control._forceHide) return false;

  if (control.ruleType === 'default') {
    const isDynamicControl = Boolean(control._isDynamicClone) || Boolean(ctx.recordData);
    // truthy 判断已排除 null/undefined/''；仅剩 DISPLAY/SKIP 时按原始规则回退评估
    if (isDynamicControl && control._originalRuleType && control._originalRuleType !== 'default') {
      return shouldShowControl({ ...control, ruleType: control._originalRuleType }, ctx);
    }
    return false;
  }

  const ruleList = control.ruleList ?? [];

  if (control.ruleType === 'DISPLAY') {
    if (ruleList.length > 0) {
      const evalRule = (rule: RuleItem): boolean =>
        rule.type === 1 ? true : rule.type === 0 && checkRule(rule, ctx);
      const show =
        control.logicalConjunction === 'AND' ? ruleList.every(evalRule) : ruleList.some(evalRule);
      return show;
    }
    return true;
  }

  if (control.ruleType === 'SKIP') {
    const shouldHide = ruleList.some(
      (rule) => Boolean(rule.dependControlIdentifier) && String(rule.type) === '0' && checkRule(rule, ctx),
    );
    return !shouldHide;
  }

  return control.ruleType == null || control.ruleType === '';
}

/**
 * 选项过滤（type=2 规则）：规则命中时，仅保留 otherInfo 中列出的选项；
 * 多条命中规则取交集；无命中规则不限制。
 */
export function filterOptionsByRules(control: ControlDef, ctx: VisibilityContext): OptionItem[] {
  let options = (parsePrivateAttr(control).options ?? []).filter((o) => !o.unShow);
  const filterRules = (control.ruleList ?? []).filter((r) => r.type === 2);
  for (const rule of filterRules) {
    if (!rule.dependControlIdentifier) continue;
    if (!checkRule(rule, ctx)) continue;
    let allowed: unknown;
    try {
      allowed = JSON.parse(rule.otherInfo ?? '[]');
    } catch {
      allowed = [];
    }
    if (!Array.isArray(allowed)) continue;
    const allowedStr = allowed.map(String);
    options = options.filter((o) => allowedStr.includes(String(o.value)));
  }
  return options;
}

/** 收集控件树中所有跨表单依赖的 formId（去重、排除自引用） */
export function collectDependFormIds(controls: ControlDef[]): string[] {
  const ids = new Set<string>();
  const walk = (list: ControlDef[]) => {
    for (const c of list) {
      for (const rule of c.ruleList ?? []) {
        if (rule.dependFormId && String(rule.dependFormId) !== String(rule.belongFormId)) {
          ids.add(String(rule.dependFormId));
        }
      }
      if (c.children && c.children.length > 0) walk(c.children);
    }
  };
  walk(controls);
  return [...ids];
}
