import { useRef, useState } from 'react';
import { App, Button, List } from 'antd';
import { DeleteOutlined, EyeOutlined, PaperClipOutlined, UploadOutlined } from '@ant-design/icons';
import type { BaseControlProps } from './types';
import { parsePrivateAttr } from '@/utils/privateAttr';
import { deleteFile, filePreviewUrl, parseFileEntries, uploadFiles } from '@/api';
import type { FileEntry } from '@/types/control';

/** 展示名：去掉服务端存储名的 32 位十六进制前缀 */
function displayName(storedName: string): string {
  return storedName.length > 33 ? storedName.slice(33) : storedName;
}

/** 附件上传（值以 FileEntry[] 的 JSON 字符串存储） */
export function UploadControl({ control, value, onChange, viewOnly }: BaseControlProps) {
  const { message } = App.useApp();
  const attrs = parsePrivateAttr(control);
  const entries: FileEntry[] = parseFileEntries(value);
  const maxCount = Number(attrs.number ?? 0) || Infinity;
  const maxSizeMB = Number(attrs.size ?? 0) || Infinity;
  const allowTypes = (attrs.type ?? '')
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const emit = (next: FileEntry[]) => onChange(JSON.stringify(next));

  const handlePick = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const picked = Array.from(files);
    if (entries.length + picked.length > maxCount) {
      message.warning(`最多上传 ${maxCount} 个文件`);
      return;
    }
    for (const f of picked) {
      if (f.size > maxSizeMB * 1024 * 1024) {
        message.warning(`「${f.name}」超过 ${maxSizeMB}MB 限制`);
        return;
      }
      if (
        allowTypes.length > 0 &&
        !allowTypes.some((t) => t === '*' || f.name.toLowerCase().endsWith(`.${t}`))
      ) {
        message.warning(`仅支持 ${allowTypes.join('/')} 格式`);
        return;
      }
    }
    setUploading(true);
    try {
      const results = await uploadFiles(picked);
      const okEntries: FileEntry[] = results
        .filter((r) => r.success)
        .map((r) => {
          const origin = picked.find((f) => displayName(r.name) === f.name);
          return {
            fileName: r.name,
            fileSize: origin?.size ?? 0,
            fileType: origin?.type ?? '',
          };
        });
      emit([...entries, ...okEntries]);
      const failed = results.filter((r) => !r.success);
      if (failed.length > 0) message.warning(failed.map((f) => f.message).join('；'));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="cf-upload">
      <List
        size="small"
        dataSource={entries}
        locale={{ emptyText: '暂无附件' }}
        renderItem={(item) => (
          <List.Item
            actions={[
              <Button
                key="view"
                type="link"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => window.open(filePreviewUrl(item.fileName), '_blank')}
              >
                预览
              </Button>,
              ...(viewOnly
                ? []
                : [
                    <Button
                      key="del"
                      type="link"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => {
                        void deleteFile(item.fileName);
                        emit(entries.filter((e) => e.fileName !== item.fileName));
                      }}
                    >
                      删除
                    </Button>,
                  ]),
            ]}
          >
            <span className="cf-upload-name">
              <PaperClipOutlined /> {displayName(item.fileName)}（
              {Math.max(1, Math.round(item.fileSize / 1024))} KB）
            </span>
          </List.Item>
        )}
      />
      {!viewOnly && (
        <Button
          icon={<UploadOutlined />}
          loading={uploading}
          onClick={() => inputRef.current?.click()}
        >
          上传附件{maxCount === Infinity ? '' : `（最多 ${maxCount} 个）`}
        </Button>
      )}
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        accept={allowTypes.length > 0 ? allowTypes.map((t) => `.${t}`).join(',') : undefined}
        onChange={(e) => void handlePick(e.target.files)}
      />
    </div>
  );
}
