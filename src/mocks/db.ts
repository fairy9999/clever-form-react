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
    { username: 'demo', password: 'demo123' },
  ] as MockUser[],

  captchas: new Map<string, string>(),

  systems: [
    {
      systemId: 'SYS-DEMO-A',
      systemName: '示例·设备巡检管理系统',
      systemDesc: '演示集一：覆盖全部控件类型 + 静态分组 + 预设回填 + 数据同步 + 菜单显隐规则',
      creatorName: '演示管理员',
      createDate: '2026-09-01 10:00:00',
      demoTag: '全部控件',
    },
    {
      systemId: 'SYS-DEMO-B',
      systemName: '示例·动态表单能力演示',
      systemDesc: '演示集二：控件联动显隐 / 动态复制组 / 评分自动汇总',
      creatorName: '演示管理员',
      createDate: '2026-09-02 10:00:00',
      demoTag: '动态能力',
    },
  ] as SystemItem[],

  formsBySystem: {
    'SYS-DEMO-A': systemAForms,
    'SYS-DEMO-B': systemBForms,
  } as Record<string, MockFormDef[]>,

  menuRules: {
    'SYS-DEMO-A': systemAMenuRules,
    'SYS-DEMO-B': systemBMenuRules,
  } as Record<string, MenuRuleConfig[]>,

  entities: [
    {
      entityId: 'ENT-A-1',
      systemId: 'SYS-DEMO-A',
      entityName: '1号机组·巡检记录（已回填）',
      creatorName: '演示管理员',
      createDate: '2026-10-10 09:00:00',
      dataJson: JSON.stringify({ deviceName: '1号主循环水泵', deviceNo: 'SB-DEMO-001' }),
    },
    {
      entityId: 'ENT-A-2',
      systemId: 'SYS-DEMO-A',
      entityName: '2号机组·巡检记录（空白）',
      creatorName: '演示管理员',
      createDate: '2026-10-11 09:00:00',
      dataJson: JSON.stringify({ deviceName: '2号备用水泵', deviceNo: 'SB-DEMO-002' }),
    },
    {
      entityId: 'ENT-A-3',
      systemId: 'SYS-DEMO-A',
      entityName: '3号机组·巡检记录（部分填写）',
      creatorName: '演示管理员',
      createDate: '2026-10-12 09:00:00',
      dataJson: JSON.stringify({}),
    },
    {
      entityId: 'ENT-B-1',
      systemId: 'SYS-DEMO-B',
      entityName: '演示实体·完整回填',
      creatorName: '演示管理员',
      createDate: '2026-10-13 09:00:00',
      dataJson: JSON.stringify({}),
    },
    {
      entityId: 'ENT-B-2',
      systemId: 'SYS-DEMO-B',
      entityName: '演示实体·空白',
      creatorName: '演示管理员',
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
