/**
 * 演示系统 B：示例·动态表单能力演示（完全虚构）
 * 覆盖动态能力：控件联动显隐（DISPLAY/SKIP/type-2 选项过滤/单位值规则/禁用默认值）、
 * 动态复制组（增删记录、记录内联动、上限）、评分自动汇总（表达式 + 特殊值映射 + 分段评级）。
 */
import type { ControlDef } from '@/types/control';
import type { MenuRuleConfig } from '@/types/form';
import { ctrl, pa } from './shared';

/* ---------- F-B01 联动显隐演示 ---------- */

const fb01: ControlDef[] = [
  ctrl({
    identifier: 'link_switch',
    nameZh: '联动开关',
    selectedControlType: 'radio',
    required: true,
    desc: '选择“显示附加项”时，下方“附加说明”出现（DISPLAY 规则）',
    privateAttr: pa({
      options: [
        { value: 'show', label: '显示附加项' },
        { value: 'hide', label: '隐藏附加项' },
      ],
    }),
  }),
  ctrl({
    identifier: 'extra_note',
    nameZh: '附加说明',
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
    nameZh: '隐藏备注',
    selectedControlType: 'input-textarea',
    colNumber: 12,
    desc: '选择“隐藏附加项”时本控件被隐藏（SKIP 规则）',
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
    nameZh: '规格等级',
    selectedControlType: 'radio',
    required: true,
    desc: '选择“标准型”时，“适用配件”仅显示 P1 / P2（type=2 选项过滤规则）',
    privateAttr: pa({
      options: [
        { value: 'std', label: '标准型' },
        { value: 'pro', label: '增强型' },
      ],
    }),
  }),
  ctrl({
    identifier: 'part_select',
    nameZh: '适用配件',
    selectedControlType: 'select',
    privateAttr: pa({
      options: [
        { value: 'P1', label: '配件 P1' },
        { value: 'P2', label: '配件 P2' },
        { value: 'P3', label: '配件 P3' },
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
    nameZh: '数值联动（kg）',
    selectedControlType: 'input-number-unit',
    privateAttr: pa({ units: [{ unit: 'kg' }] }),
  }),
  ctrl({
    identifier: 'magnitude_note',
    nameZh: '满量提示',
    selectedControlType: 'input-text',
    desc: '数值联动：带单位数值 = 100 时显示（依赖 magnitude）',
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
    nameZh: '默认单号',
    selectedControlType: 'input-text',
    disabled: true,
    desc: '禁用控件 + 默认值：隐藏再显示后默认值自动恢复',
    privateAttr: pa({ defaultValue: 'AUTO-0001' }),
  }),
];

/* ---------- F-B02 动态复制组演示 ---------- */

const fb02: ControlDef[] = [
  ctrl({
    identifier: 'grp_member',
    nameZh: '成员登记',
    selectedControlType: 'group-box',
    colNumber: 12,
    maxCount: 5,
    privateAttr: pa({ allowDynamicAdd: true }),
    children: [
      ctrl({
        identifier: 'member_name',
        nameZh: '成员姓名',
        selectedControlType: 'input-text',
        required: true,
      }),
      ctrl({
        identifier: 'member_role',
        nameZh: '成员角色',
        selectedControlType: 'radio',
        required: true,
        privateAttr: pa({
          options: [
            { value: 'leader', label: '负责人' },
            { value: 'member', label: '成员' },
          ],
          numberOfOptionsPerLine: 2,
        }),
      }),
      ctrl({
        identifier: 'member_note',
        nameZh: '职责备注',
        selectedControlType: 'input-text',
        colNumber: 12,
        desc: '仅“负责人”记录显示（记录内 DISPLAY 规则）',
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

/* ---------- F-B03 评分自动汇总演示 ---------- */

const scoreOptions = (namePrefix: string) => [
  { value: '0', label: '0', desc: `${namePrefix}：无` },
  { value: '1', label: '1', desc: `${namePrefix}：轻微` },
  { value: '2', label: '2', desc: `${namePrefix}：中等` },
  { value: '3', label: '3', desc: `${namePrefix}：严重` },
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
      bodyFontSize: 12,
      bodyFontColor: '#8c8c8c',
    }),
  }),
  ...(['外观', '密封', '噪声', '振动', '温升', '绝缘'] as const).map((name, i) =>
    ctrl({
      identifier: `item_q${i + 1}`,
      nameZh: `${name}评分`,
      selectedControlType: 'radio',
      required: true,
      privateAttr: pa({ options: scoreOptions(name), numberOfOptionsPerLine: 4 }),
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
        { min: 9, max: 14, value: 'Ⅱ级', label: '需关注' },
        { min: 15, max: 18, value: 'Ⅲ级', label: '需处理' },
      ],
    }),
  }),
];

export const systemBForms = [
  {
    formId: 'F-B01',
    formName: '联动显隐演示',
    formOrder: 1,
    enabled: true,
    formLayout: 'horizontal' as const,
    formDesc: 'DISPLAY / SKIP / 选项过滤 / 单位值规则 / 禁用默认值',
    tree: fb01,
  },
  {
    formId: 'F-B02',
    formName: '动态复制组演示',
    formOrder: 2,
    enabled: true,
    formLayout: 'horizontal' as const,
    formDesc: '可增删记录的分组（上限 5 条，记录内联动）',
    tree: fb02,
  },
  {
    formId: 'F-B03',
    formName: '评分自动汇总演示',
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
        extra_note: '附加说明内容（回填）',
        spec_level: 'pro',
        part_select: 'P3',
        unit_value: { magnitude: 100, units: 'kg' },
        magnitude_note: '已满量',
        default_no: 'AUTO-0001',
      },
    },
    'F-B02': {
      status: 3,
      data: {
        grp_member: [
          { member_name: '张演示', member_role: 'leader', member_note: '负责主控调试' },
          { member_name: '李示例', member_role: 'member' },
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
