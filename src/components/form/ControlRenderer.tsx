import type { ControlDef, FormDataValue, OptionItem } from '@/types/control';
import { getControlValue } from '@/utils/path';
import { InputTextControl } from '@/components/controls/InputTextControl';
import { InputTextareaControl } from '@/components/controls/InputTextareaControl';
import { InputNumberControl } from '@/components/controls/InputNumberControl';
import { InputNumberUnitControl } from '@/components/controls/InputNumberUnitControl';
import { RadioControl } from '@/components/controls/RadioControl';
import { CheckboxControl } from '@/components/controls/CheckboxControl';
import { SelectControl } from '@/components/controls/SelectControl';
import { DateTimePickerControl } from '@/components/controls/DateTimePickerControl';
import { TimePickerControl } from '@/components/controls/TimePickerControl';
import { CascaderControl } from '@/components/controls/CascaderControl';
import { CountableControl } from '@/components/controls/CountableControl';
import { LabelControl } from '@/components/controls/LabelControl';
import { UploadControl } from '@/components/controls/UploadControl';

interface ControlRendererProps {
  control: ControlDef;
  formData: FormDataValue;
  recordData?: Record<string, unknown>;
  options?: OptionItem[];
  variables?: Record<string, unknown>;
  viewOnly: boolean;
  onChange: (value: unknown) => void;
  onBatchChange?: (values: Record<string, unknown>) => void;
}

/** 按控件类型分发到具体控件组件（group-box 由外层渲染器处理） */
export function ControlRenderer({
  control,
  formData,
  recordData,
  options,
  variables,
  viewOnly,
  onChange,
  onBatchChange,
}: ControlRendererProps) {
  const value = getControlValue(formData, control);
  const base = { control, options, viewOnly, onChange, onBatchChange };

  switch (control.selectedControlType) {
    case 'input-text':
      return <InputTextControl {...base} value={value} />;
    case 'input-textarea':
      return <InputTextareaControl {...base} value={value} />;
    case 'input-number':
      return <InputNumberControl {...base} value={value} />;
    case 'input-number-unit':
      return <InputNumberUnitControl {...base} value={value} />;
    case 'radio':
      return <RadioControl {...base} value={value} />;
    case 'checkbox':
      return <CheckboxControl {...base} value={value} />;
    case 'select':
      return <SelectControl {...base} value={value} />;
    case 'date-time-picker':
      return <DateTimePickerControl {...base} value={value} />;
    case 'time-picker':
      return <TimePickerControl {...base} value={value} />;
    case 'cascade-select':
      return <CascaderControl {...base} value={value} />;
    case 'countable':
      return <CountableControl {...base} value={value} variables={variables} />;
    case 'label':
      return <LabelControl control={control} />;
    case 'dv-multimedia':
      return <UploadControl {...base} value={value} />;
    default:
      return <div className="cf-unsupported">暂不支持的控件类型：{control.selectedControlType}</div>;
  }
}
