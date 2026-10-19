import { useEffect, useRef, useState } from 'react';
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

/** 级联选择（懒加载子级；值以 'a/b/c' 路径字符串存储） */
export function CascaderControl({ control, value, onChange, viewOnly }: BaseControlProps) {
  const [options, setOptions] = useState<OptionNode[]>([]);
  const loadedRef = useRef(false);

  useEffect(() => {
    let alive = true;
    getCascadeData().then((nodes: CascadeNode[]) => {
      if (!alive) return;
      loadedRef.current = true;
      setOptions(nodes.map((n) => ({ ...n })));
    });
    return () => {
      alive = false;
    };
  }, []);

  const valuePath = typeof value === 'string' && value !== '' ? value.split('/') : [];

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
