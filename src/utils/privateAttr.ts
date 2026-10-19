import type { ControlDef, PresetConfig, PrivateAttr } from '@/types/control';

const cache = new WeakMap<object, PrivateAttr>();

/** 解析控件 privateAttr（JSON 字符串），带缓存；解析失败返回空对象 */
export function parsePrivateAttr(control: ControlDef): PrivateAttr {
  const cached = cache.get(control);
  if (cached) return cached;
  let out: unknown;
  try {
    out = JSON.parse(control.privateAttr || '{}');
  } catch {
    out = {};
  }
  const attrs: PrivateAttr = out && typeof out === 'object' ? (out as PrivateAttr) : {};
  cache.set(control, attrs);
  return attrs;
}

/** 获取预设信息按钮配置，兼容字符串 / 对象两种历史格式 */
export function getPresetConfig(control: ControlDef): PresetConfig | null {
  const raw = parsePrivateAttr(control).getRefernceData;
  if (!raw) return null;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as PresetConfig;
      return parsed && parsed.buttonType ? parsed : null;
    } catch {
      return null;
    }
  }
  return raw.buttonType ? raw : null;
}

/** 取控件默认值 */
export function getControlDefaultValue(control: ControlDef): unknown {
  const dv = parsePrivateAttr(control).defaultValue;
  if (dv === undefined || dv === null || dv === '') return null;
  return dv;
}
