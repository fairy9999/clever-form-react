import { describe, expect, it } from 'vitest';
import type { ControlDef, RuleItem } from '@/types/control';
import { checkRule, filterOptionsByRules, shouldShowControl, collectDependFormIds } from './visibility';
import { markOriginalRuleTypes, cloneChildrenForRecord } from './controls';

function rule(partial: Partial<RuleItem>): RuleItem {
  return {
    type: 0,
    ruleValue: '1',
    dependControlIdentifier: 'trigger',
    dependFormId: 'F1',
    belongFormId: 'F1',
    ...partial,
  };
}

function ctrl(partial: Partial<ControlDef>): ControlDef {
  return {
    controlId: '1',
    identifier: 'target',
    nameZh: '目标',
    selectedControlType: 'input-text',
    ...partial,
  };
}

const baseCtx = (formData: Record<string, unknown>, controls: ControlDef[]) => ({
  formData,
  ruleFormData: {},
  controls,
});

describe('shouldShowControl', () => {
  it('ruleType 为空 → 始终显示', () => {
    const c = ctrl({});
    expect(shouldShowControl(c, baseCtx({}, [c]))).toBe(true);
  });

  it("ruleType 'default' → 强制隐藏", () => {
    const c = ctrl({ ruleType: 'default' });
    expect(shouldShowControl(c, baseCtx({}, [c]))).toBe(false);
  });

  it('DISPLAY + AND：所有规则满足才显示', () => {
    const c = ctrl({
      ruleType: 'DISPLAY',
      logicalConjunction: 'AND',
      ruleList: [rule({ ruleValue: '1' }), rule({ dependControlIdentifier: 't2', ruleValue: '2' })],
    });
    const ctx = baseCtx({ trigger: '1', t2: '2' }, [c]);
    expect(shouldShowControl(c, ctx)).toBe(true);
    expect(shouldShowControl(c, baseCtx({ trigger: '1', t2: 'x' }, [c]))).toBe(false);
  });

  it('DISPLAY + OR：任一规则满足即显示', () => {
    const c = ctrl({
      ruleType: 'DISPLAY',
      logicalConjunction: 'OR',
      ruleList: [rule({ ruleValue: '1' }), rule({ dependControlIdentifier: 't2', ruleValue: '2' })],
    });
    expect(shouldShowControl(c, baseCtx({ trigger: '9', t2: '2' }, [c]))).toBe(true);
  });

  it('DISPLAY + type=1 恒真规则', () => {
    const c = ctrl({ ruleType: 'DISPLAY', logicalConjunction: 'AND', ruleList: [rule({ type: 1 })] });
    expect(shouldShowControl(c, baseCtx({}, [c]))).toBe(true);
  });

  it('SKIP：命中规则时隐藏', () => {
    const c = ctrl({ ruleType: 'SKIP', ruleList: [rule({ ruleValue: 'yes' })] });
    expect(shouldShowControl(c, baseCtx({ trigger: 'yes' }, [c]))).toBe(false);
    expect(shouldShowControl(c, baseCtx({ trigger: 'no' }, [c]))).toBe(true);
  });

  it('checkbox 依赖：JSON 字符串解析后 includes 判断', () => {
    const c = ctrl({
      ruleType: 'DISPLAY',
      logicalConjunction: 'AND',
      ruleList: [rule({ dependControlType: 'checkbox', ruleValue: 'A' })],
    });
    expect(shouldShowControl(c, baseCtx({ trigger: '["A","B"]' }, [c]))).toBe(true);
    expect(shouldShowControl(c, baseCtx({ trigger: '["B"]' }, [c]))).toBe(false);
  });

  it('input-number-unit 依赖：取 magnitude 比较', () => {
    const dep = ctrl({ identifier: 'unit_dep', selectedControlType: 'input-number-unit' });
    const c = ctrl({
      ruleType: 'DISPLAY',
      logicalConjunction: 'AND',
      ruleList: [rule({ dependControlIdentifier: 'unit_dep', dependControlType: 'input-number-unit', ruleValue: '42' })],
    });
    expect(shouldShowControl(c, baseCtx({ unit_dep: { magnitude: 42, units: 'kg' } }, [dep, c]))).toBe(true);
  });

  it('跨表单依赖：从 ruleFormData 读取（含自定义分组）', () => {
    const c = ctrl({
      ruleType: 'DISPLAY',
      logicalConjunction: 'AND',
      ruleList: [rule({ dependFormId: 'F2', belongFormId: 'F1', controlCustomGroup: 'g1', ruleValue: 'v1' })],
    });
    const ctx = {
      formData: {},
      ruleFormData: { F2: { _custom_group_g1: { trigger: 'v1' } } },
      controls: [c],
    };
    expect(shouldShowControl(c, ctx)).toBe(true);
  });

  it("动态克隆：'default' 隐藏但原始 DISPLAY 规则命中时回退显示", () => {
    const child = ctrl({ ruleType: 'DISPLAY', logicalConjunction: 'OR', ruleList: [rule({ ruleValue: 'on' })] });
    markOriginalRuleTypes([child]);
    const clone = cloneChildrenForRecord([child], 0, 'grp')[0];
    (clone as ControlDef).ruleType = 'default'; // 模拟脚本强制隐藏
    expect(shouldShowControl(clone, baseCtx({ trigger: 'on' }, [child]))).toBe(true);
    expect(shouldShowControl(clone, baseCtx({ trigger: 'off' }, [child]))).toBe(false);
  });
});

describe('checkRule 数值/字符串等价', () => {
  it('数字 42 与规则值 "42" 视为相等', () => {
    const c = ctrl({});
    const r = rule({ ruleValue: '42' });
    expect(checkRule(r, baseCtx({ trigger: 42 }, [c]))).toBe(true);
  });
});

describe('filterOptionsByRules', () => {
  it('命中 type=2 规则时仅保留 otherInfo 选项', () => {
    const c = ctrl({
      selectedControlType: 'radio',
      privateAttr: JSON.stringify({ options: [{ value: '1', label: '甲' }, { value: '2', label: '乙' }, { value: '3', label: '丙' }] }),
      ruleList: [
        rule({
          type: 2,
          dependControlIdentifier: 'kind',
          ruleValue: 'x',
          otherInfo: JSON.stringify(['1', '3']),
        }),
      ],
    });
    const shown = filterOptionsByRules(c, baseCtx({ kind: 'x' }, [c]));
    expect(shown.map((o) => o.value)).toEqual(['1', '3']);
    // 未命中不限制
    const all = filterOptionsByRules(c, baseCtx({ kind: 'y' }, [c]));
    expect(all).toHaveLength(3);
  });
});

describe('collectDependFormIds', () => {
  it('收集跨表单依赖并去重、排除自引用', () => {
    const a = ctrl({ ruleList: [rule({ dependFormId: 'F2', belongFormId: 'F1' })] });
    const b = ctrl({ ruleList: [rule({ dependFormId: 'F2', belongFormId: 'F1' }), rule({ dependFormId: 'F1', belongFormId: 'F1' })] });
    const group = ctrl({ selectedControlType: 'group-box', children: [b] });
    expect(collectDependFormIds([a, group])).toEqual(['F2']);
  });
});
