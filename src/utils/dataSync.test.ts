import { describe, expect, it } from 'vitest';
import { applySyncFromEntity } from './dataSync';

describe('applySyncFromEntity', () => {
  const mappings = [
    { formKey: 'site_name', jsonKey: 'siteName' },
    { formKey: '_custom_group_g1.device_no', jsonKey: 'deviceNo' },
  ];

  it('空字段从实体 JSON 回填', () => {
    const fd = applySyncFromEntity({ site_name: null }, JSON.stringify({ siteName: '站点A' }), mappings);
    expect(fd.site_name).toBe('站点A');
  });

  it('已有值不覆盖', () => {
    const fd = applySyncFromEntity({ site_name: '已填' }, JSON.stringify({ siteName: '站点A' }), mappings);
    expect(fd.site_name).toBe('已填');
  });

  it('分组路径回填', () => {
    const fd = applySyncFromEntity({}, { deviceNo: 'D-001' }, mappings);
    expect(fd._custom_group_g1).toEqual({ device_no: 'D-001' });
  });

  it('非法 JSON 字符串安全返回原数据', () => {
    const fd = { site_name: 'x' };
    expect(applySyncFromEntity(fd, '{oops', mappings)).toBe(fd);
  });

  it('无映射配置时原样返回', () => {
    const fd = { a: 1 };
    expect(applySyncFromEntity(fd, { a: 2 }, undefined)).toBe(fd);
  });
});
