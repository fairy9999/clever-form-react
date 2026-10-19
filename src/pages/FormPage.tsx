import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { App, Button, Space, Spin, Tag, Typography } from 'antd';
import { ArrowLeftOutlined, CheckOutlined } from '@ant-design/icons';
import {
  getControlsTree,
  getEntity,
  getFormDataDetail,
  getFormDataMapBatch,
  getFormsBySystem,
  getMenuRules,
  saveFormData,
} from '@/api';
import { FormRenderer } from '@/components/form/FormRenderer';
import type { ControlDef, FormDataValue } from '@/types/control';
import type { FormMenuItem, FormMeta, MenuRuleConfig, EntityItem } from '@/types/form';
import type { FormDataMapBatch } from '@/utils/formDataMap';
import { findFormDataMapItem } from '@/utils/formDataMap';
import { isFormMenuVisible } from '@/utils/menuVisibility';
import { applySyncFromEntity } from '@/utils/dataSync';
import { validateControl } from '@/utils/validation';
import { shouldShowControl, type VisibilityContext } from '@/utils/visibility';
import { parsePrivateAttr } from '@/utils/privateAttr';
import { cloneChildrenForRecord, markOriginalRuleTypes } from '@/utils/controls';
import { getIn, getControlValue, getPropName, splitPath } from '@/utils/path';
import { statusColor, statusText } from '@/config/constants';
import { useSessionStore } from '@/store/sessionStore';

interface FormPageProps {
  /** collect=填报（可编辑）；view=详情（只读） */
  mode: 'collect' | 'view';
}

/** 校验条目：动态记录内的键为 `${identifier}#${index}` */
interface ValidateEntry {
  control: ControlDef;
  value: unknown;
  key: string;
  recordData?: Record<string, unknown>;
}

/**
 * 动态表单工作台：左侧表单菜单（显隐规则 + 填报状态）+ 右侧动态渲染表单。
 * 对应原 Vue 版 form.vue（渲染引擎）+ data-collect.vue（填报）+ data-view.vue（详情）。
 */
export function FormPage({ mode }: FormPageProps) {
  const { entityId = '' } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const viewOnly = mode === 'view';

  const session = useSessionStore();

  const [entity, setEntity] = useState<EntityItem | null>(null);
  const [forms, setForms] = useState<FormMenuItem[]>([]);
  const [menuRules, setMenuRules] = useState<MenuRuleConfig[]>([]);
  const [batch, setBatch] = useState<FormDataMapBatch>([]);
  const [ruleFormData, setRuleFormData] = useState<Record<string, FormDataValue>>({});
  const [activeFormId, setActiveFormId] = useState<string | null>(null);

  const [controls, setControls] = useState<ControlDef[] | null>(null);
  const [meta, setMeta] = useState<FormMeta | null>(null);
  const [formData, setFormData] = useState<FormDataValue>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);

  /* ---------- 初始化：实体 → 菜单/规则/状态 → 各表单已存数据 ---------- */

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ent = await getEntity(entityId);
        if (cancelled) return;
        setEntity(ent);
        session.setEntity(ent);

        const [formList, rules, statusBatch] = await Promise.all([
          getFormsBySystem(ent.systemId),
          getMenuRules(ent.systemId),
          getFormDataMapBatch(entityId),
        ]);
        if (cancelled) return;
        const sorted = [...formList].sort((a, b) => a.formOrder - b.formOrder);
        setForms(sorted);
        setMenuRules(rules);
        setBatch(statusBatch);
        session.setFormDataMapBatch(statusBatch);

        // 逐表单加载已保存数据（跨表单规则 / 菜单显隐 / 回填共用）
        const dataByForm: Record<string, FormDataValue> = {};
        for (const f of sorted) {
          const detail = await getFormDataDetail(entityId, f.formId);
          dataByForm[f.formId] = detail.data ?? {};
        }
        if (cancelled) return;
        setRuleFormData(dataByForm);
        Object.entries(dataByForm).forEach(([fid, data]) => session.setDataByFormId(fid, data));

        // 默认选中第一个可见且启用的表单
        const first = sorted.find((f) => {
          if (!f.enabled) return false;
          const rule = rules.find((r) => String(r.formId) === String(f.formId));
          return isFormMenuVisible(rule, dataByForm);
        });
        if (first) setActiveFormId(first.formId);
      } catch (err) {
        if (!cancelled) setBootError(err instanceof Error ? err.message : '初始化失败');
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId]);

  /* ---------- 切换表单：加载控件树 + 回填 ---------- */

  useEffect(() => {
    if (!activeFormId) return;
    let cancelled = false;
    setControls(null);
    setErrors({});
    getControlsTree(activeFormId)
      .then((payload) => {
        if (cancelled) return;
        markOriginalRuleTypes(payload.data);
        setControls(payload.data);
        setMeta(payload.metadata);
        // 深拷贝已存数据，避免与 sessionStore / 其他表单共享引用被就地修改
        const saved = ruleFormData[activeFormId] ?? {};
        const cloned: FormDataValue = JSON.parse(JSON.stringify(saved));
        setFormData(applySyncFromEntity(cloned, entity?.dataJson, payload.metadata.syncFromEntity));
      })
      .catch((err: unknown) => {
        if (!cancelled) setBootError(err instanceof Error ? err.message : '表单加载失败');
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFormId]);

  /* ---------- 菜单可见性（随已存数据变化而刷新） ---------- */

  const menuItems = useMemo(
    () =>
      forms.map((f) => {
        const rule = menuRules.find((r) => String(r.formId) === String(f.formId));
        return { form: f, visible: isFormMenuVisible(rule, ruleFormData) };
      }),
    [forms, menuRules, ruleFormData],
  );

  const activeForm = forms.find((f) => String(f.formId) === String(activeFormId));
  const activeStatus = findFormDataMapItem(batch, activeFormId ?? '')?.formEntryStatus ?? 1;

  /* ---------- 校验（仅可见控件；动态记录按记录逐项校验） ---------- */

  const collectEntries = useCallback(
    (tree: ControlDef[], data: FormDataValue): ValidateEntry[] => {
      const out: ValidateEntry[] = [];
      const walk = (list: ControlDef[], recordData?: Record<string, unknown>) => {
        for (const c of list) {
          if (c.selectedControlType === 'group-box') {
            const attrs = parsePrivateAttr(c);
            if (attrs.allowDynamicAdd) {
              const groupPath = getPropName(c);
              const records = getIn(data, splitPath(groupPath));
              const list0 = Array.isArray(records) ? (records as Array<Record<string, unknown>>) : [];
              list0.forEach((record, index) => {
                const clones = cloneChildrenForRecord(c.children ?? [], index, groupPath);
                for (const clone of clones) {
                  if (clone.selectedControlType === 'group-box') continue;
                  out.push({
                    control: clone,
                    value: getControlValue(data, clone),
                    key: `${clone.identifier}#${index}`,
                    recordData: record,
                  });
                }
              });
            } else {
              walk(c.children ?? [], recordData);
            }
            continue;
          }
          out.push({ control: c, value: getControlValue(data, c), key: c.identifier, recordData });
        }
      };
      walk(tree);
      return out;
    },
    [],
  );

  const doValidate = (data: FormDataValue): Record<string, string> => {
    if (!controls) return {};
    const ctx: VisibilityContext = { formData: data, ruleFormData, controls };
    const result: Record<string, string> = {};
    for (const entry of collectEntries(controls, data)) {
      const entryCtx: VisibilityContext = { ...ctx, recordData: entry.recordData };
      if (!shouldShowControl(entry.control, entryCtx)) continue;
      const msg = validateControl(entry.control, entry.value, viewOnly);
      if (msg) result[entry.key] = msg;
    }
    return result;
  };

  /* ---------- 保存 ---------- */

  const handleSave = async (isComplete: boolean) => {
    if (!controls || !activeFormId) return;
    const errs = doValidate(formData);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      message.warning(`有 ${Object.keys(errs).length} 项未通过校验，请检查标红字段`);
      return;
    }
    setSaving(true);
    try {
      const mapItem = findFormDataMapItem(batch, activeFormId);
      const result = await saveFormData({
        entityId,
        formId: activeFormId,
        formDataMapId: mapItem?.formDataMapId,
        formDataId: mapItem?.formDataId ?? undefined,
        data: formData,
        isComplete,
      });
      // 同步本地状态与 sessionStore（菜单徽标 / 跨表单规则即时生效）
      const nextBatch: FormDataMapBatch = batch.map((l1) =>
        l1.map((l2) =>
          l2.map((item) =>
            String(item.formId) === String(activeFormId)
              ? { ...item, formDataId: result.formDataId, formEntryStatus: result.formEntryStatus }
              : item,
          ),
        ),
      );
      setBatch(nextBatch);
      session.setFormDataMapBatch(nextBatch);
      session.setDataByFormId(activeFormId, JSON.parse(JSON.stringify(formData)));
      setRuleFormData((prev) => ({ ...prev, [activeFormId]: JSON.parse(JSON.stringify(formData)) }));
      message.success('保存成功');
    } catch (err) {
      message.error(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  /* ---------- 渲染 ---------- */

  if (bootError) {
    return (
      <div className="cf-page">
        <div className="cf-panel-head">
          <Typography.Title level={4} className="cf-panel-title">
            加载失败
          </Typography.Title>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            返回
          </Button>
        </div>
        <p className="cf-muted">{bootError}</p>
      </div>
    );
  }

  if (!entity) {
    return (
      <div className="cf-center">
        <Spin />
        <span className="cf-muted" style={{ marginLeft: 12 }}>加载中...</span>
      </div>
    );
  }

  return (
    <div className="cf-page">
      <div className="cf-page-head">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} />
          <Typography.Title level={3} style={{ margin: 0 }}>
            {entity.entityName}
          </Typography.Title>
        </Space>
        <Typography.Text type="secondary">
          已完成 {batch.flat(2).filter((i) => i && i.formEntryStatus === 3).length} /{' '}
          {batch.flat(2).length} 个表单
        </Typography.Text>
      </div>

      <div className="cf-workbench">
        {/* 左侧：表单菜单 */}
        <aside className="cf-menu">
          <div className="cf-menu-head">表单列表</div>
          <div className="cf-menu-list">
            {menuItems
              .filter((m) => m.visible)
              .map(({ form }) => {
                const status = findFormDataMapItem(batch, form.formId)?.formEntryStatus ?? 1;
                const active = String(form.formId) === String(activeFormId);
                return (
                  <button
                    key={form.formId}
                    type="button"
                    className={`cf-menu-item${active ? ' active' : ''}${!form.enabled ? ' disabled' : ''}`}
                    onClick={() => form.enabled && setActiveFormId(form.formId)}
                    disabled={!form.enabled}
                  >
                    <span className={`cf-status-dot status-${status}`} />
                    <span className="cf-menu-item-name" title={form.formDesc ?? form.formName}>
                      {form.formName}
                    </span>
                  </button>
                );
              })}
          </div>
        </aside>

        {/* 右侧：动态表单 */}
        <main className="cf-main-panel">
          {controls === null || !activeForm ? (
            <div className="cf-center">
              <Spin />
            </div>
          ) : (
            <>
              <div className="cf-panel-head">
                <Typography.Title level={4} className="cf-panel-title">
                  {activeForm.formName}
                  <Tag style={{ marginLeft: 10 }} color={statusColor(activeStatus)}>
                    {statusText(activeStatus)}
                  </Tag>
                </Typography.Title>
                {!viewOnly && (
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    loading={saving}
                    onClick={() => handleSave(true)}
                  >
                    保存
                  </Button>
                )}
              </div>
              {activeForm.formDesc && <p className="cf-panel-desc">{activeForm.formDesc}</p>}
              <FormRenderer
                controls={controls}
                value={formData}
                ruleFormData={ruleFormData}
                viewOnly={viewOnly}
                errors={errors}
                onChange={setFormData}
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
