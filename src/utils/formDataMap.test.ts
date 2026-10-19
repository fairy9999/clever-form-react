import { describe, expect, it } from 'vitest';
import type { FormDataMapItem } from '@/types/form';
import { countCompleted, findFormDataMapItem } from './formDataMap';

const item = (formId: string, status: number): FormDataMapItem => ({
  formDataMapId: `m-${formId}`,
  formDataId: formId === 'F1' ? 'd-1' : null,
  formId,
  entityId: 'E1',
  formEntryStatus: status,
});

describe('findFormDataMapItem', () => {
  const batch = [
    [[item('F1', 3)]],
    [[item('F2', 1), item('F3', 2)]],
  ];

  it('三层嵌套中按 formId 查找（字符串数字等价）', () => {
    expect(findFormDataMapItem(batch, 'F3')?.formEntryStatus).toBe(2);
    expect(findFormDataMapItem(batch, 'F1')?.formDataId).toBe('d-1');
  });
  it('找不到返回 undefined，非法输入不抛错', () => {
    expect(findFormDataMapItem(batch, 'F9')).toBeUndefined();
    expect(findFormDataMapItem(null, 'F1')).toBeUndefined();
    expect(findFormDataMapItem([[], []], 'F1')).toBeUndefined();
  });
});

describe('countCompleted', () => {
  it('统计已完成表单数', () => {
    const batch = [[[item('F1', 3), item('F2', 2), item('F3', 3)]]];
    expect(countCompleted(batch)).toBe(2);
  });
});
