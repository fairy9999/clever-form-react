import { useEffect, useState } from 'react';
import { Cascader } from 'antd';
import type { BaseControlProps } from './types';
import { getCascadeData } from '@/api';
import type { CascadeNode } from '@/types/form';

interface OptionNode {
  value: string;
  label: string;
  isLeaf: boolean;
  children?: OptionNode[];
}

/** 在 options 树中定位 path 对应节点并挂载子级 */
function attachChildren(list: OptionNode[], path: string[], children: OptionNode[]): OptionNode[] {
  const [head, ...rest] = path;
  return list.map((o) => {
    if (o.value !== head) return o;
    if (rest.length === 0) return { ...o, children: o.children?.length ? o.children : children };
    return { ...o, children: attachChildren(o.children ?? [], rest, children) };
  });
}

/** 级联选择（懒加载子级；值以 'a/b/c' 路径字符串存储） */
export function CascaderControl({ control, value, onChange, viewOnly }: BaseControlProps) {
  const [options, setOptions] = useState<OptionNode[]>([]);
  const valueStr = typeof value === 'string' ? value : '';

  /* 加载根级选项（仅当为空时，避免覆盖已回显的子级） */
  useEffect(() => {
    let alive = true;
    getCascadeData().then((nodes: CascadeNode[]) => {
      if (!alive) return;
      setOptions((prev) => (prev.length > 0 ? prev : nodes.map((n) => ({ ...n }))));
    });
    return () => {
      alive = false;
    };
  }, []);

  /* 已保存值的路径回显：逐级预加载子级，保证各级 label 正常显示 */
  useEffect(() => {
    if (!valueStr) return;
    const segs = valueStr.split('/');
    let alive = true;
    (async () => {
      const roots: CascadeNode[] = await getCascadeData('');
      if (!alive) return;
      setOptions((prev) => (prev.length > 0 ? prev : roots.map((n) => ({ ...n }))));
      let path = '';
      for (const seg of segs.slice(0, -1)) {
        path = path ? `${path}/${seg}` : seg;
        const nodes: CascadeNode[] = await getCascadeData(path);
        if (!alive) return;
        const children = nodes.map((n) => ({ ...n }));
        const levelPath = path; // 捕获当前层级，避免闭包共享循环变量
        setOptions((prev) => attachChildren(prev, levelPath.split('/'), children));
      }
    })();
    return () => {
      alive = false;
    };
  }, [valueStr]);

  const valuePath = valueStr !== '' ? valueStr.split('/') : [];

  return (
    <Cascader
      style={{ width: '100%' }}
      value={valuePath}
      options={options}
      disabled={viewOnly || control.disabled}
      placeholder={control.placeholder ?? `请选择${control.nameZh}`}
      changeOnSelect={false}
      loadData={(selectedOptions) => {
        const last = selectedOptions[selectedOptions.length - 1] as OptionNode;
        if (last.children) return Promise.resolve();
        return getCascadeData(selectedOptions.map((o) => o.value).join('/')).then((nodes: CascadeNode[]) => {
          setOptions((prev) => {
            const update = (list: OptionNode[]): OptionNode[] =>
              list.map((o) =>
                o.value === last.value
                  ? { ...o, children: nodes.map((n) => ({ ...n })) }
                  : o.children
                    ? { ...o, children: update(o.children) }
                    : o,
              );
            return update(prev);
          });
        });
      }}
      onChange={(paths) => onChange(paths && paths.length > 0 ? paths.join('/') : null)}
    />
  );
}
