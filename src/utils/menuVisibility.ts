/**
 * 左侧表单菜单显隐规则评估。
 * 菜单规则与控件规则共用数据结构（ruleType / ruleList / logicalConjunction），
 * 但取值始终来自各表单已保存数据（以 formId 为键）。
 */
import type { MenuRuleConfig } from '@/types/form';
import type { FormDataValue } from '@/types/control';
import type { RuleItem } from '@/types/control';

function looseEqual(a: unknown, b: unknown): boolean {
  if (a === null || a === undefined || a === '') return false;
  return String(a) === String(b);
}

function getDependValue(rule: RuleItem, dataByFormId: Record<string, FormDataValue>): unknown {
  const fd = dataByFormId[String(rule.dependFormId)];
  if (!fd) return null;
  if (rule.controlCustomGroup) {
    const group = fd[`_custom_group_${rule.controlCustomGroup}`];
    const v =
      group && typeof group === 'object'
        ? (group as Record<string, unknown>)[rule.dependControlIdentifier!]
        : undefined;
    return v === undefined ? null : v;
  }
  const v = fd[rule.dependControlIdentifier!];
  return v === undefined ? null : v;
}

function checkRule(rule: RuleItem, dataByFormId: Record<string, FormDataValue>): boolean {
  if (!rule.dependControlIdentifier) return false;
  const dependValue = getDependValue(rule, dataByFormId);
  if (rule.dependControlType === 'checkbox') {
    let values: unknown[] = [];
    if (typeof dependValue === 'string') {
      try {
        const parsed = JSON.parse(dependValue);
        values = Array.isArray(parsed) ? parsed : [];
      } catch {
        values = [];
      }
    } else if (Array.isArray(dependValue)) {
      values = dependValue;
    }
    return values.map(String).includes(String(rule.ruleValue));
  }
  return looseEqual(dependValue, rule.ruleValue);
}

/** 菜单（表单）是否可见；未配置规则默认可见 */
export function isFormMenuVisible(
  config: MenuRuleConfig | undefined,
  dataByFormId: Record<string, FormDataValue>,
): boolean {
  if (!config) return true;
  const { ruleType, ruleList } = config;
  if (ruleType === 'default') return false;
  if (ruleType === 'DISPLAY') {
    if (!ruleList || ruleList.length === 0) return true;
    const evalRule = (rule: RuleItem) => rule.type === 1 || (rule.type === 0 && checkRule(rule, dataByFormId));
    return config.logicalConjunction === 'AND' ? ruleList.every(evalRule) : ruleList.some(evalRule);
  }
  if (ruleType === 'SKIP') {
    const shouldHide = (ruleList ?? []).some(
      (rule) => Boolean(rule.dependControlIdentifier) && String(rule.type) === '0' && checkRule(rule, dataByFormId),
    );
    return !shouldHide;
  }
  return true;
}
