import type { ControlDef } from '@/types/control';

/** privateAttr 快捷序列化 */
export const pa = (attrs: Record<string, unknown>): string => JSON.stringify(attrs);

export function ctrl(partial: Partial<ControlDef> & Pick<ControlDef, 'identifier' | 'nameZh' | 'selectedControlType'>): ControlDef {
  return {
    controlId: `c-${partial.identifier}`,
    colNumber: 6,
    customGroup: null,
    required: false,
    disabled: false,
    ruleType: null,
    ...partial,
  } as ControlDef;
}

export function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function randomHex32(): string {
  let s = '';
  for (let i = 0; i < 32; i += 1) s += Math.floor(Math.random() * 16).toString(16);
  return s;
}
