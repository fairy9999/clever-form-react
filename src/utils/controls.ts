import type { ControlDef } from '@/types/control';
import { getPropName } from './path';

/** 递归展平控件树（含 group-box 子控件） */
export function getAllChildren(controls: ControlDef[]): ControlDef[] {
  const out: ControlDef[] = [];
  const walk = (list: ControlDef[]) => {
    for (const c of list) {
      out.push(c);
      if (c.children && c.children.length > 0) walk(c.children);
    }
  };
  walk(controls);
  return out;
}

/** 按 identifier 在控件树中查找控件 */
export function findControlByIdentifier(controls: ControlDef[], identifier: string): ControlDef | null {
  for (const c of controls) {
    if (c.identifier === identifier) return c;
    if (c.children && c.children.length > 0) {
      const found = findControlByIdentifier(c.children, identifier);
      if (found) return found;
    }
  }
  return null;
}

/** 加载后遍历全树，记录控件原始 ruleType（供动态克隆回退评估使用） */
export function markOriginalRuleTypes(controls: ControlDef[]): void {
  for (const c of getAllChildren(controls)) {
    c._originalRuleType = c.ruleType;
  }
}

/**
 * 为动态复制组的一条记录克隆一份子控件，并打上运行期标记。
 * 子控件内部保持深拷贝（privateAttr 为字符串，可安全 JSON 往返）。
 */
export function cloneChildrenForRecord(
  children: ControlDef[],
  recordIndex: number,
  groupPath: string,
): ControlDef[] {
  const cloneOne = (c: ControlDef): ControlDef => {
    const copy: ControlDef = JSON.parse(JSON.stringify(c));
    copy._isDynamicClone = true;
    copy._dynamicIndex = recordIndex;
    copy._dynamicGroupPath = groupPath;
    copy._fromDynamicCopy = true;
    if (copy.children && copy.children.length > 0) {
      copy.children = copy.children.map(cloneOne);
    }
    return copy;
  };
  return children.map(cloneOne);
}

/** 为动态复制组新记录生成初始数据（子控件默认值，缺省空字符串） */
export function makeInitialRecord(children: ControlDef[]): Record<string, unknown> {
  const record: Record<string, unknown> = {};
  for (const child of children) {
    if (child.selectedControlType === 'group-box') continue;
    let dv: unknown = null;
    try {
      const attrs = JSON.parse(child.privateAttr || '{}') as { defaultValue?: unknown };
      dv = attrs.defaultValue ?? '';
    } catch {
      dv = '';
    }
    record[child.identifier] = dv === undefined || dv === null ? '' : dv;
  }
  return record;
}

/** 计算动态复制组的数据路径（组控件自身的 prop 名） */
export function getDynamicGroupPath(group: ControlDef): string {
  return getPropName(group);
}
