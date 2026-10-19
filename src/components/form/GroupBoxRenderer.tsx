import { App, Button } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { ControlDef, FormDataValue } from '@/types/control';
import { parsePrivateAttr } from '@/utils/privateAttr';
import { cloneChildrenForRecord, makeInitialRecord } from '@/utils/controls';
import { getPropName, setControlValue } from '@/utils/path';
import { shouldShowControl, filterOptionsByRules, type VisibilityContext } from '@/utils/visibility';
import { ControlItem } from './ControlItem';

interface GroupBoxRendererProps {
  group: ControlDef;
  formData: FormDataValue;
  ruleFormData: Record<string, FormDataValue>;
  controls: ControlDef[];
  variables?: Record<string, unknown>;
  viewOnly: boolean;
  /** 错误表：动态记录内键为 `${identifier}#${recordIndex}` */
  errors: Record<string, string>;
  onChange: (next: FormDataValue) => void;
}

/**
 * 分组控件渲染：
 * - 普通分组：虚线框 + 标题，子控件按分组路径存取
 * - 动态复制分组（allowDynamicAdd）：记录列表 + 增删记录，子控件克隆后按记录扁平存取
 */
export function GroupBoxRenderer({
  group,
  formData,
  ruleFormData,
  controls,
  variables,
  viewOnly,
  errors,
  onChange,
}: GroupBoxRendererProps) {
  const { modal } = App.useApp();
  const attrs = parsePrivateAttr(group);
  const children = group.children ?? [];

  /* ---------- 动态复制分组 ---------- */
  if (attrs.allowDynamicAdd) {
    const groupPath = getPropName(group);
    const raw = (formData as Record<string, unknown>)[groupPath];
    const records: Array<Record<string, unknown>> = Array.isArray(raw) ? (raw as Array<Record<string, unknown>>) : [];
    const maxCount = Number(group.maxCount ?? 0) || Infinity;

    const addRecord = () => {
      if (records.length >= maxCount) return;
      onChange(setControlValue(formData, group, [...records, makeInitialRecord(children)]));
    };

    const removeRecord = (index: number) => {
      modal.confirm({
        title: '确认删除该条记录？',
        content: '删除后不可恢复',
        okText: '删除',
        cancelText: '取消',
        onOk: () => {
          const next = records.filter((_, i) => i !== index);
          onChange(setControlValue(formData, group, next));
        },
      });
    };

    return (
      <div className="cf-group dynamic">
        <div className="cf-group-head">
          <span className="cf-group-title">{group.nameZh}</span>
          <span className="cf-group-sub">
            {records.length}/{maxCount === Infinity ? '不限' : maxCount} 条记录
          </span>
          {!viewOnly && (
            <Button
              size="small"
              type="dashed"
              icon={<PlusOutlined />}
              disabled={records.length >= maxCount}
              onClick={addRecord}
            >
              增加记录
            </Button>
          )}
        </div>
        {records.length === 0 && <div className="cf-group-empty">暂无记录，点击“增加记录”开始填写</div>}
        {records.map((record, index) => {
          const clones = cloneChildrenForRecord(children, index, groupPath);
          const recordCtx: VisibilityContext = { formData, ruleFormData, controls, recordData: record };
          return (
            <div className="cf-record" key={index}>
              <div className="cf-record-head">
                <span>记录 {index + 1}</span>
                {!viewOnly && records.length > 0 && (
                  <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => removeRecord(index)}>
                    删除
                  </Button>
                )}
              </div>
              <div className="cf-form">
                {clones.map((child) => {
                  const visible = shouldShowControl(child, recordCtx);
                  if (!visible) return null;
                  const options =
                    child.selectedControlType === 'radio' || child.selectedControlType === 'checkbox' || child.selectedControlType === 'select'
                      ? filterOptionsByRules(child, recordCtx)
                      : undefined;
                  return (
                    <ControlItem
                      key={child.identifier}
                      control={child}
                      formData={formData}
                      recordData={record}
                      options={options}
                      variables={variables}
                      viewOnly={viewOnly}
                      error={errors[`${child.identifier}#${index}`]}
                      onChange={(v) => onChange(setControlValue(formData, child, v))}
                      onBatchChange={(values) => {
                        let next = formData;
                        for (const [identifier, v] of Object.entries(values)) {
                          const sibling = clones.find((c) => c.identifier === identifier);
                          if (sibling) next = setControlValue(next, sibling, v);
                        }
                        if (next !== formData) onChange(next);
                      }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  /* ---------- 普通静态分组 ---------- */
  const ctx: VisibilityContext = { formData, ruleFormData, controls };
  return (
    <div className={`cf-group${attrs.invisible ? ' invisible' : ''}`}>
      {!attrs.invisible && <div className="cf-group-head">
        <span className="cf-group-title">{group.nameZh}</span>
      </div>}
      <div className="cf-form">
        {children.map((child) => {
          if (!shouldShowControl(child, ctx)) return null;
          const options =
            child.selectedControlType === 'radio' || child.selectedControlType === 'checkbox' || child.selectedControlType === 'select'
              ? filterOptionsByRules(child, ctx)
              : undefined;
          return (
            <ControlItem
              key={child.identifier}
              control={child}
              formData={formData}
              options={options}
              variables={variables}
              viewOnly={viewOnly}
              error={errors[child.identifier]}
              onChange={(v) => onChange(setControlValue(formData, child, v))}
              onBatchChange={(values) => {
                let next = formData;
                for (const [identifier, v] of Object.entries(values)) {
                  const sibling = children.find((c) => c.identifier === identifier);
                  if (sibling) next = setControlValue(next, sibling, v);
                }
                if (next !== formData) onChange(next);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
