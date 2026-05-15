'use client';

/**
 * 划线菜单组件
 * 用户选中文本后弹出，提供摘录、高亮、笔记、待办、提问等操作
 */

import { memo, useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  FileText, 
  Highlighter, 
  Pencil, 
  CheckSquare, 
  MessageCircle,
  GitBranch,
  X,
} from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';
import type { ExcerptType } from '@/types';
import { cn } from '@/lib/utils';

/**
 * 操作按钮配置
 */
const ACTION_BUTTONS = [
  {
    type: 'excerpt' as ExcerptType,
    label: '摘录',
    icon: FileText,
    description: '保存到笔记节点',
  },
  {
    type: 'note' as ExcerptType,
    label: '笔记',
    icon: Pencil,
    description: '摘录并添加批注',
  },
  {
    type: 'question' as const, // 特殊类型：提问
    label: '提问',
    icon: MessageCircle,
    description: '对这段话继续追问',
  },
  {
    type: 'branch' as const, // 特殊类型：分支
    label: '分支',
    icon: GitBranch,
    description: '创建新节点深入讨论',
  },
] as const;

interface HighlightMenuProps {
  /** 菜单关闭回调 */
  onClose?: () => void;
  /** 操作按钮点击回调 */
  onAction?: (type: ExcerptType | 'question' | 'branch') => void;
}

/**
 * 划线菜单组件
 */
function HighlightMenuComponent({ onClose, onAction }: HighlightMenuProps) {
  const { highlightMenuState, hideHighlightMenu } = useCanvasStore();
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  
  // 计算菜单位置，确保不超出视口
  useEffect(() => {
    if (highlightMenuState?.visible) {
      const menuWidth = 280; // 预估菜单宽度
      const menuHeight = 50; // 预估菜单高度
      const padding = 10;
      
      let x = highlightMenuState.position.x;
      let y = highlightMenuState.position.y;
      
      // 确保不超出右边界
      if (x + menuWidth + padding > window.innerWidth) {
        x = window.innerWidth - menuWidth - padding;
      }
      
      // 确保不超出底部边界
      if (y + menuHeight + padding > window.innerHeight) {
        y = highlightMenuState.position.y - menuHeight - 10; // 显示在选区上方
      }
      
      // 确保不超出左边界
      if (x < padding) {
        x = padding;
      }
      
      // 延迟设置位置以避免同步渲染问题
      setTimeout(() => setPosition({ x, y }), 0);
      
      // 延迟显示，触发动画
      setTimeout(() => setIsVisible(true), 10);
    } else {
      // 延迟隐藏
      setTimeout(() => setIsVisible(false), 0);
    }
  }, [highlightMenuState]);
  
  // 点击菜单外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isMenuClick = target.closest('[data-highlight-menu]');
      const isMessageClick = target.closest('[data-message-content]');
      
      if (!isMenuClick && !isMessageClick) {
        hideHighlightMenu();
        onClose?.();
      }
    };
    
    if (highlightMenuState?.visible) {
      // 延迟添加事件监听，避免立即触发
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [highlightMenuState?.visible, hideHighlightMenu, onClose]);
  
  // ESC 键关闭
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && highlightMenuState?.visible) {
        hideHighlightMenu();
        onClose?.();
      }
    };
    
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [highlightMenuState?.visible, hideHighlightMenu, onClose]);
  
  // 处理操作按钮点击
  const handleAction = useCallback((type: ExcerptType | 'question' | 'branch') => {
    onAction?.(type);
    // 菜单关闭由 ChatNode 中的 onAction 处理
  }, [onAction]);
  
  // 不显示时返回 null
  if (!highlightMenuState?.visible) {
    return null;
  }
  
  // 使用 Portal 渲染到 body
  return createPortal(
    <div
      ref={menuRef}
      data-highlight-menu
      className={cn(
        'fixed z-[9999] flex items-center gap-1',
        'px-2 py-1.5 rounded-xl',
        'bg-[var(--node-bg)] border border-[var(--border-light)]',
        'shadow-lg',
        'transition-all duration-200 ease-out',
        isVisible 
          ? 'opacity-100 scale-100 translate-y-0' 
          : 'opacity-0 scale-95 translate-y-1'
      )}
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {/* 操作按钮 */}
      {ACTION_BUTTONS.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.type}
            onClick={() => handleAction(action.type)}
            className={cn(
              'group flex items-center gap-1.5 px-3 py-2 rounded-lg',
              'text-sm font-medium',
              'transition-all duration-150',
              'hover:bg-[var(--accent-primary)]/20 hover:text-[var(--accent-primary)]',
              'text-[var(--text-secondary)]'
            )}
            title={action.description}
          >
            <Icon className="w-4 h-4" />
            <span>{action.label}</span>
          </button>
        );
      })}
      
      {/* 关闭按钮 */}
      <button
        onClick={() => {
          hideHighlightMenu();
          onClose?.();
        }}
        className="ml-1 p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]/50 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>,
    document.body
  );
}

// 使用 memo 优化性能
export const HighlightMenu = memo(HighlightMenuComponent);
HighlightMenu.displayName = 'HighlightMenu';
