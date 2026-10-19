/**
 * MSW 内存数据库：可变状态（保存后刷新可见），页面刷新即重置。
 * 全部数据均为演示用虚构数据。
 */
import type { ControlDef } from '@/types/control';
import type { EntityItem, MenuRuleConfig, SyncMapping, SystemItem } from '@/types/form';
import { systemAForms, systemAMenuRules, systemASavedData } from './fixtures/systemA';
import { systemBForms, systemBMenuRules, systemBSavedData } from './fixtures/systemB';

export interface MockFormDef {
  formId: string;
  formName: string;
  formOrder: number;
  enabled: boolean;
  formLayout: 'horizontal' | 'vertical';
  formDesc: string;
  syncFromEntity?: SyncMapping[];
  tree: ControlDef[];
}

export interface MockUser {
  username: string;
  password: string;
}

export const db = {
  users: [
    { username: 'admin', password: '123456' },
  ] as MockUser[],

  captchas: new Map<string, string>(),

  systems: [
    {
      systemId: 'SYS-A',
      systemName: '设备巡检管理系统',
      systemDesc: '覆盖设备巡检建档、检查记录、整改回执全流程',
      creatorName: '系统管理员',
      createDate: '2026-09-01 10:00:00',
    },
    {
      systemId: 'SYS-B',
      systemName: '设备运维评估管理系统',
      systemDesc: '覆盖设备规格登记、运维成员登记与质量评估',
      creatorName: '系统管理员',
      createDate: '2026-09-02 10:00:00',
    },
  ] as SystemItem[],

  formsBySystem: {
    'SYS-A': systemAForms,
    'SYS-B': systemBForms,
  } as Record<string, MockFormDef[]>,

  menuRules: {
    'SYS-A': systemAMenuRules,
    'SYS-B': systemBMenuRules,
  } as Record<string, MenuRuleConfig[]>,

  entities: [
    {
      entityId: 'ENT-A-1',
      systemId: 'SYS-A',
      entityName: '1号机组巡检记录',
      creatorName: '系统管理员',
      createDate: '2026-10-10 09:00:00',
      dataJson: JSON.stringify({ deviceName: '1号主循环水泵', deviceNo: 'SB-A-001' }),
    },
    {
      entityId: 'ENT-A-2',
      systemId: 'SYS-A',
      entityName: '2号机组巡检记录',
      creatorName: '系统管理员',
      createDate: '2026-10-11 09:00:00',
      dataJson: JSON.stringify({ deviceName: '2号备用水泵', deviceNo: 'SB-A-002' }),
    },
    {
      entityId: 'ENT-A-3',
      systemId: 'SYS-A',
      entityName: '3号机组巡检记录',
      creatorName: '系统管理员',
      createDate: '2026-10-12 09:00:00',
      dataJson: JSON.stringify({}),
    },
    {
      entityId: 'ENT-B-1',
      systemId: 'SYS-B',
      entityName: '运维一班评估记录',
      creatorName: '系统管理员',
      createDate: '2026-10-13 09:00:00',
      dataJson: JSON.stringify({}),
    },
    {
      entityId: 'ENT-B-2',
      systemId: 'SYS-B',
      entityName: '运维二班评估记录',
      creatorName: '系统管理员',
      createDate: '2026-10-14 09:00:00',
      dataJson: JSON.stringify({}),
    },
  ] as EntityItem[],

  /** entityId → formId → 已保存数据 */
  savedData: {
    ...systemASavedData,
    ...systemBSavedData,
  } as Record<string, Record<string, { formDataId?: string; status: number; data: Record<string, unknown> }>>,

  /** fileName → 附件内容（内存 Blob） */
  uploads: new Map<string, { blob: Blob; type: string; size: number }>(),
};

/** 首次保存时补齐 formDataId */
export function ensureFormDataId(entityId: string, formId: string): string {
  const rec = db.savedData[entityId]?.[formId];
  if (rec && !rec.formDataId) rec.formDataId = `fd-${Math.random().toString(36).slice(2, 12)}`;
  if (!rec) {
    db.savedData[entityId] = db.savedData[entityId] ?? {};
    db.savedData[entityId][formId] = {
      formDataId: `fd-${Math.random().toString(36).slice(2, 12)}`,
      status: 1,
      data: {},
    };
  }
  return db.savedData[entityId][formId].formDataId!;
}

/** 实体下全部表单的状态映射（三层嵌套，与原接口形状一致） */
export function buildFormDataMapBatch(entityId: string) {
  const entity = db.entities.find((e) => e.entityId === entityId);
  const forms = entity ? (db.formsBySystem[entity.systemId] ?? []) : [];
  const items = forms.map((form) => {
    const rec = db.savedData[entityId]?.[form.formId];
    return {
      formDataMapId: `map-${entityId}-${form.formId}`,
      formDataId: rec?.formDataId ?? null,
      formId: form.formId,
      entityId,
      formEntryStatus: rec?.status ?? 1,
    };
  });
  return [[items]];
}
