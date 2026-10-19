/**
 * 表单控件相关类型定义。
 * 字段命名与原 Vue 版本的后端数据结构保持一致（selectedControlType / privateAttr /
 * ruleType / ruleList 等），便于 Mock 数据与未来真实接口对接。
 */

export type ControlType =
  | 'checkbox'
  | 'radio'
  | 'group-box'
  | 'input-textarea'
  | 'input-text'
  | 'countable'
  | 'date-time-picker'
  | 'time-picker'
  | 'input-number'
  | 'input-number-unit'
  | 'select'
  | 'label'
  | 'dv-multimedia'
  | 'cascade-select';

/** 显隐规则类型：DISPLAY=满足条件显示；SKIP=满足条件隐藏；default=强制隐藏；''/空=始终显示 */
export type RuleType = 'DISPLAY' | 'SKIP' | 'default' | '' | null | undefined;

export interface OptionItem {
  value: string | number;
  label: string;
  /** 是否隐藏该选项 */
  unShow?: boolean;
  /** 选项说明，可用于数字含义（如评分） */
  desc?: string;
}

export interface UnitItem {
  unit: string;
}

export interface ValueRange {
  minValue?: number | string | null;
  maxValue?: number | string | null;
}

/** countable 控件的分段映射（总分 → 等级值），替代原后端脚本写死的阈值 */
export interface GradeRule {
  min?: number;
  max?: number;
  value: string | number;
  label?: string;
}

export type ControlEventType = 'loadControl' | 'showControl' | 'valueChange';

export interface ControlEventItem {
  value: ControlEventType;
  enable: boolean;
}

/** 预设信息按钮配置（原 getRefernceData） */
export interface PresetConfig {
  buttonName: string;
  buttonType: 'person' | 'address' | 'institution';
  /** person 类型的子类型 */
  type?: string;
  /** 选择后回填到相邻控件（identifier） */
  adjoinIdentifier?: string;
}

/**
 * 控件私有属性（后端以 JSON 字符串下发，存储在 privateAttr 字段中）。
 * 这里定义的是本系统消费到的键；其余键原样保留。
 */
export interface PrivateAttr {
  defaultValue?: unknown;
  options?: OptionItem[];
  suffix?: string;
  units?: UnitItem[];
  range?: ValueRange;
  /** 带单位数值控件的校验区间 */
  checkedUnit?: { range?: ValueRange };
  /** 数值精度（小数位），超长自动四舍五入 */
  checkedNumberAccuracy?: number;
  /** 正则校验配置 */
  validator?: { value: string; errorExplain?: string };
  /** 单选每行选项数 */
  numberOfOptionsPerLine?: number;
  /** countable 计算表达式，如 "[item_1]+[item_2]*2" */
  countableExpression?: string;
  /** 变量特殊值映射，如 { "99": 3 } 表示取值 99 时按 3 参与计算 */
  specialMap?: Record<string, string | number>;
  /** 总分 → 等级映射 */
  gradeMapping?: GradeRule[];
  /** label 控件说明内容 */
  explanation?: string;
  titleFontColor?: string;
  titleFontSize?: number;
  bodyFontColor?: string;
  bodyFontSize?: number;
  orientation?: 'left' | 'center' | 'right';
  /** 分组是否允许动态复制（增加记录） */
  allowDynamicAdd?: boolean;
  /** 分组是否不可见（纯布局分组） */
  invisible?: boolean;
  /** 控件事件声明（仅元数据；脚本执行见 runtime/safeJsExecutor） */
  controlEventList?: ControlEventItem[];
  /** 加载脚本（本期不迁移执行能力） */
  loadControlJsCode?: string;
  /** 值变化脚本（本期不迁移执行能力） */
  valueChangeJsCode?: string;
  /** 时间选择格式 */
  timeFormat?: string;
  /** 日期精度：年/月/日/时/分 */
  checkedAccuracy?: string;
  timeUpperLimit?: 'currentTime' | 'custom' | string;
  timeLowerLimit?: 'currentTime' | 'custom' | string;
  range_date?: { minDate?: string; maxDate?: string };
  /** 上传控件：允许类型（逗号分隔）、大小 MB、数量 */
  type?: string;
  size?: number;
  number?: number;
  /** 预设信息配置（JSON 字符串或对象，两种历史格式都兼容） */
  getRefernceData?: string | PresetConfig;
}

/** 显隐规则 / 菜单规则条目 */
export interface RuleItem {
  /** 0=普通条件；1=恒真；2=选项过滤（otherInfo 携带允许的选项值） */
  type: number;
  ruleValue: string;
  dependControlIdentifier?: string | null;
  dependFormId: string | number;
  dependControlType?: string;
  belongFormId: string | number;
  /** 依赖控件所在的自定义分组名 */
  controlCustomGroup?: string | null;
  /** type=2 时为 JSON 数组字符串，表示依赖值命中后允许显示的选项 */
  otherInfo?: string | null;
}

/** 运行期标记（内部使用，不下发） */
interface RuntimeFlags {
  _isDynamicClone?: boolean;
  _forceHide?: boolean;
  _originalRuleType?: RuleType;
  _fromDynamicCopy?: boolean;
  /** 动态克隆控件所属记录下标 */
  _dynamicIndex?: number;
  /** 动态克隆控件所属分组的取值路径（formData 中的 prop 名） */
  _dynamicGroupPath?: string;
}

export interface ControlDef extends RuntimeFlags {
  controlId: string | number;
  identifier: string;
  nameZh: string;
  selectedControlType: ControlType;
  /** 栅格列数（24 栅格中的 12 分制，0 视为默认 6 → span 12） */
  colNumber?: number;
  /** JSON 字符串，见 PrivateAttr */
  privateAttr?: string;
  /** 自定义分组名（数据存储在 formData['_custom_group_<名>'] 下） */
  customGroup?: string | null;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  desc?: string | null;
  placeholder?: string | null;
  ruleType?: RuleType;
  ruleList?: RuleItem[];
  logicalConjunction?: 'AND' | 'OR' | null;
  children?: ControlDef[];
  /** 动态复制组最大记录数 */
  maxCount?: number | string | null;
  /** 后端校验提示（存在则该字段常显错误） */
  jsExplainInfo?: string | null;
  description?: string | null;
}

/** 带单位数值控件的值 */
export interface UnitValue {
  magnitude: string | number | null;
  units: string | null;
}

/** 附件条目（formData 中以 JSON 字符串存储） */
export interface FileEntry {
  fileName: string;
  fileSize: number;
  fileType: string;
}

/** 表单数据：identifier → 值；分组字段挂在 '_custom_group_<名>' 对象下 */
export type FormDataValue = Record<string, unknown>;
