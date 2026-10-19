/**
 * 演示系统 A：设备巡检管理系统（完全虚构）
 * 覆盖全部控件类型 + 静态分组 + 预设回填 + 实体数据同步 + 菜单显隐规则 + 附件上传。
 */
import type { ControlDef } from '@/types/control';
import type { MenuRuleConfig, SyncMapping } from '@/types/form';
import { ctrl, pa } from './shared';

/* ---------- F-A01 巡检基本信息（全控件类型） ---------- */

const fa01: ControlDef[] = [
  ctrl({
    identifier: 'note_head',
    nameZh: '填表说明',
    selectedControlType: 'label',
    colNumber: 12,
    privateAttr: pa({
      explanation:
        '本表单用于登记巡检基本信息，包含文本、数值、下拉、单选、多选、级联、日期、时间、附件、分组与预设回填控件。',
      bodyFontSize: 12,
      bodyFontColor: '#8c8c8c',
    }),
  }),
  ctrl({
    identifier: 'check_no',
    nameZh: '巡检单编号',
    selectedControlType: 'input-text',
    required: true,
    placeholder: '请输入巡检单编号',
  }),
  ctrl({
    identifier: 'grp_device',
    nameZh: '设备信息',
    selectedControlType: 'group-box',
    colNumber: 12,
    children: [
      ctrl({
        identifier: 'device_name',
        nameZh: '设备名称',
        selectedControlType: 'input-text',
        customGroup: '设备信息',
        required: true,
      }),
      ctrl({
        identifier: 'device_no',
        nameZh: '设备编号',
        selectedControlType: 'input-text',
        customGroup: '设备信息',
        required: true,
      }),
    ],
  }),
  ctrl({
    identifier: 'device_type',
    nameZh: '设备类型',
    selectedControlType: 'select',
    required: true,
    privateAttr: pa({
      options: [
        { value: 'elevator', label: '电梯类' },
        { value: 'pump', label: '水泵类' },
        { value: 'fan', label: '风机类' },
        { value: 'other', label: '其他' },
      ],
    }),
  }),
  ctrl({
    identifier: 'check_category',
    nameZh: '巡检类别',
    selectedControlType: 'radio',
    required: true,
    privateAttr: pa({
      options: [
        { value: 'daily', label: '日常巡检' },
        { value: 'special', label: '专项巡检' },
      ],
      numberOfOptionsPerLine: 2,
    }),
  }),
  ctrl({
    identifier: 'check_items',
    nameZh: '检查项',
    selectedControlType: 'checkbox',
    required: true,
    desc: '勾选“不详”后将自动取消其余选项',
    privateAttr: pa({
      options: [
        { value: 'ok_look', label: '外观完好' },
        { value: 'ok_sound', label: '运行无异响' },
        { value: 'ok_param', label: '参数在允许范围' },
        { value: '998', label: '不详' },
      ],
    }),
  }),
  ctrl({
    identifier: 'install_location',
    nameZh: '安装位置',
    selectedControlType: 'cascade-select',
    required: true,
    placeholder: '请选择区域 / 位置',
  }),
  ctrl({
    identifier: 'device_count',
    nameZh: '设备数量',
    selectedControlType: 'input-number',
    required: true,
    privateAttr: pa({
      range: { minValue: 1, maxValue: 100 },
      checkedNumberAccuracy: 0,
      suffix: '台',
    }),
  }),
  ctrl({
    identifier: 'device_weight',
    nameZh: '设备重量',
    selectedControlType: 'input-number-unit',
    required: true,
    privateAttr: pa({
      units: [{ unit: 'kg' }, { unit: 'g' }, { unit: 't' }],
      checkedUnit: { range: { minValue: 0, maxValue: 500 } },
    }),
  }),
  ctrl({
    identifier: 'check_date',
    nameZh: '巡检日期',
    selectedControlType: 'date-time-picker',
    required: true,
    privateAttr: pa({ checkedAccuracy: '日' }),
  }),
  ctrl({
    identifier: 'check_time',
    nameZh: '巡检时间',
    selectedControlType: 'time-picker',
    required: true,
    privateAttr: pa({ timeFormat: 'HH:mm' }),
  }),
  ctrl({
    identifier: 'checker_name',
    nameZh: '巡检人',
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
    nameZh: '巡检说明',
    selectedControlType: 'input-textarea',
    colNumber: 12,
    placeholder: '补充说明（选填）',
  }),
  ctrl({
    identifier: 'site_photos',
    nameZh: '现场照片',
    selectedControlType: 'dv-multimedia',
    colNumber: 12,
    required: true,
    privateAttr: pa({ type: 'jpg,png,mp4', size: 20, number: 5 }),
  }),
];

/** 实体数据同步映射（替代原后端按表单写死的同步逻辑） */
export const fa01Sync: SyncMapping[] = [
  { formKey: '_custom_group_设备信息.device_name', jsonKey: 'deviceName' },
  { formKey: '_custom_group_设备信息.device_no', jsonKey: 'deviceNo' },
];

/* ---------- F-A02 功能检查记录（单选 / 多选 / 计算汇总） ---------- */

const fa02: ControlDef[] = [
  ctrl({
    identifier: 'appearance_result',
    nameZh: '外观检查结果',
    selectedControlType: 'radio',
    required: true,
    desc: '选择“不合格”后，左侧菜单将出现“整改回执单”',
    privateAttr: pa({
      options: [
        { value: '1', label: '合格' },
        { value: '2', label: '不合格' },
      ],
    }),
  }),
  ctrl({
    identifier: 'func_items',
    nameZh: '功能项确认',
    selectedControlType: 'checkbox',
    privateAttr: pa({
      options: [
        { value: 'func_a', label: '启动功能正常' },
        { value: 'func_b', label: '停机功能正常' },
        { value: 'func_c', label: '告警功能正常' },
      ],
    }),
  }),
  ctrl({
    identifier: 'special_confirm',
    nameZh: '复核结论',
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
    nameZh: '缺陷项 A 数量',
    selectedControlType: 'input-number',
    privateAttr: pa({ range: { minValue: 0, maxValue: 10 }, checkedNumberAccuracy: 0 }),
  }),
  ctrl({
    identifier: 'defect_b',
    nameZh: '缺陷项 B 数量',
    selectedControlType: 'input-number',
    privateAttr: pa({ range: { minValue: 0, maxValue: 10 }, checkedNumberAccuracy: 0 }),
  }),
  ctrl({
    identifier: 'defect_total',
    nameZh: '缺陷总分',
    selectedControlType: 'countable',
    desc: '自动计算：缺陷A + 缺陷B × 2',
    privateAttr: pa({
      countableExpression: '[defect_a]+[defect_b]*2',
      suffix: '分',
    }),
  }),
  ctrl({
    identifier: 'defect_grade',
    nameZh: '缺陷等级',
    selectedControlType: 'countable',
    desc: '按总分自动评级',
    privateAttr: pa({
      countableExpression: '[defect_total]',
      gradeMapping: [
        { min: 0, max: 2, value: 'Ⅰ', label: '轻微' },
        { min: 3, max: 5, value: 'Ⅱ', label: '一般' },
        { min: 6, value: 'Ⅲ', label: '严重' },
      ],
    }),
  }),
];

/* ---------- F-A03 整改回执单（菜单规则 + DISPLAY/SKIP） ---------- */

const fa03: ControlDef[] = [
  ctrl({
    identifier: 'rectify_type',
    nameZh: '整改方式',
    selectedControlType: 'radio',
    required: true,
    privateAttr: pa({
      options: [
        { value: 'site', label: '现场整改' },
        { value: 'factory', label: '返厂整改' },
      ],
    }),
  }),
  ctrl({
    identifier: 'factory_address',
    nameZh: '返厂地址',
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
    nameZh: '豁免单编号',
    selectedControlType: 'input-text',
    desc: '现场整改时自动隐藏',
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
    nameZh: '整改措施',
    selectedControlType: 'input-textarea',
    colNumber: 12,
    required: true,
  }),
  ctrl({
    identifier: 'rectify_deadline',
    nameZh: '整改期限',
    selectedControlType: 'date-time-picker',
    required: true,
    privateAttr: pa({ checkedAccuracy: '日' }),
  }),
];

/* ---------- F-A04 快速联系单（浮动弹层表单） ---------- */

const fa04: ControlDef[] = [
  ctrl({
    identifier: 'contact_topic',
    nameZh: '联系事由',
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
    formName: '巡检基本信息',
    formOrder: 1,
    enabled: true,
    formLayout: 'horizontal' as const,
    formDesc: '巡检基本信息与现场情况记录',
    syncFromEntity: fa01Sync,
    tree: fa01,
  },
  {
    formId: 'F-A02',
    formName: '功能检查记录',
    formOrder: 2,
    enabled: true,
    formLayout: 'horizontal' as const,
    formDesc: '检查结果记录与缺陷等级评定',
    tree: fa02,
  },
  {
    formId: 'F-A03',
    formName: '整改回执单',
    formOrder: 3,
    enabled: true,
    formLayout: 'horizontal' as const,
    formDesc: '受菜单显隐规则控制：功能检查结果为“不合格”时显示',
    tree: fa03,
  },
  {
    formId: 'F-A04',
    formName: '快速联系单',
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
        check_no: 'XJ-2026-0001',
        _custom_group_设备信息: { device_name: '1号主循环水泵', device_no: 'SB-A-001' },
        device_type: 'pump',
        check_category: 'daily',
        check_items: '["ok_look","ok_sound"]',
        install_location: 'east/hangzhou/xihu',
        device_count: 4,
        device_weight: { magnitude: 120.5, units: 'kg' },
        check_date: '2026-10-15 00:00:00',
        check_time: '09:30',
        checker_name: '王志强',
        checker_phone: '13800000001',
        remark: '历史回填数据，包含 JSON 数组字符串、带单位数值、级联路径等格式。',
        site_photos: JSON.stringify([
          { fileName: 'a1b2c3d4e5f60718293a4b5c6d7e8f90_泵体外观.jpg', fileSize: 204800, fileType: 'image/jpeg' },
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
        rectify_measures: '已更换密封件并复测，运行正常。',
        rectify_deadline: '2026-10-20 00:00:00',
      },
    },
  },
  'ENT-A-3': {
    'F-A01': {
      status: 2,
      data: {
        check_no: 'XJ-2026-0003',
        _custom_group_设备信息: { device_name: '3号冷却风机' },
        device_type: 'fan',
        check_category: 'daily',
      },
    },
  },
};
