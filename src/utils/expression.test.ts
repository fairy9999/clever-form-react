import { describe, expect, it } from 'vitest';
import { evaluateExpression, matchGrade, tokenizeExpression } from './expression';

describe('tokenizeExpression', () => {
  it('解析变量、数字与运算符', () => {
    const tokens = tokenizeExpression('[a]+2*[b]');
    expect(tokens).toEqual([
      { kind: 'var', name: 'a' },
      { kind: 'op', value: '+' },
      { kind: 'num', value: 2 },
      { kind: 'op', value: '*' },
      { kind: 'var', name: 'b' },
    ]);
  });
  it('非法字符返回 null', () => {
    expect(tokenizeExpression('[a]; process.exit()')).toBe(null);
  });
});

describe('evaluateExpression', () => {
  it('四则运算与优先级', () => {
    expect(evaluateExpression('[a]+[b]*2', { a: 1, b: 3 })).toBe(7);
    expect(evaluateExpression('([a]+[b])*2', { a: 1, b: 3 })).toBe(8);
    expect(evaluateExpression('[a]/[b]', { a: 7, b: 2 })).toBe(3.5);
  });
  it('空值按 0 处理，一元负号可用', () => {
    expect(evaluateExpression('[a]+[b]', { a: 2 })).toBe(2);
    expect(evaluateExpression('-[a]+1', { a: 4 })).toBe(-3);
  });
  it('specialMap 特殊值映射', () => {
    // 取值 99（不详）时按 3 参与计算
    expect(evaluateExpression('[a]+[b]', { a: '99', b: 2 }, { 99: 3 })).toBe(5);
  });
  it('带单位数值变量取 magnitude', () => {
    expect(evaluateExpression('[a]*2', { a: { magnitude: 5, units: 'kg' } })).toBe(10);
  });
  it('除零与非法表达式返回 null', () => {
    expect(evaluateExpression('[a]/0', { a: 1 })).toBe(null);
    expect(evaluateExpression('[a]+', { a: 1 })).toBe(null);
  });
});

describe('matchGrade', () => {
  const rules = [
    { min: 0, max: 9, value: 'I', label: '轻度' },
    { min: 10, max: 19, value: 'II', label: '中度' },
    { min: 20, value: 'III', label: '重度' },
  ];
  it('按区间匹配并返回首个命中', () => {
    expect(matchGrade(5, rules)?.value).toBe('I');
    expect(matchGrade(15, rules)?.value).toBe('II');
    expect(matchGrade(99, rules)?.value).toBe('III');
    expect(matchGrade(-1, rules)).toBe(null);
  });
});
