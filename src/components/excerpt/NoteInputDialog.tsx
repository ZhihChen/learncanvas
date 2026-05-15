'use client';

/**
 * 批注输入弹窗组件
 * 用于"笔记"功能，让用户在摘录前添加批注
 */

import { memo, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Pencil, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NoteInputDialogProps {
  /** 选中的文本（用于预览） */
  selectedText: string;
  /** 确认回调，传入批注内容 */
  onConfirm: (note: string) => void;
  /** 取消回调 */
  onCancel: () => void;
  /** 弹窗位置 */
  position?: { x: number; y: number };
}

function NoteInputDialogComponent({
  selectedText,
  onConfirm,
  onCancel,
  position,
}: NoteInputDialogProps) {
  const [note, setNote] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [positionState, setPositionState] = useState({ x: 0, y: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // 计算位置
  useEffect(() => {
    const dialogWidth = 320;
    const dialogHeight = 200;
    const padding = 10;
    
    let x = position?.x ?? (window.innerWidth - dialogWidth) / 2;
    let y = position?.y ?? (window.innerHeight - dialogHeight) / 2;
    
    // 确保不超出边界
    if (x + dialogWidth + padding > window.innerWidth) {
      x = window.innerWidth - dialogWidth - padding;
    }
    if (y + dialogHeight + padding > window.innerHeight) {
      y = window.innerHeight - dialogHeight - padding;
    }
    if (x < padding) x = padding;
    if (y < padding) y = padding;
    
    // 延迟设置位置以避免同步渲染问题
    setTimeout(() => setPositionState({ x, y }), 0);
    
    // 延迟显示，触发动画
    setTimeout(() => setIsVisible(true), 10);
  }, [position]);
  
  // 自动聚焦
  useEffect(() => {
    if (isVisible && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isVisible]);
  
  // ESC 关闭
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onCancel]);
  
  // 确认
  const handleConfirm = () => {
    onConfirm(note.trim());
  };
  
  // Enter 确认（Shift+Enter 换行）
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleConfirm();
    }
  };
  
  return createPortal(
    <div
      className={cn(
        'fixed z-[10000] w-80',
        'bg-[var(--node-bg)] border border-[var(--border-light)] rounded-2xl',
        'shadow-2xl shadow-[var(--accent-primary)]/20',
        'overflow-hidden',
        'transition-all duration-200 ease-out',
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      )}
      style={{
        left: positionState.x,
        top: positionState.y,
      }}
    >
      {/* 头部 */}
      <div className="px-4 py-3 border-b border-[var(--border-light)] bg-[var(--bg-tertiary)]/30">
        <div className="flex items-center gap-2">
          <Pencil className="w-4 h-4 text-[var(--accent-primary)]" />
          <span className="text-sm font-medium text-[var(--text-primary)]">添加批注</span>
        </div>
      </div>
      
      {/* 选中文本预览 */}
      <div className="px-4 py-2 border-b border-[var(--border-light)]/50">
        <div className="text-xs text-[var(--text-tertiary)] mb-1">选中的内容：</div>
        <div className="text-sm text-[var(--text-secondary)] line-clamp-2">
          {selectedText}
        </div>
      </div>
      
      {/* 批注输入 */}
      <div className="p-4">
        <textarea
          ref={textareaRef}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="写下你的想法..."
          rows={3}
          className="w-full px-3 py-2 text-sm bg-[var(--bg-tertiary)]/30 border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] resize-none focus:outline-none"
        />
      </div>
      
      {/* 操作按钮 */}
      <div className="flex items-center justify-end gap-2 px-4 pb-4">
        <button
          onClick={onCancel}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]/50 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
          取消
        </button>
        <button
          onClick={handleConfirm}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/30 rounded-lg transition-colors"
        >
          <Check className="w-4 h-4" />
          确认
        </button>
      </div>
    </div>,
    document.body
  );
}

export const NoteInputDialog = memo(NoteInputDialogComponent);
NoteInputDialog.displayName = 'NoteInputDialog';
