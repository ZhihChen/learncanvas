'use client';

/**
 * 工具栏组件
 * 支持撤销/重做、节点创建、布局整理、导入导出
 */

import { useState, useRef, useEffect } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import { useReactFlow } from '@xyflow/react';
import { 
  Plus, 
  Download, 
  Upload, 
  Trash2,
  MessageSquare,
  FolderPlus,
  LayoutGrid,
  Search,
  X,
  Layers,
  ArrowRight,
  ArrowDown,
  GitBranch,
  CheckSquare,
  SidebarOpen,
  SidebarClose,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolbarProps {
  showOutline: boolean;
  onToggleOutline: () => void;
}

// 布局选项
const layoutOptions = [
  { type: 'tree' as const, icon: GitBranch, label: '树形布局', desc: '从上到下' },
  { type: 'horizontal' as const, icon: ArrowRight, label: '水平布局', desc: '从左到右' },
  { type: 'grid' as const, icon: LayoutGrid, label: '网格布局', desc: '整齐排列' },
  { type: 'compact' as const, icon: Layers, label: '紧凑布局', desc: '智能排列' },
];

export function Toolbar({ showOutline, onToggleOutline }: ToolbarProps) {
  const { 
    addNode, 
    addGroup, 
    clearCanvas, 
    nodes, 
    edges, 
    meta,
    applyLayout,
    selectedNodeIds,
    deleteSelectedNodes,
    searchQuery,
    setSearchQuery,
    selectAllNodes,
    clearSelection,
    canUndo,
    canRedo,
    undo,
    redo,
  } = useCanvasStore();
  const { screenToFlowPosition, zoomIn, zoomOut, fitView } = useReactFlow();
  
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const layoutMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (layoutMenuRef.current && !layoutMenuRef.current.contains(e.target as Node)) {
        setShowLayoutMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // 搜索框显示时聚焦
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);
  
  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z 撤销
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) undo();
      }
      // Ctrl+Shift+Z 或 Ctrl+Y 重做
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (canRedo) redo();
      }
      // Ctrl+F 搜索
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setShowSearch(true);
      }
      // Escape 关闭搜索
      if (e.key === 'Escape') {
        setShowSearch(false);
        setSearchQuery('');
      }
      // Ctrl+A 全选
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !showSearch) {
        // 仅在画布区域全选
        if (document.activeElement === document.body) {
          e.preventDefault();
          selectAllNodes();
        }
      }
      // Delete 删除选中
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeIds.size > 0 && document.activeElement === document.body) {
          e.preventDefault();
          deleteSelectedNodes();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeIds, showSearch, setSearchQuery, selectAllNodes, deleteSelectedNodes, canUndo, canRedo, undo, redo]);
  
  // 添加节点
  const handleAddNode = () => {
    const position = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
    addNode(position);
  };
  
  // 添加分组
  const handleAddGroup = () => {
    const position = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
    addGroup(position);
  };
  
  // 导出画布
  const handleExport = () => {
    const data = {
      meta,
      nodes,
      edges,
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `canvas-${meta.title}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  // 导入画布
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        // 验证数据结构
        if (!data.nodes || !Array.isArray(data.nodes)) {
          throw new Error('无效的画布数据：缺少节点数据');
        }
        
        // 确认导入
        const confirmMsg = nodes.length > 0
          ? '导入将覆盖当前画布内容，是否继续？'
          : '是否导入此画布？';
        
        if (confirm(confirmMsg)) {
          useCanvasStore.getState().importCanvas({
            meta: data.meta,
            nodes: data.nodes,
            edges: data.edges || [],
          });
        }
      } catch (error) {
        console.error('Failed to import:', error);
        alert('导入失败：' + (error instanceof Error ? error.message : '未知错误'));
      }
    };
    
    input.click();
  };
  
  // 应用布局
  const handleLayout = (layoutType: 'tree' | 'horizontal' | 'grid' | 'compact') => {
    applyLayout(layoutType);
    setShowLayoutMenu(false);
  };
  
  // 统计信息
  const completedCount = nodes.filter(
    (n) => n.data.status === 'completed'
  ).length;
  const totalMessages = nodes.reduce(
    (acc: number, n) => acc + (n.data.messages?.length || 0),
    0
  );
  
  return (
    <div className="flex items-center justify-between w-full gap-4">
      {/* 左侧：Logo和信息 */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3 px-4 py-2 bg-[var(--node-bg)] rounded-lg border border-[var(--border-light)]">
          <div className="p-2 bg-[var(--bg-tertiary)] rounded-lg">
            <MessageSquare className="w-5 h-5 text-[var(--accent-primary)]" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-[var(--text-primary)]">{meta.title}</span>
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <span>{nodes.length} 节点</span>
              <span className="text-[var(--text-tertiary)]">·</span>
              <span>{totalMessages} 消息</span>
              {completedCount > 0 && (
                <>
                  <span className="text-[var(--text-tertiary)]">·</span>
                  <span className="text-[var(--accent-mint)]">{completedCount} 完成</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* 大纲切换按钮 */}
        <button
          onClick={onToggleOutline}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200',
            showOutline
              ? 'bg-[var(--bg-tertiary)] text-[var(--accent-primary)] border border-[var(--border-light)]'
              : 'bg-[var(--node-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border-light)]'
          )}
          title={showOutline ? '隐藏大纲' : '显示大纲'}
        >
          {showOutline ? (
            <SidebarClose className="w-4 h-4" />
          ) : (
            <SidebarOpen className="w-4 h-4" />
          )}
          <span className="text-sm">大纲</span>
        </button>
        
        {/* 多选状态提示 */}
        {selectedNodeIds.size > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-[var(--node-bg)] rounded-lg border border-[var(--border-light)]">
            <CheckSquare className="w-4 h-4 text-[var(--accent-primary)]" />
            <span className="text-sm text-[var(--accent-sky)]">
              已选中 {selectedNodeIds.size} 个节点
            </span>
            <button
              onClick={deleteSelectedNodes}
              className="ml-1 p-1 text-[var(--accent-sky)] hover:text-[var(--accent-coral)] hover:bg-red-500/20 rounded transition-colors"
              title="删除选中 (Delete)"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={clearSelection}
              className="p-1 text-[var(--accent-sky)] hover:text-[var(--text-primary)] rounded transition-colors"
              title="取消选择 (Esc)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
      
      {/* 右侧：操作按钮 */}
      <div className="flex items-center gap-2">
        {/* 撤销/重做 */}
        <div className="flex items-center gap-1 p-1 bg-[var(--node-bg)] rounded-lg border border-[var(--border-light)]">
          <button
            onClick={undo}
            disabled={!canUndo}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all duration-200',
              canUndo
                ? 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                : 'text-[var(--text-tertiary)] cursor-not-allowed'
            )}
            title="撤销 (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          
          <button
            onClick={redo}
            disabled={!canRedo}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all duration-200',
              canRedo
                ? 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                : 'text-[var(--text-tertiary)] cursor-not-allowed'
            )}
            title="重做 (Ctrl+Shift+Z)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>
        
        {/* 缩放控制 */}
        <div className="flex items-center gap-1 p-1 bg-[var(--node-bg)] rounded-lg border border-[var(--border-light)]">
          <button
            onClick={() => zoomOut()}
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-md transition-all duration-200"
            title="缩小"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => fitView({ padding: 0.2 })}
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-md transition-all duration-200"
            title="适应画布"
          >
            <Maximize className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => zoomIn()}
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-md transition-all duration-200"
            title="放大"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
        
        {/* 搜索框 */}
        {showSearch ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--node-bg)] rounded-lg border border-[var(--border-light)]">
            <Search className="w-4 h-4 text-[var(--text-secondary)]" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索节点..."
              className="w-40 bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-0.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <kbd className="px-1.5 py-0.5 text-xs text-[var(--text-tertiary)] bg-[var(--bg-tertiary)] rounded">Esc</kbd>
          </div>
        ) : (
          <button
            onClick={() => setShowSearch(true)}
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-all duration-200 bg-[var(--node-bg)] border border-[var(--border-light)]"
            title="搜索节点 (Ctrl+F)"
          >
            <Search className="w-4 h-4" />
          </button>
        )}
        
        {/* 主要操作 */}
        <div className="flex items-center gap-1 p-1 bg-[var(--node-bg)] rounded-lg border border-[var(--border-light)]">
          <button
            onClick={handleAddNode}
            className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-md transition-all duration-200"
            title="添加新对话节点"
          >
            <Plus className="w-4 h-4" />
            <span>新对话</span>
          </button>
          
          <button
            onClick={handleAddGroup}
            className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-md transition-all duration-200"
            title="添加新分组"
          >
            <FolderPlus className="w-4 h-4" />
            <span>新分组</span>
          </button>
        </div>
        
        {/* 布局选择器 */}
        <div className="relative" ref={layoutMenuRef}>
          <button
            onClick={() => setShowLayoutMenu(!showLayoutMenu)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200',
              showLayoutMenu
                ? 'bg-[var(--bg-tertiary)] text-[var(--accent-primary)] border border-[var(--border-light)]'
                : 'bg-[var(--node-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border-light)]'
            )}
            title="自动布局"
          >
            <Layers className="w-4 h-4" />
            <span className="text-sm">布局</span>
          </button>
          
          {/* 布局菜单 */}
          {showLayoutMenu && (
            <div className="absolute top-full mt-2 right-0 w-48 py-2 bg-[var(--node-bg)] rounded-lg border border-[var(--border-light)] shadow-md z-50">
              {layoutOptions.map((option) => (
                <button
                  key={option.type}
                  onClick={() => handleLayout(option.type)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  <option.icon className="w-4 h-4 text-[var(--accent-primary)]" />
                  <div className="flex-1">
                    <div className="text-sm text-[var(--text-primary)]">{option.label}</div>
                    <div className="text-xs text-[var(--text-tertiary)]">{option.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* 次要操作 */}
        <div className="flex items-center gap-1 p-1 bg-[var(--node-bg)] rounded-lg border border-[var(--border-light)]">
          <button
            onClick={handleExport}
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-md transition-all duration-200"
            title="导出画布"
          >
            <Download className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleImport}
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-md transition-all duration-200"
            title="导入画布"
          >
            <Upload className="w-4 h-4" />
          </button>
          
          <div className="w-px h-6 bg-[var(--border-light)]" />
          
          <button
            onClick={() => {
              if (confirm('确定要清空画布吗？')) {
                clearCanvas();
              }
            }}
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--accent-coral)] hover:bg-red-500/20 rounded-md transition-all duration-200"
            title="清空画布"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
