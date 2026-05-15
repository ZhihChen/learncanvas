'use client';

/**
 * 文件预览弹出面板组件
 * 支持PDF、图片、Office文档预览
 * 
 * 设计理念：借鉴豆包APP的文件预览体验
 * - 点击附件时弹出全屏预览面板
 * - 使用遮罩层隔离背景
 * - 流畅的进入/退出动画
 */

import { memo, useState, useEffect, useCallback } from 'react';
import { 
  X, 
  Download, 
  ExternalLink, 
  ZoomIn,
  ZoomOut,
  RotateCw,
  Loader2,
  FileText,
} from 'lucide-react';
import { FileIcon } from './FileIcon';
import type { Attachment } from '@/types';
import { cn } from '@/lib/utils';
import { useCanvasStore } from '@/store/canvasStore';

interface FilePreviewProps {
  file?: Attachment;
  onClose?: () => void;
  className?: string;
}

/**
 * 获取Office文档预览URL
 */
function getOfficePreviewUrl(url: string): string {
  // 使用微软Office Online预览服务
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
}

/**
 * 文件预览弹出面板组件
 */
function FilePreviewComponent({ file: fileProp, onClose: onCloseProp, className }: FilePreviewProps) {
  // 状态
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  
  // 从 store 获取文件预览状态
  const storeFile = useCanvasStore((state) => state.previewingFile);
  const showPreview = useCanvasStore((state) => state.showFilePreview);
  const setShowFilePreview = useCanvasStore((state) => state.setShowFilePreview);
  
  // 使用传入的 file 或从 store 获取
  const file = fileProp || storeFile;
  
  // 关闭处理（带动画）
  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      if (onCloseProp) {
        onCloseProp();
      } else {
        setShowFilePreview(false);
      }
      setIsClosing(false);
    }, 200);
  }, [onCloseProp, setShowFilePreview]);
  
  // ESC 键关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    
    if (showPreview) {
      document.addEventListener('keydown', handleKeyDown);
      // 阻止背景滚动
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [showPreview, handleClose]);
  
  // 当文件变化时重置状态
  useEffect(() => {
    if (file) {
      // 延迟设置状态以避免同步渲染问题
      setTimeout(() => {
        setIsLoading(true);
        setError(null);
        setScale(100);
        setRotation(0);
      }, 0);
    }
  }, [file?.id]);
  
  // 如果没有文件或未显示，返回 null
  if (!file || !showPreview) {
    return null;
  }
  
  // 渲染预览内容
  const renderPreview = () => {
    const previewStyle = {
      transform: `scale(${scale / 100}) rotate(${rotation}deg)`,
      transformOrigin: 'center center',
    };
    
    switch (file.type) {
      case 'pdf':
        return (
          <div className="w-full h-full relative bg-white rounded-lg overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 gap-3">
                <Loader2 className="w-10 h-10 animate-spin" style={{ color: 'var(--accent-primary)' }} />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>加载中...</span>
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 gap-4">
                <FileText className="w-16 h-16" style={{ color: 'var(--text-tertiary)' }} />
                <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>{error}</p>
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                  style={{
                    background: 'var(--accent-primary)',
                    color: 'white',
                  }}
                >
                  <ExternalLink className="w-4 h-4" />
                  在新窗口打开
                </a>
              </div>
            )}
            <iframe
              src={file.url}
              className="w-full h-full border-0"
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setError('PDF加载失败');
              }}
              title={file.name}
            />
          </div>
        );
        
      case 'image':
        return (
          <div className="w-full h-full flex items-center justify-center p-8 bg-[var(--bg-secondary)] rounded-lg">
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--bg-secondary)] z-10 gap-3">
                <Loader2 className="w-10 h-10 animate-spin" style={{ color: 'var(--accent-primary)' }} />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>加载中...</span>
              </div>
            )}
            {error && (
              <div className="flex flex-col items-center gap-4">
                <FileText className="w-16 h-16" style={{ color: 'var(--text-tertiary)' }} />
                <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>{error}</p>
              </div>
            )}
            <img
              src={file.url}
              alt={file.name}
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={previewStyle}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setError('图片加载失败');
              }}
            />
          </div>
        );
        
      case 'word':
      case 'excel':
      case 'powerpoint':
        return (
          <div className="w-full h-full relative bg-white rounded-lg overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 gap-3">
                <Loader2 className="w-10 h-10 animate-spin" style={{ color: 'var(--accent-primary)' }} />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>加载中...</span>
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 gap-4">
                <FileIcon type={file.type} size={64} className="text-[var(--text-tertiary)]" />
                <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>{error}</p>
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                  style={{
                    background: 'var(--accent-primary)',
                    color: 'white',
                  }}
                >
                  <ExternalLink className="w-4 h-4" />
                  下载文件
                </a>
              </div>
            )}
            <iframe
              src={getOfficePreviewUrl(file.url)}
              className="w-full h-full border-0"
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setError('文档加载失败');
              }}
              title={file.name}
            />
          </div>
        );
        
      default:
        return (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-[var(--bg-secondary)] rounded-lg">
            <FileIcon type={file.type} size={80} className="text-[var(--text-tertiary)]" />
            <p className="mt-6 text-xl font-medium" style={{ color: 'var(--text-primary)' }}>
              {file.name}
            </p>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
              此文件类型暂不支持预览
            </p>
            <div className="flex gap-3 mt-6">
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: 'var(--accent-primary)',
                  color: 'white',
                }}
              >
                <ExternalLink className="w-4 h-4" />
                打开文件
              </a>
              <a
                href={file.url}
                download={file.name}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                }}
              >
                <Download className="w-4 h-4" />
                下载文件
              </a>
            </div>
          </div>
        );
    }
  };
  
  return (
    <>
      {/* 遮罩层 */}
      <div 
        className={cn(
          'fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm transition-opacity duration-200',
          isClosing ? 'opacity-0' : 'opacity-100'
        )}
        onClick={handleClose}
      />
      
      {/* 预览面板 */}
      <div 
        className={cn(
          'fixed z-[101] flex flex-col',
          'transition-all duration-200 ease-out',
          isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100',
          className
        )}
        style={{
          inset: '1.5rem',
          maxWidth: '1200px',
          margin: '0 auto',
          background: 'var(--bg-primary)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-primary)',
          boxShadow: 'var(--shadow-colorful-glow)',
        }}
      >
        {/* 顶部工具栏 */}
        <div 
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
          }}
        >
          {/* 文件信息 */}
          <div className="flex items-center gap-3 min-w-0">
            <div 
              className="p-2 rounded-lg flex-shrink-0"
              style={{ background: 'var(--accent-light)' }}
            >
              <FileIcon type={file.type} size={20} className="text-[var(--accent-primary)]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {file.name}
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {file.size ? `${(file.size / 1024).toFixed(1)} KB` : '未知大小'}
              </p>
            </div>
          </div>
          
          {/* 工具按钮 */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* 缩放控制（仅图片） */}
            {file.type === 'image' && (
              <div className="flex items-center gap-1 mr-2 px-2 py-1 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
                <button
                  onClick={() => setScale(Math.max(25, scale - 25))}
                  className="p-1.5 rounded transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                  title="缩小"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono min-w-[3rem] text-center" style={{ color: 'var(--text-secondary)' }}>
                  {scale}%
                </span>
                <button
                  onClick={() => setScale(Math.min(200, scale + 25))}
                  className="p-1.5 rounded transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                  title="放大"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setRotation((rotation + 90) % 360)}
                  className="p-1.5 rounded transition-colors ml-1"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                  title="旋转"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>
            )}
            
            {/* 下载按钮 */}
            <a
              href={file.url}
              download={file.name}
              className="p-2 rounded-lg transition-all"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-hover)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
              title="下载文件"
            >
              <Download className="w-5 h-5" />
            </a>
            
            {/* 新窗口打开按钮 */}
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg transition-all"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-hover)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
              title="在新窗口打开"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
            
            {/* 关闭按钮 */}
            <button
              onClick={handleClose}
              className="p-2 rounded-lg transition-all ml-1"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-hover)';
                e.currentTarget.style.color = 'var(--color-danger)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
              title="关闭预览"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* 预览内容区域 */}
        <div className="flex-1 overflow-hidden p-4 bg-[var(--bg-primary)]" style={{ borderRadius: '0 0 var(--radius-xl) var(--radius-xl)' }}>
          {renderPreview()}
        </div>
      </div>
    </>
  );
}

export const FilePreview = memo(FilePreviewComponent);
