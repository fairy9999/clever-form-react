import { useEffect, useMemo, useRef } from 'react';
import type { ControlDef, FormDataValue } from '@/types/control';
import { getAllChildren } from '@/utils/controls';
import { getControlValue, setControlValue } from '@/utils/path';
import {
  filterOptionsByRules,
  shouldShowControl,
  type VisibilityContext,
} from '@/utils/visibility';
import { applyHiddenClears } from '@/utils/clear';
import { parsePrivateAttr } from '@/utils/privateAttr';
import { computeCountable } from '@/components/controls/CountableControl';
import { ControlItem } from './ControlItem';
import { GroupBoxRenderer } from './GroupBoxRenderer';

interface FormRendererProps {
  controls: ControlDef[];
  value: FormDataValue;
  /** 跨表单依赖数据（formId → 已保存数据），由页面层从 sessionStore 传入 */
  ruleFormData: Record<string, FormDataValue>;
  viewOnly: boolean;
  /** 错误表：键为 identifier（动态记录内为 `${identifier}#${index}`） */
  errors: Record<string, string>;
  onChange: (next: FormDataValue) => void;
}

/** 计算 countable 表达式的变量表（identifier → 值），支持多级链式计算 */
export function computeVariables(controls: ControlDef[], formData: FormDataValue): Record<string, unknown> {
  const all = getAllChildren(controls).filter((c) => c.selectedControlType !== 'group-box');
  const map: Record<string, unknown> = {};
  for (const c of all) {
    if (c.selectedControlType === 'countable') continue;
    map[c.identifier] = getControlValue(formData, c);
  }
  const countables = all.filter((c) => c.selectedControlType === 'countable');
  for (let round = 0; round < 3 && countables.length > 0; round += 1) {
    for (const c of countables) {
      const result = computeCountable(c, map);
      if (result !== null) map[c.identifier] = result;
    }
  }
  return map;
}

/** 整表渲染：显隐规则评估 + 隐藏清值 + 控件分发 */
export function FormRenderer({ controls, value, ruleFormData, viewOnly, errors, onChange }: FormRendererProps) {
  const valueRef = useRef(value);
  valueRef.current = value;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const ctx: VisibilityContext = useMemo(
    () => ({ formData: value, ruleFormData, controls }),
    [value, ruleFormData, controls],
  );

  /** 顶层控件 / 静态分组子控件的可见性（动态记录内的可见性由 GroupBoxRenderer 评估） */
  const visibleIds = useMemo(() => {
    const set = new Set<string>();
    const walk = (list: ControlDef[]) => {
      for (const c of list) {
        if (c.selectedControlType === 'group-box') {
          // 动态复制组子控件随记录克隆渲染，不按顶层规则评估；静态分组需深入子控件
          if (!parsePrivateAttr(c).allowDynamicAdd) walk(c.children ?? []);
          continue;
        }
        if (shouldShowControl(c, ctx)) set.add(c.identifier);
      }
    };
    walk(controls);
    return set;
  }, [ctx]);

  /** 动态复制组原始子控件 identifier：不参与渲染，也不参与隐藏清值 */
  const dynamicChildIds = useMemo(() => {
    const set = new Set<string>();
    const walk = (list: ControlDef[]) => {
      for (const c of list) {
        if (c.selectedControlType !== 'group-box') continue;
        if (parsePrivateAttr(c).allowDynamicAdd) {
          for (const child of c.children ?? []) set.add(child.identifier);
        } else {
          walk(c.children ?? []);
        }
      }
    };
    walk(controls);
    return set;
  }, [controls]);

  const signature = useMemo(() => [...visibleIds].sort().join(','), [visibleIds]);

  // 隐藏控件自动清值（编辑态）；visibility 签名变化时执行一次
  useEffect(() => {
    if (viewOnly) return;
    const current = valueRef.current;
    const next = applyHiddenClears(
      controls,
      current,
      (c) => visibleIds.has(c.identifier) && !dynamicChildIds.has(c.identifier),
    );
    if (next !== current) onChangeRef.current(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, viewOnly, controls, dynamicChildIds]);

  const variables = useMemo(() => computeVariables(controls, value), [controls, value]);

  const renderControl = (control: ControlDef) => {
    const options =
      control.selectedControlType === 'radio' ||
      control.selectedControlType === 'checkbox' ||
      control.selectedControlType === 'select'
        ? filterOptionsByRules(control, ctx)
        : undefined;
    return (
      <ControlItem
        key={control.identifier}
        control={control}
        formData={value}
        options={options}
        variables={variables}
        viewOnly={viewOnly}
        error={errors[control.identifier]}
        onChange={(v) => onChange(setControlValue(value, control, v))}
        onBatchChange={(values) => {
          let next = value;
          for (const [identifier, v] of Object.entries(values)) {
            const sibling = getAllChildren(controls).find((c) => c.identifier === identifier);
            if (sibling) next = setControlValue(next, sibling, v);
          }
          if (next !== value) onChange(next);
        }}
      />
    );
  };

  return (
    <div className="cf-form">
      {controls.map((control) => {
        if (control.selectedControlType === 'group-box') {
          return (
            <GroupBoxRenderer
              key={control.identifier}
              group={control}
              formData={value}
              ruleFormData={ruleFormData}
              controls={controls}
              variables={variables}
              viewOnly={viewOnly}
              errors={errors}
              onChange={onChange}
            />
          );
        }
        if (!visibleIds.has(control.identifier)) return null;
        return renderControl(control);
      })}
    </div>
  );
}
