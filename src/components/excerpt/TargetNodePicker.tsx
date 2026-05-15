'use client';

/**
 * 目标节点选择器组件
 * 用户选择摘录内容的目标节点（笔记节点或待办节点）
 */

import { memo, useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  FileText, 
  CheckSquare, 
  Plus, 
  Search,
  X,
  File,
} from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';
import type { ExcerptType } from '@/types';
import { cn } from '@/lib/utils';

interface TargetNodePickerProps {
  /** 选择完成回调 */
  onSelect: (nodeId: string | 'new', nodeType: 'note') => void;
  /** 关闭回调 */
  onClose: () => void;
  /** 菜单位置 */
  position?: { x: number; y: number };
  /** 操作类型 */
  actionType?: ExcerptType;
}

/**
 * 目标节点选择器组件
 */
function TargetNodePickerComponent({
  onSelect,
  onClose,
  position,
  actionType = 'excerpt',
}: TargetNodePickerProps) {
  const { nodes } = useCanvasStore();
  const [isVisible, setIsVisible] = useState(false);
  const [selectedId, setSelectedId] = useState<string | 'new'>('new');
  const [searchQuery, setSearchQuery] = useState('');
  const [positionState, setPositionState] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 计算位置
  useEffect(() => {
    const pickerWidth = 320;
    const pickerHeight = 400;
    const padding = 10;
    
    let x = position?.x ?? (window.innerWidth - pickerWidth) / 2;
    let y = position?.y ?? (window.innerHeight - pickerHeight) / 2;
    
    // 确保不超出右边界
    if (x + pickerWidth + padding > window.innerWidth) {
      x = window.innerWidth - pickerWidth - padding;
    }
    
    // 确保不超出底部边界
    if (y + pickerHeight + padding > window.innerHeight) {
      y = window.innerHeight - pickerHeight - padding;
    }
    
    // 确保不超出左边界
    if (x < padding) {
      x = padding;
    }
    
    // 确保不超出顶部边界
    if (y < padding) {
      y = padding;
    }
    
    // 延迟设置位置以避免同步渲染问题
    setTimeout(() => setPositionState({ x, y }), 0);
    
    // 延迟显示，触发动画
    setTimeout(() => setIsVisible(true), 10);
  }, [position]);
  
  // ESC 键关闭
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);
  
  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-target-picker]') && !target.closest('[data-highlight-menu]')) {
        onClose();
      }
    };
    
    // 延迟添加事件监听
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  
  // 获取可用的目标节点
  const availableNodes = nodes.filter((node) => {
    // 笔记节点可以作为目标
    const nodeData = node.data as any;
    if (nodeData.type === 'note') return true;
    
    return false;
  });
  
  // 过滤搜索结果
  const filteredNodes = availableNodes.filter((node) => {
    if (!searchQuery.trim()) return true;
    const title = node.data.title?.toLowerCase() || '';
    return title.includes(searchQuery.toLowerCase());
  });
  
  // 处理确认
  const handleConfirm = useCallback(() => {
    if (selectedId === 'new') {
      onSelect('new', 'note');
    } else {
      const node = nodes.find(n => n.id === selectedId);
      if (node) {
        onSelect(selectedId, 'note');
      }
    }
    onClose();
  }, [selectedId, nodes, onSelect, onClose]);
  
  // 使用 Portal 渲染
  return createPortal(
    <div
      ref={containerRef}
      data-target-picker
      className={cn(
        'fixed z-[10000] w-80',
        'bg-[var(--node-bg)] border border-[var(--border-light)] rounded-2xl',
        'shadow-2xl shadow-[var(--accent-primary)]/20',
        'overflow-hidden',
        'transition-all duration-200 ease-out',
        isVisible 
          ? 'opacity-100 scale-100' 
          : 'opacity-0 scale-95'
      )}
      style={{
        left: positionState.x,
        top: positionState.y,
      }}
    >
      {/* 头部 */}
      <div className="px-4 py-3 border-b border-[var(--border-light)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[var(--accent-primary)]" />
            <span className="text-sm font-medium text-[var(--text-primary)]">
              摘录到哪个节点？
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* 搜索框 */}
        <div className="mt-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索节点..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--bg-tertiary)]/30 border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none"
          />
        </div>
      </div>
      
      {/* 节点列表 */}
      <div className="max-h-64 overflow-y-auto p-2">
        {/* 新建节点选项 */}
        <button
          onClick={() => setSelectedId('new')}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl',
            'transition-colors',
            selectedId === 'new'
              ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]/50'
          )}
        >
          <div className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center',
            selectedId === 'new' ? 'bg-[var(--accent-primary)]/30' : 'bg-[var(--accent-mint)]/10'
          )}>
            <Plus className="w-4 h-4 text-[var(--accent-mint)]" />
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium">新建笔记节点</div>
            <div className="text-xs text-[var(--text-tertiary)]">
              在画布中创建新的笔记节点
            </div>
          </div>
          {selectedId === 'new' && (
            <div className="w-5 h-5 rounded-full bg-[var(--accent-primary)] flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </button>
        
        {/* 分隔线 */}
        {filteredNodes.length > 0 && (
          <div className="my-2 border-t border-[var(--border-light)]/50" />
        )}
        
        {/* 已有节点列表 */}
        {filteredNodes.map((node) => {
          const nodeData = node.data as any;
          const isNoteNode = nodeData.type === 'note';
          const Icon = isNoteNode ? FileText : CheckSquare;
          const isSelected = selectedId === node.id;
          
          return (
            <button
              key={node.id}
              onClick={() => setSelectedId(node.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl',
                'transition-colors',
                isSelected
                  ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]/50'
              )}
            >
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center',
                isSelected ? 'bg-[var(--accent-primary)]/30' : 'bg-[var(--accent-lavender)]/10'
              )}>
                <Icon className="w-4 h-4 text-[var(--accent-lavender)]" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-medium truncate">
                  {node.data.title || '未命名节点'}
                </div>
                <div className="text-xs text-[var(--text-tertiary)]">
                  {isNoteNode ? '笔记节点' : '待办节点'}
                  {isNoteNode && (node.data as any).excerpts?.length > 0 && (
                    <span className="ml-2">
                      · {(node.data as any).excerpts.length} 条摘录
                    </span>
                  )}
                </div>
              </div>
              {isSelected && (
                <div className="w-5 h-5 rounded-full bg-[var(--accent-primary)] flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
        
        {/* 空状态 */}
        {filteredNodes.length === 0 && searchQuery && (
          <div className="py-8 text-center text-[var(--text-tertiary)] text-sm">
            未找到匹配的节点
          </div>
        )}
      </div>
      
      {/* 底部操作栏 */}
      <div className="px-4 py-3 border-t border-[var(--border-light)] flex items-center justify-end gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
        >
          取消
        </button>
        <button
          onClick={handleConfirm}
          className="px-4 py-2 text-sm bg-[var(--accent-primary)] text-white rounded-lg hover:opacity-90 transition-colors"
        >
          确定
        </button>
      </div>
    </div>,
    document.body
  );
}

// 使用 memo 优化
export const TargetNodePicker = memo(TargetNodePickerComponent);
TargetNodePicker.displayName = 'TargetNodePicker';
