import type { ControlDef, RuleItem } from './control';

/** 左侧菜单中的一个表单 */
export interface FormMenuItem {
  formId: string;
  formName: string;
  formOrder: number;
  enabled: boolean;
  controlCount: number;
  ruleType?: 'DISPLAY' | 'SKIP' | 'default' | null;
  logicalConjunction?: 'AND' | 'OR' | null;
  /** 1=已建档未录入 2=录入未完成 3=已完成 */
  formEntryStatus?: number;
  formLayout?: 'horizontal' | 'vertical';
  formDesc?: string;
}

/** 表单菜单显隐规则配置（由 /forms/menu-rules 下发） */
export interface MenuRuleConfig {
  formId: string;
  ruleType: 'DISPLAY' | 'SKIP' | 'default' | null;
  logicalConjunction?: 'AND' | 'OR' | null;
  ruleList: RuleItem[];
}

/** 实体-表单数据映射（填报状态） */
export interface FormDataMapItem {
  formDataMapId: string;
  formDataId: string | null;
  formId: string;
  entityId: string;
  formEntryStatus: number;
}

/** 实体元数据 */
export interface EntityItem {
  entityId: string;
  systemId: string;
  entityName: string;
  creatorName: string;
  createDate: string;
  /** 实体附加 JSON（字符串下发，解析后用于 dataSync 同步） */
  dataJson: string | Record<string, unknown>;
}

export interface SystemItem {
  systemId: string;
  systemName: string;
  systemDesc?: string;
  creatorName: string;
  createDate: string;
  /** 演示标签：fixture 说明 */
  demoTag?: string;
}

/** 实体字段 → 表单字段同步映射（替代原后端按 formId 写死的 dataSync） */
export interface SyncMapping {
  formKey: string;
  jsonKey: string;
}

/** 控件树接口返回的表单元数据 */
export interface FormMeta {
  formId: string;
  formName: string;
  formLayout?: 'horizontal' | 'vertical';
  /** 实体数据同步映射（可选） */
  syncFromEntity?: SyncMapping[];
}

export interface ControlsTreePayload {
  metadata: FormMeta;
  data: ControlDef[];
}

export interface FormDetailPayload {
  metadata: {
    formId: string;
    formInstanceId: string;
  };
  data: Record<string, unknown>;
}

/** 统一响应包裹 */
export interface ApiResponse<T = unknown> {
  code: number | string;
  message?: string;
  data: T;
}

/** 规则条目（菜单级 / 控件级共用） */
export type FormRuleItem = RuleItem;

/** 登录相关 */
export interface CaptchaItem {
  id: string;
  imgBase64: string;
}

export interface LoginResult {
  token: string;
}

/** 上传结果 */
export interface UploadResultItem {
  success: boolean;
  name: string;
  message?: string;
}

/** 级联数据节点 */
export interface CascadeNode {
  value: string;
  label: string;
  isLeaf: boolean;
}

/** 预设人员 */
export interface PresetPerson {
  Name: string;
  Tel_No: string;
}

/** 预设地址 */
export interface PresetArea {
  UAName: string;
  UACode: string;
}
