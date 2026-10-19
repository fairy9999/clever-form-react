/**
 * safeJsExecutor —— 后端动态脚本执行桩（本期默认关闭）。
 *
 * 背景：原系统通过 new Function / eval 执行后端下发的 jsCode（控件加载脚本、
 * 值变化脚本、跨控件显隐控制等）。该机制存在脚本注入风险且无法静态分析，
 * 本期不迁移。相关脚本内容仍随控件元数据保存（privateAttr.loadControlJsCode /
 * valueChangeJsCode），但不会被执行。
 *
 * TODO(后续迭代)：以声明式 DSL 或受限表达式引擎重新实现以下能力：
 *  - loadControl：控件加载时的默认值计算
 *  - showControl / setControlUnShow：跨控件强制显隐
 *  - setControlValue / getControlValue：跨控件取值赋值
 *  - jsConfirmModel / jsAlertModel：脚本触发的对话框
 * 启用前提：env.enableSafeJs === true（VITE_ENABLE_SAFE_JS=true），
 * 且需补充沙箱（如 Web Worker + 能力白名单），禁止直接 eval。
 */
import type { ControlDef, FormDataValue } from '@/types/control';
import { env } from '@/config/env';

export interface JsExecutorContext {
  getControlValue: (identifier: string) => unknown;
  setControlValue: (identifier: string, value: unknown) => void;
  setControlShow: (identifier: string) => void;
  setControlUnShow: (identifier: string) => void;
  jsAlertModel: (message: string) => void;
  jsConfirmModel: (message: string) => Promise<boolean>;
}

class SafeJsExecutorStub {
  /** 标记当前脚本上下文（仅供调试日志） */
  private currentControl: ControlDef | null = null;

  private assertEnabled(code: string): boolean {
    if (!env.enableSafeJs) {
      // 默认关闭：仅记录，不执行
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.info(
          '[safeJsExecutor] 动态脚本未启用（VITE_ENABLE_SAFE_JS=false），已忽略：',
          this.currentControl?.identifier ?? '(unknown)',
        );
      }
      return false;
    }
    // TODO: 即使启用，也不允许直接 eval —— 需接入沙箱化执行器后再实现
    void code;
    return false;
  }

  /** 控件加载脚本入口（未实现） */
  runLoadScript(control: ControlDef, _formData: FormDataValue, _buildContext: () => JsExecutorContext): void {
    this.currentControl = control;
    const code = control.privateAttr ? '' : '';
    void code;
    this.assertEnabled('(loadControl)');
  }

  /** 值变化脚本入口（未实现） */
  runValueChangeScript(
    control: ControlDef,
    _formData: FormDataValue,
    _buildContext: () => JsExecutorContext,
  ): void {
    this.currentControl = control;
    this.assertEnabled('(valueChange)');
  }
}

export const safeJsExecutor = new SafeJsExecutorStub();
