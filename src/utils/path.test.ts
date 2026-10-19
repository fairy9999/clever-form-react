import { describe, expect, it } from 'vitest';
import type { ControlDef } from '@/types/control';
import { getControlValue, getPropName, setControlValue, setIn, getIn, splitPath } from './path';

function ctrl(partial: Partial<ControlDef>): ControlDef {
  return {
    controlId: '1',
    identifier: 'field_a',
    nameZh: '字段A',
    selectedControlType: 'input-text',
    ...partial,
  };
}

describe('getPropName', () => {
  it('顶层控件返回 identifier', () => {
    expect(getPropName({ identifier: 'a', customGroup: null })).toBe('a');
  });
  it('分组控件返回 _custom_group_ 前缀路径', () => {
    expect(getPropName({ identifier: 'a', customGroup: '布局1' })).toBe('_custom_group_布局1.a');
  });
});

describe('setIn / getIn', () => {
  it('写入嵌套路径且不改动原对象', () => {
    const original = { a: { b: 1 } };
    const next = setIn(original, ['a', 'b'], 2);
    expect((next as { a: { b: number } }).a.b).toBe(2);
    expect(original.a.b).toBe(1);
  });
  it('中间节点不存在时自动创建', () => {
    const next = setIn({}, ['_custom_group_g1', 'x'], 'v');
    expect(getIn(next, splitPath('_custom_group_g1.x'))).toBe('v');
  });
});

describe('getControlValue / setControlValue', () => {
  it('按分组路径读写', () => {
    const control = ctrl({ identifier: 'a', customGroup: 'g' });
    let fd = setControlValue({}, control, 'hello');
    expect(getControlValue(fd, control)).toBe('hello');
  });
  it('顶层读写与覆盖', () => {
    const control = ctrl({});
    const fd = setControlValue(setControlValue({}, control, '1'), control, '2');
    expect(getControlValue(fd, control)).toBe('2');
  });
  it('动态克隆控件从记录数组读写', () => {
    const group = ctrl({ identifier: 'grp', selectedControlType: 'group-box' });
    const child = ctrl({ identifier: 'item', _isDynamicClone: true, _dynamicIndex: 1, _dynamicGroupPath: 'grp' });
    let fd = setControlValue({}, group, [{ item: 'r0' }, {}]);
    expect(getControlValue(fd, child)).toBe(null);
    fd = setControlValue(fd, child, 'r1值');
    const records = fd.grp as Array<Record<string, unknown>>;
    expect(records[0].item).toBe('r0');
    expect(records[1].item).toBe('r1值');
    expect(getControlValue(fd, child)).toBe('r1值');
  });
});
