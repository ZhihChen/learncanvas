'use client';

/**
 * 文件上传组件
 * 支持拖拽上传和点击上传
 */

import { memo, useState, useCallback, useRef } from 'react';
import { Upload, X, Loader2, Check, AlertCircle } from 'lucide-react';
import { FileIcon } from './FileIcon';
import type { Attachment } from '@/types';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  onFileUploaded: (file: Attachment) => void;
  onFileRemoved?: (fileId: string) => void;
  files?: Attachment[];
  maxFiles?: number;
  accept?: string;
  className?: string;
}

/**
 * 文件上传组件
 */
function FileUploaderComponent({
  onFileUploaded,
  onFileRemoved,
  files = [],
  maxFiles = 5,
  accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.png,.jpg,.jpeg,.gif,.webp',
  className,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, number>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 上传文件
  const uploadFile = async (file: File): Promise<Attachment> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/file/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '上传失败');
    }
    
    return response.json();
  };
  
  // 处理文件选择
  const handleFiles = useCallback(async (fileList: FileList) => {
    const files = Array.from(fileList);
    
    if (files.length === 0) return;
    
    // 检查文件数量限制
    if (maxFiles && files.length > maxFiles) {
      alert(`最多上传 ${maxFiles} 个文件`);
      return;
    }
    
    // 上传文件
    for (const file of files) {
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 添加到上传中列表
      setUploadingFiles(prev => new Map(prev).set(tempId, 0));
      
      try {
        const attachment = await uploadFile(file);
        
        // 移除上传中状态
        setUploadingFiles(prev => {
          const newMap = new Map(prev);
          newMap.delete(tempId);
          return newMap;
        });
        
        // 通知父组件
        onFileUploaded(attachment);
        
      } catch (error) {
        console.error('Upload error:', error);
        
        // 移除上传中状态
        setUploadingFiles(prev => {
          const newMap = new Map(prev);
          newMap.delete(tempId);
          return newMap;
        });
        
        alert(error instanceof Error ? error.message : '上传失败');
      }
    }
  }, [maxFiles, onFileUploaded]);
  
  // 拖拽事件处理
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const droppedFiles = e.dataTransfer.files;
    handleFiles(droppedFiles);
  }, [handleFiles]);
  
  // 点击上传
  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);
  
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
      // 重置 input，允许重复选择同一文件
      e.target.value = '';
    }
  }, [handleFiles]);
  
  return (
    <div className={cn('relative', className)}>
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={maxFiles > 1}
        onChange={handleInputChange}
        className="hidden"
      />
      
      {/* 上传区域 */}
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          'relative flex flex-col items-center justify-center',
          'p-6 rounded-xl cursor-pointer',
          'transition-all duration-200',
          isDragging && 'scale-[1.02]'
        )}
        style={{
          border: `2px dashed ${isDragging ? 'var(--accent-primary)' : 'var(--border-primary)'}`,
          background: isDragging ? 'var(--accent-light)' : 'var(--bg-secondary)',
        }}
      >
        <Upload 
          className={cn(
            'w-8 h-8 mb-3 transition-colors',
            isDragging ? 'text-[var(--accent-primary)]' : 'text-[var(--text-tertiary)]'
          )} 
        />
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {isDragging ? '松开以上传文件' : '点击或拖拽文件到此处'}
        </p>
        <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          支持 PDF、Word、Excel、PPT、图片等格式
        </p>
      </div>
      
      {/* 上传中的文件 */}
      {uploadingFiles.size > 0 && (
        <div className="mt-3 space-y-2">
          {Array.from(uploadingFiles.entries()).map(([id]) => (
            <div
              key={id}
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-light)',
              }}
            >
              <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-primary)]" />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                上传中...
              </span>
            </div>
          ))}
        </div>
      )}
      
      {/* 已上传的文件列表 */}
      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 rounded-lg group"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-light)',
              }}
            >
              <div className="flex items-center gap-3">
                <FileIcon type={file.type} size={20} className="text-[var(--accent-primary)]" />
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {file.name}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {file.status === 'ready' && (
                  <Check className="w-4 h-4 text-[var(--color-success)]" />
                )}
                {file.status === 'error' && (
                  <AlertCircle className="w-4 h-4 text-[var(--color-danger)]" />
                )}
                {onFileRemoved && (
                  <button
                    onClick={() => onFileRemoved(file.id)}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: 'var(--text-tertiary)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-hover)';
                      e.currentTarget.style.color = 'var(--color-danger)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-tertiary)';
                    }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const FileUploader = memo(FileUploaderComponent);
