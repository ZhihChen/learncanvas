'use client';

/**
 * 节点引用选择器组件
 * 用于在输入框中快速引用其他节点
 */

import { memo, useState, useEffect, useRef, useCallback } from 'react';
import { Search, Link2, X } from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';
import { cn } from '@/lib/utils';

interface NodeReferencePickerProps {
  currentNodeId: string;
  position: { x: number; y: number };
  onSelect: (nodeId: string, title: string) => void;
  onClose: () => void;
}

function NodeReferencePickerComponent({ 
  currentNodeId, 
  position, 
  onSelect, 
  onClose 
}: NodeReferencePickerProps) {
  const { nodes, edges } = useCanvasStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  
  // 过滤可引用的节点（排除当前节点）
  const availableNodes = nodes.filter(node => 
    node.id !== currentNodeId && 
    node.data.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // 自动聚焦
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(i => Math.min(i + 1, availableNodes.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(i => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (availableNodes[selectedIndex]) {
            onSelect(availableNodes[selectedIndex].id, availableNodes[selectedIndex].data.title);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [availableNodes, selectedIndex, onSelect, onClose]);
  
  // 滚动到选中项
  useEffect(() => {
    if (listRef.current) {
      const selectedItem = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);
  
  // 检查节点是否已连接到当前节点
  const isConnected = useCallback((nodeId: string) => {
    return edges.some(e => e.source === nodeId && e.target === currentNodeId);
  }, [edges, currentNodeId]);
  
  return (
    <div
      className="fixed z-50 w-72 bg-[var(--node-bg)] border border-[var(--border-light)] rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl"
      style={{ left: position.x, top: position.y }}
    >
      {/* 搜索框 */}
      <div className="p-2 border-b border-[var(--border-light)]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="搜索节点..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--bg-tertiary)]/30 border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none"
          />
        </div>
      </div>
      
      {/* 节点列表 */}
      <div ref={listRef} className="max-h-64 overflow-y-auto">
        {availableNodes.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-[var(--bg-tertiary)]/50 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-[var(--text-tertiary)]" />
            </div>
            <p className="text-sm text-[var(--text-tertiary)]">
              {searchQuery ? '未找到匹配的节点' : '暂无其他节点'}
            </p>
          </div>
        ) : (
          <div className="py-1">
            {availableNodes.map((node, index) => (
              <button
                key={node.id}
                onClick={() => onSelect(node.id, node.data.title)}
                className={cn(
                  'w-full px-3 py-2.5 flex items-center gap-3 text-left transition-colors',
                  index === selectedIndex
                    ? 'bg-[var(--accent-primary)]/20 text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]/50'
                )}
              >
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                  node.data.status === 'completed' ? 'bg-[var(--accent-mint)]/20' :
                  node.data.status === 'active' ? 'bg-[var(--accent-primary)]/20' : 'bg-[var(--bg-tertiary)]/50'
                )}>
                  <Link2 className={cn(
                    'w-4 h-4',
                    node.data.status === 'completed' ? 'text-[var(--accent-mint)]' :
                    node.data.status === 'active' ? 'text-[var(--accent-primary)]' : 'text-[var(--text-tertiary)]'
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{node.data.title}</div>
                  <div className="text-xs text-[var(--text-tertiary)]">
                    {node.data.messages?.length || 0} 条消息
                    {isConnected(node.id) && ' · 已连接'}
                  </div>
                </div>
                {isConnected(node.id) && (
                  <div className="w-2 h-2 rounded-full bg-green-500" title="已连接" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* 底部提示 */}
      <div className="px-3 py-2 border-t border-indigo-500/10 bg-white/5">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>↑↓ 选择 · Enter 确认</span>
          <span>Esc 关闭</span>
        </div>
      </div>
    </div>
  );
}

export const NodeReferencePicker = memo(NodeReferencePickerComponent);
