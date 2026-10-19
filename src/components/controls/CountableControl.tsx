import { Input } from 'antd';
import type { BaseControlProps } from './types';
import { parsePrivateAttr } from '@/utils/privateAttr';
import { evaluateExpression, matchGrade } from '@/utils/expression';

interface CountableProps extends BaseControlProps {
  /** 由渲染层解析好的变量表（identifier → 当前值） */
  variables?: Record<string, unknown>;
}

/**
 * 计算控件：按 countableExpression 自动汇总（安全表达式求值，无 eval）。
 * 配置 gradeMapping 时同时显示总分对应等级。
 */
export function CountableControl({ control, variables, viewOnly }: CountableProps) {
  const attrs = parsePrivateAttr(control);
  const total =
    attrs.countableExpression && variables
      ? evaluateExpression(attrs.countableExpression, variables, attrs.specialMap)
      : null;
  const grade = total !== null ? matchGrade(total, attrs.gradeMapping) : null;

  const display =
    total === null ? '' : grade ? `${total}${grade.label ? `（${grade.label}）` : ''}` : String(total);

  return (
    <Input
      value={display}
      readOnly
      disabled={viewOnly || control.disabled}
      placeholder="自动计算"
      addonAfter={attrs.suffix}
      className="cf-countable"
    />
  );
}

/** 供渲染层计算变量表 / 校验时使用的纯计算函数 */
export function computeCountable(
  control: import('@/types/control').ControlDef,
  variables: Record<string, unknown>,
): number | null {
  const attrs = parsePrivateAttr(control);
  if (!attrs.countableExpression) return null;
  return evaluateExpression(attrs.countableExpression, variables, attrs.specialMap);
}
