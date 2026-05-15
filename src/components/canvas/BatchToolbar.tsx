'use client';

/**
 * 批量操作工具栏
 * 当选中多个节点时显示，支持批量删除、移动、添加标签等操作
 * 
 * 缤纷晨光主题优化版
 */

import { useState, useCallback } from 'react';
import { 
  Trash2, 
  Tag, 
  X, 
  Check,
  FolderPlus,
  Layers,
} from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';
import { cn } from '@/lib/utils';

interface BatchToolbarProps {
  selectedCount: number;
}

export function BatchToolbar({ selectedCount }: BatchToolbarProps) {
  const { 
    deleteSelectedNodes,
    clearSelection,
    nodes,
    updateNodeData,
    selectedNodeIds,
  } = useCanvasStore();
  
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTag, setNewTag] = useState('');
  
  // 批量添加标签
  const handleAddTag = useCallback(() => {
    if (!newTag.trim()) return;
    
    selectedNodeIds.forEach(nodeId => {
      const node = nodes.find(n => n.id === nodeId);
      if (node && node.type === 'chatNode') {
        const currentTags = node.data.tags || [];
        if (!currentTags.includes(newTag.trim())) {
          updateNodeData(nodeId, { tags: [...currentTags, newTag.trim()] });
        }
      }
    });
    
    setNewTag('');
    setShowTagInput(false);
  }, [newTag, selectedNodeIds, nodes, updateNodeData]);
  
  // 批量折叠
  const handleCollapseAll = useCallback((collapsed: boolean) => {
    selectedNodeIds.forEach(nodeId => {
      updateNodeData(nodeId, { collapsed });
    });
  }, [selectedNodeIds, updateNodeData]);
  
  if (selectedCount <= 1) return null;
  
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
      <div 
        className="flex items-center gap-2 px-4 py-3 rounded-2xl shadow-lg"
        style={{
          background: 'var(--node-bg)',
          border: '1px solid var(--border-primary)',
          boxShadow: 'var(--shadow-colorful-glow)',
        }}
      >
        {/* 选中数量 */}
        <div 
          className="flex items-center gap-2 pr-3"
          style={{ borderRight: '1px solid var(--border-primary)' }}
        >
          <div 
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{
              background: 'var(--accent-light)',
            }}
          >
            <span 
              className="text-xs font-semibold"
              style={{ color: 'var(--accent-primary)' }}
            >
              {selectedCount}
            </span>
          </div>
          <span 
            className="text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            已选中
          </span>
        </div>
        
        {/* 批量操作按钮 */}
        <div className="flex items-center gap-1">
          {/* 添加标签 */}
          <div className="relative">
            <button
              onClick={() => setShowTagInput(!showTagInput)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all duration-200'
              )}
              style={{
                background: showTagInput ? 'var(--accent-light)' : 'transparent',
                color: showTagInput ? 'var(--accent-primary)' : 'var(--text-secondary)',
              }}
              onMouseEnter={(e) => {
                if (!showTagInput) {
                  e.currentTarget.style.background = 'var(--bg-hover)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!showTagInput) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
              title="批量添加标签"
            >
              <Tag className="w-4 h-4" />
              <span>标签</span>
            </button>
            
            {/* 标签输入弹窗 */}
            {showTagInput && (
              <div 
                className="absolute bottom-full left-0 mb-2 w-48 p-2 rounded-lg shadow-xl"
                style={{
                  background: 'var(--node-bg)',
                  border: '1px solid var(--border-primary)',
                }}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddTag();
                      if (e.key === 'Escape') {
                        setShowTagInput(false);
                        setNewTag('');
                      }
                    }}
                    placeholder="输入标签名..."
                    className="flex-1 px-2 py-1 text-sm outline-none rounded"
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-primary)',
                      color: 'var(--text-primary)',
                    }}
                    autoFocus
                  />
                  <button
                    onClick={handleAddTag}
                    disabled={!newTag.trim()}
                    className="p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    style={{ color: 'var(--accent-primary)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--accent-light)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* 折叠 */}
          <button
            onClick={() => handleCollapseAll(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all duration-200"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            title="折叠选中节点"
          >
            <Layers className="w-4 h-4" />
            <span>折叠</span>
          </button>
          
          {/* 删除 */}
          <button
            onClick={deleteSelectedNodes}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all duration-200"
            style={{ color: 'var(--color-danger)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(224, 62, 62, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            title="删除选中节点"
          >
            <Trash2 className="w-4 h-4" />
            <span>删除</span>
          </button>
        </div>
        
        {/* 分隔线 */}
        <div 
          className="w-px h-6"
          style={{ background: 'var(--border-primary)' }}
        />
        
        {/* 取消选择 */}
        <button
          onClick={clearSelection}
          className="p-1.5 rounded-lg transition-all duration-200"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-hover)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          title="取消选择"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
