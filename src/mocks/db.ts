/**
 * MSW 内存数据库：可变状态（保存后刷新可见），页面刷新即重置。
 * 全部数据均为虚构的医疗场景数据。
 */
import type { ControlDef } from '@/types/control';
import type { EntityItem, MenuRuleConfig, SyncMapping, SystemItem } from '@/types/form';
import { systemAForms, systemAMenuRules, systemASavedData } from './fixtures/systemA';
import { systemBForms, systemBMenuRules, systemBSavedData } from './fixtures/systemB';
import { ctrl, pa } from './fixtures/shared';

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

/** 其余系统的通用随访表单（保证每个系统均可进入填报） */
function simpleFollowUpForm(systemId: string): MockFormDef {
  const tree: ControlDef[] = [
    ctrl({
      identifier: 'visit_no',
      nameZh: '登记编号',
      selectedControlType: 'input-text',
      required: true,
      placeholder: '请输入登记编号',
    }),
    ctrl({
      identifier: 'patient_name',
      nameZh: '患者姓名',
      selectedControlType: 'input-text',
      required: true,
    }),
    ctrl({
      identifier: 'visit_type',
      nameZh: '登记类型',
      selectedControlType: 'radio',
      required: true,
      privateAttr: pa({
        options: [
          { value: 'first', label: '首次登记' },
          { value: 'review', label: '复诊登记' },
        ],
        numberOfOptionsPerLine: 2,
      }),
    }),
    ctrl({
      identifier: 'visit_date',
      nameZh: '登记日期',
      selectedControlType: 'date-time-picker',
      required: true,
      privateAttr: pa({ checkedAccuracy: '日' }),
    }),
    ctrl({
      identifier: 'visit_note',
      nameZh: '情况记录',
      selectedControlType: 'input-textarea',
      colNumber: 12,
    }),
  ];
  return {
    formId: `${systemId}-F1`,
    formName: '随访登记表',
    formOrder: 1,
    enabled: true,
    formLayout: 'horizontal' as const,
    formDesc: '随访基本信息登记',
    tree,
  };
}

export const db = {
  users: [
    { username: 'admin', password: '123456' },
  ] as MockUser[],

  captchas: new Map<string, string>(),

  systems: [
    {
      systemId: 'SYS-A',
      systemName: '慢病随访管理系统',
      systemDesc: '面向高血压、糖尿病等慢病患者的随访建档与评估',
      creatorName: '系统管理员',
      createDate: '2026-09-01 10:00:00',
    },
    {
      systemId: 'SYS-B',
      systemName: '健康风险评估管理系统',
      systemDesc: '覆盖既往史、家族史登记与生活质量评分',
      creatorName: '系统管理员',
      createDate: '2026-09-02 10:00:00',
    },
    {
      systemId: 'SYS-C',
      systemName: '体检报告管理系统',
      systemDesc: '体检档案登记、报告上传与异常提醒',
      creatorName: '陈建国',
      createDate: '2026-09-03 10:00:00',
    },
    {
      systemId: 'SYS-D',
      systemName: '护理评估管理系统',
      systemDesc: '入院护理评估与跌倒/压疮风险筛查',
      creatorName: '刘雅琴',
      createDate: '2026-09-04 10:00:00',
    },
    {
      systemId: 'SYS-E',
      systemName: '康复随访管理系统',
      systemDesc: '康复训练计划跟踪与功能评分',
      creatorName: '陈建国',
      createDate: '2026-09-05 10:00:00',
    },
    {
      systemId: 'SYS-F',
      systemName: '营养管理信息系统',
      systemDesc: '营养风险筛查（NRS-2002）与膳食指导',
      creatorName: '孙丽华',
      createDate: '2026-09-06 10:00:00',
    },
    {
      systemId: 'SYS-G',
      systemName: '心理评估管理系统',
      systemDesc: '焦虑/抑郁量表评估与随访干预',
      creatorName: '孙丽华',
      createDate: '2026-09-07 10:00:00',
    },
    {
      systemId: 'SYS-H',
      systemName: '用药安全管理系统',
      systemDesc: '处方用药审核与不良反应上报',
      creatorName: '赵国栋',
      createDate: '2026-09-08 10:00:00',
    },
  ] as SystemItem[],

  formsBySystem: {
    'SYS-A': systemAForms,
    'SYS-B': systemBForms,
    'SYS-C': [simpleFollowUpForm('SYS-C')],
    'SYS-D': [simpleFollowUpForm('SYS-D')],
    'SYS-E': [simpleFollowUpForm('SYS-E')],
    'SYS-F': [simpleFollowUpForm('SYS-F')],
    'SYS-G': [simpleFollowUpForm('SYS-G')],
    'SYS-H': [simpleFollowUpForm('SYS-H')],
  } as Record<string, MockFormDef[]>,

  menuRules: {
    'SYS-A': systemAMenuRules,
    'SYS-B': systemBMenuRules,
  } as Record<string, MenuRuleConfig[]>,

  entities: [
    {
      entityId: 'ENT-A-1',
      systemId: 'SYS-A',
      entityName: '张建国高血压随访档案',
      creatorName: '系统管理员',
      createDate: '2026-10-10 09:00:00',
      dataJson: JSON.stringify({ patientName: '张建国', patientNo: 'MZ-1024763' }),
    },
    {
      entityId: 'ENT-A-2',
      systemId: 'SYS-A',
      entityName: '李淑芬糖尿病随访档案',
      creatorName: '系统管理员',
      createDate: '2026-10-11 09:00:00',
      dataJson: JSON.stringify({ patientName: '李淑芬', patientNo: 'MZ-1025318' }),
    },
    {
      entityId: 'ENT-A-3',
      systemId: 'SYS-A',
      entityName: '周淑芬糖尿病随访档案',
      creatorName: '系统管理员',
      createDate: '2026-10-12 09:00:00',
      dataJson: JSON.stringify({}),
    },
    {
      entityId: 'ENT-B-1',
      systemId: 'SYS-B',
      entityName: '刘志强健康风险评估档案',
      creatorName: '系统管理员',
      createDate: '2026-10-13 09:00:00',
      dataJson: JSON.stringify({}),
    },
    {
      entityId: 'ENT-B-2',
      systemId: 'SYS-B',
      entityName: '吴桂芳健康风险评估档案',
      creatorName: '系统管理员',
      createDate: '2026-10-14 09:00:00',
      dataJson: JSON.stringify({}),
    },
    {
      entityId: 'ENT-C-1',
      systemId: 'SYS-C',
      entityName: '马建军体检报告档案',
      creatorName: '陈建国',
      createDate: '2026-10-15 09:00:00',
      dataJson: JSON.stringify({}),
    },
    {
      entityId: 'ENT-D-1',
      systemId: 'SYS-D',
      entityName: '郑秀英护理评估档案',
      creatorName: '刘雅琴',
      createDate: '2026-10-15 10:00:00',
      dataJson: JSON.stringify({}),
    },
    {
      entityId: 'ENT-E-1',
      systemId: 'SYS-E',
      entityName: '冯国强康复随访档案',
      creatorName: '陈建国',
      createDate: '2026-10-16 09:00:00',
      dataJson: JSON.stringify({}),
    },
    {
      entityId: 'ENT-F-1',
      systemId: 'SYS-F',
      entityName: '何丽敏营养管理档案',
      creatorName: '孙丽华',
      createDate: '2026-10-16 10:00:00',
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
