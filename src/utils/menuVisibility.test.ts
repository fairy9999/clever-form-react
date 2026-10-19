import { describe, expect, it } from 'vitest';
import type { MenuRuleConfig } from '@/types/form';
import { isFormMenuVisible } from './menuVisibility';

describe('isFormMenuVisible', () => {
  it('未配置规则 → 可见', () => {
    expect(isFormMenuVisible(undefined, {})).toBe(true);
  });

  it("'default' → 隐藏", () => {
    expect(isFormMenuVisible({ formId: 'F3', ruleType: 'default', ruleList: [] }, {})).toBe(false);
  });

  it('DISPLAY：依赖其他表单数据', () => {
    const config: MenuRuleConfig = {
      formId: 'F3',
      ruleType: 'DISPLAY',
      logicalConjunction: 'AND',
      ruleList: [
        {
          type: 0,
          ruleValue: '3',
          dependControlIdentifier: 'result',
          dependFormId: 'F2',
          belongFormId: 'F3',
        },
      ],
    };
    const visibleData = { F2: { result: '3' } };
    const hiddenData = { F2: { result: '1' } };
    expect(isFormMenuVisible(config, visibleData)).toBe(true);
    expect(isFormMenuVisible(config, hiddenData)).toBe(false);
    expect(isFormMenuVisible(config, {})).toBe(false); // 依赖表单未填写 → 不显示
  });

  it('SKIP：命中规则时隐藏', () => {
    const config: MenuRuleConfig = {
      formId: 'F2',
      ruleType: 'SKIP',
      ruleList: [
        { type: 0, ruleValue: 'yes', dependControlIdentifier: 'flag', dependFormId: 'F1', belongFormId: 'F2' },
      ],
    };
    expect(isFormMenuVisible(config, { F1: { flag: 'yes' } })).toBe(false);
    expect(isFormMenuVisible(config, { F1: { flag: 'no' } })).toBe(true);
  });
});
