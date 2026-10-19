/**
 * 系统 A：慢病随访管理系统（完全虚构）
 * 覆盖全部控件类型 + 静态分组 + 预设回填 + 实体数据同步 + 菜单显隐规则 + 附件上传。
 * 表单：患者基本信息 / 实验室检查记录 / 复诊提醒单 / 会诊申请单。
 */
import type { ControlDef } from '@/types/control';
import type { MenuRuleConfig, SyncMapping } from '@/types/form';
import { ctrl, pa } from './shared';

/* ---------- F-A01 患者基本信息（全控件类型） ---------- */

const fa01: ControlDef[] = [
  ctrl({
    identifier: 'note_head',
    nameZh: '填表说明',
    selectedControlType: 'label',
    colNumber: 12,
    privateAttr: pa({
      explanation:
        '本表单用于登记慢病随访患者的基本信息，包含文本、数值、下拉、单选、多选、级联、日期、时间、附件、分组与预设回填控件。',
      bodyFontSize: 14,
      bodyFontColor: '#8c8c8c',
    }),
  }),
  ctrl({
    identifier: 'check_no',
    nameZh: '随访编号',
    selectedControlType: 'input-text',
    required: true,
    placeholder: '请输入随访编号',
  }),
  ctrl({
    identifier: 'grp_patient',
    nameZh: '基本信息',
    selectedControlType: 'group-box',
    colNumber: 12,
    children: [
      ctrl({
        identifier: 'patient_name',
        nameZh: '患者姓名',
        selectedControlType: 'input-text',
        customGroup: '基本信息',
        required: true,
      }),
      ctrl({
        identifier: 'patient_no',
        nameZh: '门诊号',
        selectedControlType: 'input-text',
        customGroup: '基本信息',
        required: true,
      }),
    ],
  }),
  ctrl({
    identifier: 'device_type',
    nameZh: '疾病诊断',
    selectedControlType: 'select',
    required: true,
    privateAttr: pa({
      options: [
        { value: 'hypertension', label: '高血压' },
        { value: 'diabetes', label: '2型糖尿病' },
        { value: 'coronary', label: '冠心病' },
        { value: 'copd', label: '慢阻肺' },
        { value: 'other', label: '其他' },
      ],
    }),
  }),
  ctrl({
    identifier: 'check_category',
    nameZh: '随访方式',
    selectedControlType: 'radio',
    required: true,
    privateAttr: pa({
      options: [
        { value: 'daily', label: '门诊随访' },
        { value: 'special', label: '电话随访' },
      ],
      numberOfOptionsPerLine: 2,
    }),
  }),
  ctrl({
    identifier: 'check_items',
    nameZh: '本次症状',
    selectedControlType: 'checkbox',
    required: true,
    desc: '勾选“不详”后将自动取消其余选项',
    privateAttr: pa({
      options: [
        { value: 'ok_look', label: '无明显不适' },
        { value: 'ok_sound', label: '头晕乏力' },
        { value: 'ok_param', label: '心悸胸闷' },
        { value: '998', label: '不详' },
      ],
    }),
  }),
  ctrl({
    identifier: 'install_location',
    nameZh: '就诊科室',
    selectedControlType: 'cascade-select',
    required: true,
    placeholder: '请选择院区 / 科室',
  }),
  ctrl({
    identifier: 'device_count',
    nameZh: '病程年限',
    selectedControlType: 'input-number',
    required: true,
    privateAttr: pa({
      range: { minValue: 1, maxValue: 100 },
      checkedNumberAccuracy: 0,
      suffix: '年',
    }),
  }),
  ctrl({
    identifier: 'device_weight',
    nameZh: '体重',
    selectedControlType: 'input-number-unit',
    required: true,
    privateAttr: pa({
      units: [{ unit: 'kg' }, { unit: 'g' }, { unit: 't' }],
      checkedUnit: { range: { minValue: 0, maxValue: 500 } },
    }),
  }),
  ctrl({
    identifier: 'check_date',
    nameZh: '随访日期',
    selectedControlType: 'date-time-picker',
    required: true,
    privateAttr: pa({ checkedAccuracy: '日' }),
  }),
  ctrl({
    identifier: 'check_time',
    nameZh: '随访时间',
    selectedControlType: 'time-picker',
    required: true,
    privateAttr: pa({ timeFormat: 'HH:mm' }),
  }),
  ctrl({
    identifier: 'checker_name',
    nameZh: '随访医生',
    selectedControlType: 'input-text',
    required: true,
    privateAttr: pa({
      getRefernceData: {
        buttonName: '选择人员',
        buttonType: 'person',
        adjoinIdentifier: 'checker_phone',
      },
    }),
  }),
  ctrl({
    identifier: 'checker_phone',
    nameZh: '联系电话',
    selectedControlType: 'input-text',
    privateAttr: pa({
      validator: { value: '^1\\d{10}$', errorExplain: '请输入 11 位手机号' },
    }),
  }),
  ctrl({
    identifier: 'remark',
    nameZh: '随访记录',
    selectedControlType: 'input-textarea',
    colNumber: 12,
    placeholder: '补充说明（选填）',
  }),
  ctrl({
    identifier: 'site_photos',
    nameZh: '检查报告附件',
    selectedControlType: 'dv-multimedia',
    colNumber: 12,
    required: true,
    privateAttr: pa({ type: 'jpg,png,pdf', size: 20, number: 5 }),
  }),
];

/** 实体数据同步映射（替代原后端按表单写死的同步逻辑） */
export const fa01Sync: SyncMapping[] = [
  { formKey: '_custom_group_基本信息.patient_name', jsonKey: 'patientName' },
  { formKey: '_custom_group_基本信息.patient_no', jsonKey: 'patientNo' },
];

/* ---------- F-A02 实验室检查记录（单选 / 多选 / 计算汇总） ---------- */

const fa02: ControlDef[] = [
  ctrl({
    identifier: 'appearance_result',
    nameZh: '检查结论',
    selectedControlType: 'radio',
    required: true,
    desc: '选择“异常”后，左侧菜单将出现“复诊提醒单”',
    privateAttr: pa({
      options: [
        { value: '1', label: '正常' },
        { value: '2', label: '异常' },
      ],
    }),
  }),
  ctrl({
    identifier: 'func_items',
    nameZh: '已完成检查项',
    selectedControlType: 'checkbox',
    privateAttr: pa({
      options: [
        { value: 'func_a', label: '血常规' },
        { value: 'func_b', label: '尿常规' },
        { value: 'func_c', label: '生化全套' },
      ],
    }),
  }),
  ctrl({
    identifier: 'special_confirm',
    nameZh: '复核意见',
    selectedControlType: 'checkbox',
    desc: '“不详”与普通选项互斥',
    privateAttr: pa({
      options: [
        { value: 'normal', label: '复核通过' },
        { value: 'abnormal', label: '复核未通过' },
        { value: '998', label: '不详' },
      ],
    }),
  }),
  ctrl({
    identifier: 'defect_a',
    nameZh: '血脂异常项数',
    selectedControlType: 'input-number',
    privateAttr: pa({ range: { minValue: 0, maxValue: 10 }, checkedNumberAccuracy: 0 }),
  }),
  ctrl({
    identifier: 'defect_b',
    nameZh: '血糖异常项数',
    selectedControlType: 'input-number',
    privateAttr: pa({ range: { minValue: 0, maxValue: 10 }, checkedNumberAccuracy: 0 }),
  }),
  ctrl({
    identifier: 'defect_total',
    nameZh: '异常积分',
    selectedControlType: 'countable',
    desc: '自动计算：血脂异常 + 血糖异常 × 2',
    privateAttr: pa({
      countableExpression: '[defect_a]+[defect_b]*2',
      suffix: '分',
    }),
  }),
  ctrl({
    identifier: 'defect_grade',
    nameZh: '风险等级',
    selectedControlType: 'countable',
    desc: '按异常积分自动评级',
    privateAttr: pa({
      countableExpression: '[defect_total]',
      gradeMapping: [
        { min: 0, max: 2, value: 'Ⅰ', label: '低危' },
        { min: 3, max: 5, value: 'Ⅱ', label: '中危' },
        { min: 6, value: 'Ⅲ', label: '高危' },
      ],
    }),
  }),
];

/* ---------- F-A03 复诊提醒单（菜单规则 + DISPLAY/SKIP） ---------- */

const fa03: ControlDef[] = [
  ctrl({
    identifier: 'rectify_type',
    nameZh: '复诊方式',
    selectedControlType: 'radio',
    required: true,
    privateAttr: pa({
      options: [
        { value: 'site', label: '门诊复诊' },
        { value: 'factory', label: '住院复诊' },
      ],
    }),
  }),
  ctrl({
    identifier: 'factory_address',
    nameZh: '住院病区',
    selectedControlType: 'input-text',
    required: true,
    ruleType: 'DISPLAY',
    logicalConjunction: 'AND',
    ruleList: [
      {
        type: 0,
        ruleValue: 'factory',
        dependControlIdentifier: 'rectify_type',
        dependFormId: 'F-A03',
        belongFormId: 'F-A03',
      },
    ],
  }),
  ctrl({
    identifier: 'exempt_no',
    nameZh: '免复诊证明编号',
    selectedControlType: 'input-text',
    desc: '门诊复诊时自动隐藏',
    ruleType: 'SKIP',
    ruleList: [
      {
        type: 0,
        ruleValue: 'site',
        dependControlIdentifier: 'rectify_type',
        dependFormId: 'F-A03',
        belongFormId: 'F-A03',
      },
    ],
  }),
  ctrl({
    identifier: 'rectify_measures',
    nameZh: '复诊建议',
    selectedControlType: 'input-textarea',
    colNumber: 12,
    required: true,
  }),
  ctrl({
    identifier: 'rectify_deadline',
    nameZh: '计划复诊日期',
    selectedControlType: 'date-time-picker',
    required: true,
    privateAttr: pa({ checkedAccuracy: '日' }),
  }),
];

/* ---------- F-A04 会诊申请单（浮动弹层表单） ---------- */

const fa04: ControlDef[] = [
  ctrl({
    identifier: 'contact_topic',
    nameZh: '会诊事由',
    selectedControlType: 'input-text',
    colNumber: 12,
    required: true,
  }),
  ctrl({
    identifier: 'contact_note',
    nameZh: '备注',
    selectedControlType: 'input-textarea',
    colNumber: 12,
  }),
];

export const systemAForms = [
  {
    formId: 'F-A01',
    formName: '患者基本信息',
    formOrder: 1,
    enabled: true,
    formLayout: 'horizontal' as const,
    formDesc: '患者基本信息与本次随访情况记录',
    syncFromEntity: fa01Sync,
    tree: fa01,
  },
  {
    formId: 'F-A02',
    formName: '实验室检查记录',
    formOrder: 2,
    enabled: true,
    formLayout: 'horizontal' as const,
    formDesc: '检查结果记录与风险等级评定',
    tree: fa02,
  },
  {
    formId: 'F-A03',
    formName: '复诊提醒单',
    formOrder: 3,
    enabled: true,
    formLayout: 'horizontal' as const,
    formDesc: '受菜单显隐规则控制：检查结论为“异常”时显示',
    tree: fa03,
  },
  {
    formId: 'F-A04',
    formName: '会诊申请单',
    formOrder: 4,
    enabled: true,
    formLayout: 'horizontal' as const,
    formDesc: '以浮动弹层打开的辅助表单',
    tree: fa04,
  },
];

export const systemAMenuRules: MenuRuleConfig[] = [
  {
    formId: 'F-A03',
    ruleType: 'DISPLAY',
    logicalConjunction: 'AND',
    ruleList: [
      {
        type: 0,
        ruleValue: '2',
        dependControlIdentifier: 'appearance_result',
        dependFormId: 'F-A02',
        belongFormId: 'F-A03',
      },
    ],
  },
];

/** 已保存表单数据（entityId → formId → 数据） */
export const systemASavedData: Record<string, Record<string, { status: number; data: Record<string, unknown> }>> = {
  'ENT-A-1': {
    'F-A01': {
      status: 3,
      data: {
        check_no: 'SF-2026-0001',
        _custom_group_基本信息: { patient_name: '张建国', patient_no: 'MZ-1024763' },
        device_type: 'hypertension',
        check_category: 'daily',
        check_items: '["ok_look","ok_sound"]',
        install_location: 'main/cardio/hypertension',
        device_count: 8,
        device_weight: { magnitude: 72.5, units: 'kg' },
        check_date: '2026-10-15 00:00:00',
        check_time: '09:30',
        checker_name: '陈建国',
        checker_phone: '13800000001',
        remark: '历史回填数据，包含 JSON 数组字符串、带单位数值、级联路径等格式。',
        site_photos: JSON.stringify([
          { fileName: 'a1b2c3d4e5f60718293a4b5c6d7e8f90_化验单.jpg', fileSize: 204800, fileType: 'image/jpeg' },
        ]),
      },
    },
    'F-A02': {
      status: 3,
      data: {
        appearance_result: '2',
        func_items: '["func_a","func_b","func_c"]',
        special_confirm: '["abnormal"]',
        defect_a: 1,
        defect_b: 2,
        defect_total: 5,
        defect_grade: 'Ⅱ',
      },
    },
    'F-A03': {
      status: 3,
      data: {
        rectify_type: 'site',
        exempt_no: null,
        rectify_measures: '调整降压方案，两周后门诊复查动态血压。',
        rectify_deadline: '2026-10-30 00:00:00',
      },
    },
  },
  'ENT-A-3': {
    'F-A01': {
      status: 2,
      data: {
        check_no: 'SF-2026-0003',
        _custom_group_基本信息: { patient_name: '周淑芬' },
        device_type: 'diabetes',
        check_category: 'daily',
      },
    },
  },
};
