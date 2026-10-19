import { describe, expect, it } from 'vitest';
import type { ControlDef } from '@/types/control';
import { applyAccuracy, isEmptyValue, validateControl } from './validation';

function ctrl(partial: Partial<ControlDef>): ControlDef {
  return {
    controlId: '1',
    identifier: 'field',
    nameZh: '字段',
    selectedControlType: 'input-text',
    ...partial,
  };
}

describe('isEmptyValue', () => {
  it('空数组 / 空字符串 / null 视为空', () => {
    expect(isEmptyValue([])).toBe(true);
    expect(isEmptyValue('')).toBe(true);
    expect(isEmptyValue(null)).toBe(true);
    expect(isEmptyValue('[]')).toBe(true);
    expect(isEmptyValue('  ')).toBe(true);
  });
  it('0 / false / 非空数组有效', () => {
    expect(isEmptyValue(0)).toBe(false);
    expect(isEmptyValue(false)).toBe(false);
    expect(isEmptyValue(['1'])).toBe(false);
    expect(isEmptyValue('["1"]')).toBe(false);
  });
});

describe('validateControl', () => {
  it('required：空值报错，0 与 false 有效', () => {
    const c = ctrl({ required: true, nameZh: '巡检项' });
    expect(validateControl(c, '')).toContain('巡检项');
    expect(validateControl(c, 0)).toBe(null);
    expect(validateControl(c, false)).toBe(null);
    expect(validateControl(c, ['a'])).toBe(null);
  });

  it('详情态跳过 required', () => {
    const c = ctrl({ required: true });
    expect(validateControl(c, '', true)).toBe(null);
  });

  it('jsExplainInfo 常显错误', () => {
    const c = ctrl({ jsExplainInfo: '后端校验未通过' });
    expect(validateControl(c, '任意值')).toBe('后端校验未通过');
  });

  it('range 区间校验（含单位控件 magnitude）', () => {
    const c = ctrl({
      selectedControlType: 'input-number',
      privateAttr: JSON.stringify({ range: { minValue: 1, maxValue: 10 } }),
    });
    expect(validateControl(c, 5)).toBe(null);
    expect(validateControl(c, 0)).toContain('不能小于');
    expect(validateControl(c, 11)).toContain('不能大于');
  });

  it('validator 正则校验', () => {
    const c = ctrl({
      privateAttr: JSON.stringify({ validator: { value: '^\\d+$', errorExplain: '仅允许数字' } }),
    });
    expect(validateControl(c, '123')).toBe(null);
    expect(validateControl(c, 'abc')).toBe('仅允许数字');
  });

  it('带单位控件 required 按 magnitude 判空', () => {
    const c = ctrl({ selectedControlType: 'input-number-unit', required: true });
    expect(validateControl(c, { magnitude: '', units: 'kg' })).not.toBe(null);
    expect(validateControl(c, { magnitude: 5, units: 'kg' })).toBe(null);
  });
});

describe('applyAccuracy', () => {
  it('按精度四舍五入', () => {
    expect(applyAccuracy(3.14159, 2)).toBe(3.14);
    expect(applyAccuracy(2.5, 0)).toBe(3);
    expect(applyAccuracy(1.005, 2)).toBe(1);
  });
});
