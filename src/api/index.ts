import type {
  CaptchaItem,
  CascadeNode,
  ControlsTreePayload,
  EntityItem,
  FormDetailPayload,
  FormMenuItem,
  LoginResult,
  MenuRuleConfig,
  PresetArea,
  PresetPerson,
  SystemItem,
  UploadResultItem,
} from '@/types/form';
import type { FileEntry, FormDataValue } from '@/types/control';
import type { FormDataMapBatch } from '@/utils/formDataMap';
import { getData, postData } from './http';

/* ---------- 认证 ---------- */

export const getCaptcha = () => getData<CaptchaItem>('/auth/captcha');

export function login(username: string, password: string, captchaId: string, captchaCode: string) {
  return postData<LoginResult>('/auth/login', { username, password, captchaId, captchaCode });
}

/* ---------- 系统 / 实体 ---------- */

export const getSystems = () => getData<SystemItem[]>('/systems');

export const getEntities = (systemId: string) =>
  getData<EntityItem[]>('/entities', { systemId });

export const getEntity = (entityId: string) => getData<EntityItem>('/entities/detail', { entityId });

export interface CreateEntityPayload {
  systemId: string;
  entityName: string;
  extraJson?: Record<string, unknown>;
}

export const createEntity = (payload: CreateEntityPayload) =>
  postData<EntityItem>('/entities/create', payload);

export const deleteEntity = (entityId: string) =>
  postData<{ deleted: boolean }>('/entities/delete', { entityId });

/* ---------- 表单定义 ---------- */

export const getFormsBySystem = (systemId: string) =>
  getData<FormMenuItem[]>('/forms/by-system', { systemId });

export const getControlsTree = (formId: string) =>
  getData<ControlsTreePayload>('/forms/controls-tree', { formId });

export const getMenuRules = (systemId: string) =>
  getData<MenuRuleConfig[]>('/forms/menu-rules', { systemId });

/* ---------- 表单数据 ---------- */

/** 实体下全部表单状态映射（三层嵌套结构，与原接口保持一致） */
export const getFormDataMapBatch = (entityId: string) =>
  getData<FormDataMapBatch>('/form-data/map-batch', { entityId });

export interface SaveFormDataPayload {
  entityId: string;
  formId: string;
  formDataMapId?: string | null;
  formDataId?: string | null;
  data: FormDataValue;
  isComplete: boolean;
}

export interface SaveFormDataResult {
  formDataId: string;
  formEntryStatus: number;
}

export const saveFormData = (payload: SaveFormDataPayload) =>
  postData<SaveFormDataResult>('/form-data/save', payload);

/** 按表单读取已保存数据（回填 / 跨表单依赖） */
export const getFormDataDetail = (entityId: string, formId: string) =>
  getData<FormDetailPayload>('/form-data/detail', { entityId, formId });

/* ---------- 上传 ---------- */

export function uploadFiles(files: File[]): Promise<UploadResultItem[]> {
  const form = new FormData();
  files.forEach((f) => form.append('files', f));
  return postData<UploadResultItem[]>('/upload', form);
}

export const deleteFile = (fileName: string) =>
  postData<{ deleted: boolean }>('/upload/delete', { fileName });

export const filePreviewUrl = (fileName: string) =>
  `${import.meta.env.VITE_API_BASE_URL || '/api'}/upload/preview?name=${encodeURIComponent(fileName)}`;

/** 解析附件表单值（JSON 字符串 → FileEntry[]） */
export function parseFileEntries(value: unknown): FileEntry[] {
  if (!value) return [];
  if (Array.isArray(value)) return value as FileEntry[];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as FileEntry[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

/* ---------- 级联 / 预设 ---------- */

export const getCascadeData = (parentCode?: string) =>
  getData<CascadeNode[]>('/cascade', parentCode ? { parent: parentCode } : undefined);

export const getPresetPersons = (type?: string) =>
  getData<PresetPerson[]>('/presets/personnel', type ? { type } : undefined);

export const getPresetAreas = (parentCode?: string) =>
  getData<PresetArea[]>('/presets/areas', parentCode ? { parent: parentCode } : undefined);
