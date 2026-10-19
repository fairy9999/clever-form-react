import { create } from 'zustand';
import type { EntityItem, FormDataMapItem, SystemItem } from '@/types/form';
import type { FormDataValue } from '@/types/control';

/**
 * 填报会话状态：当前系统 / 实体 / 表单状态映射 / 跨表单依赖数据。
 * 菜单显隐与跨表单规则均从这里取数，保存后同步刷新。
 */
interface SessionState {
  system: SystemItem | null;
  entity: EntityItem | null;
  formDataMapBatch: FormDataMapItem[][][];
  /** formId → 已保存表单数据（用于跨表单规则与菜单显隐） */
  dataByFormId: Record<string, FormDataValue>;
  setSystem: (system: SystemItem | null) => void;
  setEntity: (entity: EntityItem | null) => void;
  setFormDataMapBatch: (batch: FormDataMapItem[][][]) => void;
  setDataByFormId: (formId: string, data: FormDataValue) => void;
  removeDataByFormId: (formId: string) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  system: null,
  entity: null,
  formDataMapBatch: [],
  dataByFormId: {},
  setSystem: (system) => set({ system }),
  setEntity: (entity) => set({ entity }),
  setFormDataMapBatch: (formDataMapBatch) => set({ formDataMapBatch }),
  setDataByFormId: (formId, data) =>
    set((s) => ({ dataByFormId: { ...s.dataByFormId, [formId]: data } })),
  removeDataByFormId: (formId) =>
    set((s) => {
      const next = { ...s.dataByFormId };
      delete next[formId];
      return { dataByFormId: next };
    }),
  reset: () => set({ system: null, entity: null, formDataMapBatch: [], dataByFormId: {} }),
}));
