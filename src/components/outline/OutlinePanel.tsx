'use client';

/**
 * 大纲视图面板
 * 以树形列表展示所有节点
 */

import { useState, useCallback } from 'react';
import { 
  MessageSquare, 
  Folder, 
  FolderOpen,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Plus,
  Check,
  Circle,
  Loader2,
  Link2,
  Tag,
  MoreVertical,
  Trash2,
  Focus,
} from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';
import { cn } from '@/lib/utils';
import type { ChatNode as ChatNodeType } from '@/types';

interface OutlineItemProps {
  node: ChatNodeType;
  level: number;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  onFocus: (id: string) => void;
  onDelete: (id: string) => void;
}

function OutlineItem({ 
  node, 
  level, 
  isSelected, 
  isExpanded, 
  onSelect, 
  onToggle,
  onFocus,
  onDelete 
}: OutlineItemProps) {
  const isGroup = node.type === 'groupNode';
  const childNodes = (node.data.childNodes as string[] | undefined) || [];
  const hasChildren = isGroup && childNodes.length > 0;
  const status = node.data.status || 'idle';
  const messageCount = node.data.messages?.length || 0;
  const tags = node.data.tags || [];
  
  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors',
          isSelected 
            ? 'bg-[var(--accent-primary)]/20 text-[var(--text-primary)]' 
            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]/50'
        )}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
        onClick={() => onSelect(node.id)}
      >
        {/* 展开/折叠按钮 */}
        {isGroup ? (
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}
            className="p-0.5 rounded hover:bg-white/10 transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            )}
          </button>
        ) : (
          <div className="w-4" />
        )}
        
        {/* 图标 */}
        <div className={cn(
          'p-1 rounded-md flex-shrink-0',
          isGroup ? 'bg-[var(--accent-lavender)]/20' : 'bg-[var(--accent-primary)]/20'
        )}>
          {isGroup ? (
            isExpanded ? (
              <FolderOpen className="w-3.5 h-3.5 text-[var(--accent-lavender)]" />
            ) : (
              <Folder className="w-3.5 h-3.5 text-[var(--accent-lavender)]" />
            )
          ) : (
            <MessageSquare className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
          )}
        </div>
        
        {/* 标题 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm truncate">{node.data.title}</span>
            
            {/* 状态图标 */}
            {status === 'completed' && (
              <div className="w-4 h-4 rounded-full bg-[var(--accent-mint)]/20 flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-[var(--accent-mint)]" />
              </div>
            )}
            {status === 'active' && (
              <Loader2 className="w-3.5 h-3.5 text-[var(--accent-primary)] animate-spin" />
            )}
          </div>
          
          {/* 元信息 */}
          <div className="flex items-center gap-2 mt-0.5">
            {!isGroup && messageCount > 0 && (
              <span className="text-xs text-[var(--text-tertiary)]">{messageCount} 条消息</span>
            )}
            {isGroup && childNodes.length > 0 && (
              <span className="text-xs text-[var(--text-tertiary)]">
                {childNodes.length} 个节点
              </span>
            )}
            {tags.length > 0 && (
              <div className="flex items-center gap-1">
                <Tag className="w-2.5 h-2.5 text-[var(--text-tertiary)]" />
                <span className="text-xs text-[var(--text-tertiary)]">{tags.length}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* 操作按钮 */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onFocus(node.id); }}
            className="p-1.5 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
            title="定位到节点"
          >
            <Focus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
            className="p-1.5 rounded hover:bg-red-500/20 text-[var(--text-tertiary)] hover:text-[var(--accent-coral)] transition-colors"
            title="删除节点"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function OutlinePanel({ onClose }: { onClose?: () => void }) {
  const { nodes, edges, selectedNodeId, deleteNode } = useCanvasStore();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // 切换分组展开状态
  const toggleGroup = useCallback((id: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);
  
  // 定位到节点
  const focusNode = useCallback((id: string) => {
    // 触发视图跳转
    const event = new CustomEvent('focusNode', { detail: id });
    window.dispatchEvent(event);
  }, []);
  
  // 获取顶层节点（不在分组中的节点）
  const childNodeIds = new Set<string>(
    nodes
      .filter(n => n.type === 'groupNode')
      .flatMap(n => (n.data.childNodes as string[] | undefined) || [])
  );
  
  const topLevelNodes = nodes.filter(n => !childNodeIds.has(n.id));
  
  // 渲染节点树
  const renderNode = (node: ChatNodeType, level: number): React.ReactNode => {
    const isSelected = selectedId === node.id || selectedNodeId === node.id;
    const isExpanded = expandedGroups.has(node.id);
    
    const items: React.ReactNode[] = [
      <OutlineItem
        key={node.id}
        node={node}
        level={level}
        isSelected={isSelected}
        isExpanded={isExpanded}
        onSelect={setSelectedId}
        onToggle={toggleGroup}
        onFocus={focusNode}
        onDelete={deleteNode}
      />
    ];
    
    // 如果是展开的分组，渲染子节点
    if (node.type === 'groupNode' && isExpanded) {
      const nodeChildIds = (node.data.childNodes as string[] | undefined) || [];
      const childNodes = nodes.filter(n => nodeChildIds.includes(n.id));
      childNodes.forEach(child => {
        items.push(renderNode(child, level + 1));
      });
    }
    
    return items;
  };
  
  return (
    <div className="flex flex-col h-full bg-[#1a1a2e] border-r border-indigo-500/20">
      {/* 头部 - 带收起按钮 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-indigo-500/10">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-5 bg-indigo-500 rounded-full" />
          <h2 className="text-sm font-medium text-white">大纲</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">{nodes.length} 项</span>
          {onClose && (
            <button
              onClick={onClose}
              className="flex items-center gap-1 px-2 py-1 text-xs text-indigo-400 hover:text-white hover:bg-indigo-500/20 rounded-md transition-colors"
              title="收起大纲"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>收起</span>
            </button>
          )}
        </div>
      </div>
      
      {/* 节点列表 */}
      <div className="flex-1 overflow-y-auto">
        {topLevelNodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-3">
              <MessageSquare className="w-6 h-6 text-indigo-400/50" />
            </div>
            <p className="text-sm text-slate-400 mb-1">暂无节点</p>
            <p className="text-xs text-slate-500">点击"新对话"开始创建</p>
          </div>
        ) : (
          <div className="py-2">
            {topLevelNodes.map(node => renderNode(node, 0))}
          </div>
        )}
      </div>
      
      {/* 底部统计 */}
      <div className="px-4 py-3 border-t border-indigo-500/10 bg-white/5">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" />
              {nodes.filter(n => n.type === 'chatNode').length} 对话
            </span>
            <span className="flex items-center gap-1">
              <Folder className="w-3.5 h-3.5" />
              {nodes.filter(n => n.type === 'groupNode').length} 分组
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Link2 className="w-3.5 h-3.5" />
            {edges.length} 连接
          </span>
        </div>
      </div>
    </div>
  );
}
