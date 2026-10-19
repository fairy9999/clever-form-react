import { describe, expect, it } from 'vitest';
import type { ControlDef } from '@/types/control';
import { applyHiddenClears, clearControlDataPure } from './clear';

function ctrl(partial: Partial<ControlDef>): ControlDef {
  return {
    controlId: '1',
    identifier: 'field',
    nameZh: '字段',
    selectedControlType: 'input-text',
    ...partial,
  };
}

describe('clearControlDataPure', () => {
  it('普通控件置 null', () => {
    const c = ctrl({ identifier: 'a' });
    expect(clearControlDataPure(c, { a: 'x' })).toEqual({ a: null });
  });

  it('disabled + 默认值：清空时补默认值', () => {
    const c = ctrl({
      identifier: 'a',
      disabled: true,
      privateAttr: JSON.stringify({ defaultValue: '默认' }),
    });
    expect(clearControlDataPure(c, { a: 'x' })).toEqual({ a: 'x' }); // 已有值不动
    expect(clearControlDataPure(c, { a: null })).toEqual({ a: '默认' });
  });

  it('input-number-unit：数值清空、单位保留或取首个默认单位', () => {
    const c = ctrl({
      identifier: 'u',
      selectedControlType: 'input-number-unit',
      privateAttr: JSON.stringify({ units: [{ unit: 'kg' }, { unit: 'g' }] }),
    });
    expect(clearControlDataPure(c, { u: { magnitude: 3, units: 'g' } })).toEqual({
      u: { magnitude: '', units: 'g' },
    });
    expect(clearControlDataPure(c, { u: { magnitude: 3, units: null } })).toEqual({
      u: { magnitude: '', units: 'kg' },
    });
    expect(clearControlDataPure(c, {})).toEqual({ u: { magnitude: '', units: 'kg' } });
  });

  it('分组控件按分组路径清空', () => {
    const c = ctrl({ identifier: 'a', customGroup: 'g' });
    expect(clearControlDataPure(c, { _custom_group_g: { a: 'x' } })).toEqual({
      _custom_group_g: { a: null },
    });
  });
});

describe('applyHiddenClears', () => {
  it('仅清空不可见控件，跳过分组与克隆控件', () => {
    const visible = ctrl({ identifier: 'vis' });
    const hidden = ctrl({ identifier: 'hid' });
    const group = ctrl({ identifier: 'grp', selectedControlType: 'group-box' });
    const clone = ctrl({ identifier: 'c1', _isDynamicClone: true, _dynamicIndex: 0, _dynamicGroupPath: 'grp' });
    const fd = { vis: '1', hid: '2', grp: [{ c1: 'keep' }] };
    const next = applyHiddenClears([group, clone, visible, hidden], fd, (c) => c.identifier !== 'hid');
    expect(next).toEqual({ vis: '1', hid: null, grp: [{ c1: 'keep' }] });
  });
});
