/**
 * countable 计算表达式安全求值器。
 * 原版用 new Function/eval 执行 "[a]+[b]*2" 形态的表达式；此处改为
 * 词法分析 + 调度场算法（shunting-yard）的纯算术实现，不支持任何函数调用
 * 与属性访问，从根本上杜绝脚本注入。
 */
import type { GradeRule, UnitValue } from '@/types/control';

type Token =
  | { kind: 'num'; value: number }
  | { kind: 'var'; name: string }
  | { kind: 'op'; value: '+' | '-' | '*' | '/' }
  | { kind: 'paren'; value: '(' | ')' };

const PRECEDENCE: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2 };

/** 词法分析：支持 [变量名]、数字、+ - * / ( )；非法字符返回 null */
export function tokenizeExpression(expr: string): Token[] | null {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }
    if (ch === '[') {
      const end = expr.indexOf(']', i);
      if (end === -1) return null;
      const name = expr.slice(i + 1, end).trim();
      if (!name) return null;
      tokens.push({ kind: 'var', name });
      i = end + 1;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      let j = i;
      while (j < expr.length && /[0-9.]/.test(expr[j])) j += 1;
      const numStr = expr.slice(i, j);
      if ((numStr.match(/\./g) ?? []).length > 1) return null;
      const n = Number(numStr);
      if (!Number.isFinite(n)) return null;
      tokens.push({ kind: 'num', value: n });
      i = j;
      continue;
    }
    if (ch === '+' || ch === '-' || ch === '*' || ch === '/') {
      tokens.push({ kind: 'op', value: ch });
      i += 1;
      continue;
    }
    if (ch === '(' || ch === ')') {
      tokens.push({ kind: 'paren', value: ch });
      i += 1;
      continue;
    }
    return null;
  }
  return tokens;
}

function toNumber(v: unknown): number {
  if (v === null || v === undefined || v === '') return 0;
  if (typeof v === 'object') {
    const mag = (v as UnitValue).magnitude;
    const n = Number(mag);
    return Number.isFinite(n) ? n : 0;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * 求值 countable 表达式。
 * - 变量取值经 specialMap 映射（原始值命中键时按映射值参与计算）
 * - 空值 / 非数值变量按 0 处理
 * - 非法表达式或除零返回 null
 */
export function evaluateExpression(
  expr: string,
  variables: Record<string, unknown>,
  specialMap?: Record<string, string | number>,
): number | null {
  const tokens = tokenizeExpression(expr ?? '');
  if (!tokens || tokens.length === 0) return null;

  // 补全一元负号：位于开头或 ( / 运算符之后的 - 视为 0 - x
  const normalized: Token[] = [];
  for (let i = 0; i < tokens.length; i += 1) {
    const t = tokens[i];
    const prev = normalized[normalized.length - 1];
    const unaryContext =
      t.kind === 'op' && t.value === '-' && (prev === undefined || (prev.kind === 'op') || (prev.kind === 'paren' && prev.value === '('));
    if (unaryContext) normalized.push({ kind: 'num', value: 0 });
    normalized.push(t);
  }

  // 调度场算法 → 逆波兰
  const output: Token[] = [];
  const opStack: Token[] = [];
  for (const t of normalized) {
    if (t.kind === 'num' || t.kind === 'var') {
      output.push(t);
    } else if (t.kind === 'op') {
      while (
        opStack.length > 0 &&
        opStack[opStack.length - 1].kind === 'op' &&
        PRECEDENCE[(opStack[opStack.length - 1] as { value: string }).value] >= PRECEDENCE[t.value]
      ) {
        output.push(opStack.pop()!);
      }
      opStack.push(t);
    } else if (t.value === '(') {
      opStack.push(t);
    } else {
      let matched = false;
      while (opStack.length > 0) {
        const top = opStack.pop()!;
        if (top.kind === 'paren' && top.value === '(') {
          matched = true;
          break;
        }
        output.push(top);
      }
      if (!matched) return null; // 括号不匹配
    }
  }
  while (opStack.length > 0) {
    const top = opStack.pop()!;
    if (top.kind === 'paren') return null;
    output.push(top);
  }

  // 求值
  const stack: number[] = [];
  for (const t of output) {
    if (t.kind === 'num') {
      stack.push(t.value);
    } else if (t.kind === 'var') {
      const raw = variables[t.name];
      const mapped = specialMap && raw !== null && raw !== undefined && String(raw) in specialMap
        ? specialMap[String(raw)]
        : undefined;
      stack.push(mapped !== undefined ? toNumber(mapped) : toNumber(raw));
    } else if (t.kind === 'op') {
      const b = stack.pop();
      const a = stack.pop();
      if (a === undefined || b === undefined) return null;
      switch (t.value) {
        case '+': stack.push(a + b); break;
        case '-': stack.push(a - b); break;
        case '*': stack.push(a * b); break;
        case '/':
          if (b === 0) return null;
          stack.push(a / b);
          break;
      }
    }
  }
  if (stack.length !== 1 || !Number.isFinite(stack[0])) return null;
  return stack[0];
}

/** 总分 → 等级匹配（gradeMapping，顺序匹配首个命中区间） */
export function matchGrade(total: number, rules?: GradeRule[]): GradeRule | null {
  if (!rules || rules.length === 0) return null;
  return (
    rules.find(
      (r) => (r.min === undefined || total >= r.min) && (r.max === undefined || total <= r.max),
    ) ?? null
  );
}
