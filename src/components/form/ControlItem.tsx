import type { CSSProperties } from 'react';
import type { ControlDef, FormDataValue, OptionItem } from '@/types/control';
import { ControlRenderer } from './ControlRenderer';

interface ControlItemProps {
  control: ControlDef;
  formData: FormDataValue;
  /** 动态复制记录的扁平数据（记录内规则评估用） */
  recordData?: Record<string, unknown>;
  options?: OptionItem[];
  variables?: Record<string, unknown>;
  viewOnly: boolean;
  error?: string;
  onChange: (value: unknown) => void;
  onBatchChange?: (values: Record<string, unknown>) => void;
}

/** 栅格宽度：colNumber 为 12 分制（12=整行，6=半行，默认 6），预留行内间距 */
function gridColumnStyle(control: ControlDef): CSSProperties | undefined {
  const col = Number(control.colNumber);
  const span = Number.isFinite(col) && col > 0 ? Math.min(col, 12) : 6;
  if (span >= 12) return { width: '100%' };
  return { width: `calc(${(span / 12) * 100}% - 6px)` };
}

/** 单个控件的表单项包装：标签 + 必填标记 + 控件 + 说明 + 错误提示 */
export function ControlItem({
  control,
  formData,
  recordData,
  options,
  variables,
  viewOnly,
  error,
  onChange,
  onBatchChange,
}: ControlItemProps) {
  const showLabel = control.selectedControlType !== 'label';
  const grid = gridColumnStyle(control);
  return (
    <div className={`cf-form-item${error ? ' has-error' : ''}`} style={grid}>
      {showLabel && (
        <label className="cf-form-label">
          {control.required && <span className="cf-required">*</span>}
          {control.nameZh}
        </label>
      )}
      <div className={showLabel ? 'cf-form-control' : 'cf-form-control-full'}>
        <ControlRenderer
          control={control}
          formData={formData}
          recordData={recordData}
          options={options}
          variables={variables}
          viewOnly={viewOnly}
          onChange={onChange}
          onBatchChange={onBatchChange}
        />
        {control.desc && !error && <div className="cf-form-desc">{control.desc}</div>}
        {error && <div className="cf-form-error">{error}</div>}
      </div>
    </div>
  );
}
