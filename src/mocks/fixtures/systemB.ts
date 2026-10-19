/**
 * 系统 B：健康风险评估管理系统（完全虚构）
 * 覆盖动态能力：控件联动显隐（DISPLAY/SKIP/type-2 选项过滤/单位值规则/禁用默认值）、
 * 动态复制组（增删记录、记录内联动、上限）、评分自动汇总（表达式 + 特殊值映射 + 分段评级）。
 * 表单：既往史与过敏史评估 / 家族史登记 / 生活质量评分。
 */
import type { ControlDef } from '@/types/control';
import type { MenuRuleConfig } from '@/types/form';
import { ctrl, pa } from './shared';

/* ---------- F-B01 既往史与过敏史评估 ---------- */

const fb01: ControlDef[] = [
  ctrl({
    identifier: 'link_switch',
    nameZh: '是否伴随症状',
    selectedControlType: 'radio',
    required: true,
    desc: '选择“有伴随症状”时，下方“伴随症状描述”出现（DISPLAY 规则）',
    privateAttr: pa({
      options: [
        { value: 'show', label: '有伴随症状' },
        { value: 'hide', label: '无伴随症状' },
      ],
      numberOfOptionsPerLine: 2,
    }),
  }),
  ctrl({
    identifier: 'extra_note',
    nameZh: '伴随症状描述',
    selectedControlType: 'input-text',
    ruleType: 'DISPLAY',
    logicalConjunction: 'AND',
    ruleList: [
      {
        type: 0,
        ruleValue: 'show',
        dependControlIdentifier: 'link_switch',
        dependFormId: 'F-B01',
        belongFormId: 'F-B01',
      },
    ],
  }),
  ctrl({
    identifier: 'hidden_note',
    nameZh: '康复指导',
    selectedControlType: 'input-textarea',
    colNumber: 12,
    desc: '选择“有伴随症状”时本控件被隐藏（SKIP 规则）',
    ruleType: 'SKIP',
    ruleList: [
      {
        type: 0,
        ruleValue: 'show',
        dependControlIdentifier: 'link_switch',
        dependFormId: 'F-B01',
        belongFormId: 'F-B01',
      },
    ],
  }),
  ctrl({
    identifier: 'spec_level',
    nameZh: '过敏状态',
    selectedControlType: 'radio',
    required: true,
    desc: '选择“已知过敏”时，“可疑过敏原”仅显示 花粉 / 尘螨（type=2 选项过滤规则）',
    privateAttr: pa({
      options: [
        { value: 'std', label: '已知过敏' },
        { value: 'pro', label: '未发现过敏' },
      ],
      numberOfOptionsPerLine: 2,
    }),
  }),
  ctrl({
    identifier: 'part_select',
    nameZh: '可疑过敏原',
    selectedControlType: 'select',
    privateAttr: pa({
      options: [
        { value: 'P1', label: '花粉' },
        { value: 'P2', label: '尘螨' },
        { value: 'P3', label: '海鲜' },
      ],
    }),
    ruleList: [
      {
        type: 2,
        ruleValue: 'std',
        dependControlIdentifier: 'spec_level',
        dependFormId: 'F-B01',
        belongFormId: 'F-B01',
        otherInfo: JSON.stringify(['P1', 'P2']),
      },
    ],
  }),
  ctrl({
    identifier: 'unit_value',
    nameZh: '体重（kg）',
    selectedControlType: 'input-number-unit',
    privateAttr: pa({ units: [{ unit: 'kg' }] }),
  }),
  ctrl({
    identifier: 'magnitude_note',
    nameZh: '体重预警提示',
    selectedControlType: 'input-text',
    desc: '数值联动：体重 = 100 时显示（依赖 magnitude）',
    ruleType: 'DISPLAY',
    logicalConjunction: 'AND',
    ruleList: [
      {
        type: 0,
        ruleValue: '100',
        dependControlIdentifier: 'unit_value',
        dependControlType: 'input-number-unit',
        dependFormId: 'F-B01',
        belongFormId: 'F-B01',
      },
    ],
  }),
  ctrl({
    identifier: 'default_no',
    nameZh: '评估档案编号',
    selectedControlType: 'input-text',
    disabled: true,
    desc: '禁用控件 + 默认值：隐藏再显示后默认值自动恢复',
    privateAttr: pa({ defaultValue: 'MED-0001' }),
  }),
];

/* ---------- F-B02 家族史登记（动态复制组） ---------- */

const fb02: ControlDef[] = [
  ctrl({
    identifier: 'grp_member',
    nameZh: '家族史记录',
    selectedControlType: 'group-box',
    colNumber: 12,
    maxCount: 5,
    privateAttr: pa({ allowDynamicAdd: true }),
    children: [
      ctrl({
        identifier: 'member_name',
        nameZh: '家属姓名',
        selectedControlType: 'input-text',
        required: true,
      }),
      ctrl({
        identifier: 'member_role',
        nameZh: '亲属关系',
        selectedControlType: 'radio',
        required: true,
        privateAttr: pa({
          options: [
            { value: 'leader', label: '直系亲属' },
            { value: 'member', label: '旁系亲属' },
          ],
          numberOfOptionsPerLine: 2,
        }),
      }),
      ctrl({
        identifier: 'member_note',
        nameZh: '家族病史描述',
        selectedControlType: 'input-text',
        colNumber: 12,
        desc: '仅“直系亲属”记录显示（记录内 DISPLAY 规则）',
        ruleType: 'DISPLAY',
        logicalConjunction: 'AND',
        ruleList: [
          {
            type: 0,
            ruleValue: 'leader',
            dependControlIdentifier: 'member_role',
            dependFormId: 'F-B02',
            belongFormId: 'F-B02',
          },
        ],
      }),
    ],
  }),
  ctrl({
    identifier: 'grp_audit',
    nameZh: '登记信息',
    selectedControlType: 'group-box',
    colNumber: 12,
    children: [
      ctrl({
        identifier: 'auditor',
        nameZh: '登记人',
        selectedControlType: 'input-text',
        customGroup: 'audit',
        required: true,
      }),
    ],
  }),
];

/* ---------- F-B03 生活质量评分 ---------- */

const scoreOptions = () => [
  { value: '0', label: '0 无' },
  { value: '1', label: '1 轻度' },
  { value: '2', label: '2 中度' },
  { value: '3', label: '3 重度' },
];

const fb03: ControlDef[] = [
  ctrl({
    identifier: 'note_score',
    nameZh: '评分说明',
    selectedControlType: 'label',
    colNumber: 12,
    privateAttr: pa({
      explanation:
        '六个评分项各 0~3 分；“不详”按 3 分计入总分（特殊值映射）；总分与等级自动计算，无需手填。',
      bodyFontSize: 14,
      bodyFontColor: '#8c8c8c',
    }),
  }),
  ...(['疼痛', '睡眠', '情绪', '食欲', '体力', '社交'] as const).map((name, i) =>
    ctrl({
      identifier: `item_q${i + 1}`,
      nameZh: `${name}评分`,
      selectedControlType: 'radio',
      required: true,
      privateAttr: pa({ options: scoreOptions(), numberOfOptionsPerLine: 4 }),
    }),
  ),
  ctrl({
    identifier: 'item_unknown',
    nameZh: '是否不详',
    selectedControlType: 'checkbox',
    desc: '勾选“不详”后按 3 分计入总分',
    privateAttr: pa({ options: [{ value: '998', label: '不详' }] }),
  }),
  ctrl({
    identifier: 'total_score',
    nameZh: '总分',
    selectedControlType: 'countable',
    desc: '自动汇总：六项之和（不详按 3 分）',
    privateAttr: pa({
      countableExpression:
        '[item_q1]+[item_q2]+[item_q3]+[item_q4]+[item_q5]+[item_q6]+[item_unknown]',
      specialMap: { 998: 3 },
      suffix: '分',
    }),
  }),
  ctrl({
    identifier: 'grade_level',
    nameZh: '综合等级',
    selectedControlType: 'countable',
    desc: '0~8 Ⅰ级 / 9~14 Ⅱ级 / 15~18 Ⅲ级',
    privateAttr: pa({
      countableExpression: '[total_score]',
      gradeMapping: [
        { min: 0, max: 8, value: 'Ⅰ级', label: '状态良好' },
        { min: 9, max: 14, value: 'Ⅱ级', label: '中度影响' },
        { min: 15, max: 18, value: 'Ⅲ级', label: '严重影响' },
      ],
    }),
  }),
];

export const systemBForms = [
  {
    formId: 'F-B01',
    formName: '既往史与过敏史评估',
    formOrder: 1,
    enabled: true,
    formLayout: 'horizontal' as const,
    formDesc: 'DISPLAY / SKIP / 选项过滤 / 单位值规则 / 禁用默认值',
    tree: fb01,
  },
  {
    formId: 'F-B02',
    formName: '家族史登记',
    formOrder: 2,
    enabled: true,
    formLayout: 'horizontal' as const,
    formDesc: '可增删记录的分组（上限 5 条，记录内联动）',
    tree: fb02,
  },
  {
    formId: 'F-B03',
    formName: '生活质量评分',
    formOrder: 3,
    enabled: true,
    formLayout: 'horizontal' as const,
    formDesc: 'countable 表达式 + 特殊值映射 + 分段评级',
    tree: fb03,
  },
];

export const systemBMenuRules: MenuRuleConfig[] = [];

export const systemBSavedData: Record<string, Record<string, { status: number; data: Record<string, unknown> }>> = {
  'ENT-B-1': {
    'F-B01': {
      status: 3,
      data: {
        link_switch: 'show',
        extra_note: '活动后气促，休息后缓解（回填）',
        spec_level: 'pro',
        part_select: 'P3',
        unit_value: { magnitude: 100, units: 'kg' },
        magnitude_note: '已达到预警体重',
        default_no: 'MED-0001',
      },
    },
    'F-B02': {
      status: 3,
      data: {
        grp_member: [
          { member_name: '张明远', member_role: 'leader', member_note: '父亲，原发性高血压' },
          { member_name: '李文博', member_role: 'member' },
        ],
        _custom_group_audit: { auditor: '王记录' },
      },
    },
    'F-B03': {
      status: 3,
      data: {
        item_q1: '3',
        item_q2: '2',
        item_q3: '3',
        item_q4: '1',
        item_q5: '2',
        item_q6: '3',
        item_unknown: '["998"]',
        total_score: 17,
        grade_level: 'Ⅲ级',
      },
    },
  },
};
