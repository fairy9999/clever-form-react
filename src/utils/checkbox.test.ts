import { describe, expect, it } from 'vitest';
import type { OptionItem } from '@/types/control';
import { isMutexOption, normalizeCheckboxValue, resolveCheckboxMutex } from './checkbox';

const options: OptionItem[] = [
  { value: '1', label: '选项一' },
  { value: '2', label: '选项二' },
  { value: '998', label: '不详' },
];

describe('isMutexOption', () => {
  it('按值或文案识别互斥项', () => {
    expect(isMutexOption(options[2])).toBe(true);
    expect(isMutexOption(options[0])).toBe(false);
    expect(isMutexOption({ value: 'x', label: '不详' })).toBe(true);
    expect(isMutexOption({ value: 'x', label: '其他' })).toBe(true);
    expect(isMutexOption(undefined, '98')).toBe(true);
  });
});

describe('normalizeCheckboxValue', () => {
  it('JSON 字符串 / 数组 / 单值统一为数组', () => {
    expect(normalizeCheckboxValue('["1","2"]')).toEqual(['1', '2']);
    expect(normalizeCheckboxValue(['1'])).toEqual(['1']);
    expect(normalizeCheckboxValue('1')).toEqual(['1']);
    expect(normalizeCheckboxValue('')).toEqual([]);
    expect(normalizeCheckboxValue(null)).toEqual([]);
  });
});

describe('resolveCheckboxMutex', () => {
  it('勾选互斥项时仅保留互斥项', () => {
    expect(resolveCheckboxMutex(['1', '998'], ['1'], options)).toEqual(['998']);
  });
  it('互斥状态下勾选普通项时取消互斥项', () => {
    expect(resolveCheckboxMutex(['998', '1'], ['998'], options)).toEqual(['1']);
  });
  it('普通多选不受影响', () => {
    expect(resolveCheckboxMutex(['1', '2'], ['1'], options)).toEqual(['1', '2']);
    expect(resolveCheckboxMutex([], ['1'], options)).toEqual([]);
  });
});
