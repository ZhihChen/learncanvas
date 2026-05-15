'use client';

/**
 * 左侧竖排工具栏组件
 * 将所有操作按钮竖向排列在左侧边缘
 */

import { useState, useRef, useEffect } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import { useReactFlow } from '@xyflow/react';
import { 
  Plus, 
  Download, 
  Upload, 
  Trash2,
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
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeftToolbarProps {
  showOutline: boolean;
  onToggleOutline: () => void;
}

// 布局选项
const layoutOptions = [
  { type: 'tree' as const, icon: GitBranch, label: '树形布局' },
  { type: 'horizontal' as const, icon: ArrowRight, label: '水平布局' },
  { type: 'grid' as const, icon: LayoutGrid, label: '网格布局' },
  { type: 'compact' as const, icon: Layers, label: '紧凑布局' },
];

export function LeftToolbar({ showOutline, onToggleOutline }: LeftToolbarProps) {
  const { 
    addNode, 
    addNoteNode,
    addGroup, 
    clearCanvas, 
    nodes, 
    applyLayout,
    selectedNodeIds,
    deleteSelectedNodes,
    canUndo,
    canRedo,
    undo,
    redo,
    allowConcurrentStreaming,
    setAllowConcurrentStreaming,
    streamingNodeIds,
  } = useCanvasStore();
  const { screenToFlowPosition, zoomIn, zoomOut, fitView } = useReactFlow();
  
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const layoutMenuRef = useRef<HTMLDivElement>(null);
  
  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (layoutMenuRef.current && !layoutMenuRef.current.contains(e.target as Node)) {
        setShowLayoutMenu(false);
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // 添加节点
  const handleAddNode = () => {
    const position = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
    addNode(position);
  };
  
  // 添加笔记节点
  const handleAddNoteNode = () => {
    const position = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
    addNoteNode(position);
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
    const { meta, nodes, edges } = useCanvasStore.getState();
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
        
        if (!data.nodes || !Array.isArray(data.nodes)) {
          throw new Error('无效的画布数据');
        }
        
        if (confirm('导入将覆盖当前画布，是否继续？')) {
          useCanvasStore.getState().importCanvas({
            meta: data.meta,
            nodes: data.nodes,
            edges: data.edges || [],
          });
        }
      } catch (error) {
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
  
  // 工具按钮组件
  const ToolButton = ({ 
    icon: Icon, 
    onClick, 
    title, 
    disabled = false,
    active = false,
    danger = false,
  }: {
    icon: React.ElementType;
    onClick: () => void;
    title: string;
    disabled?: boolean;
    active?: boolean;
    danger?: boolean;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200',
        disabled 
          ? 'text-[var(--text-tertiary)] cursor-not-allowed'
          : active
            ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]'
            : danger
              ? 'text-[var(--text-tertiary)] hover:text-red-400 hover:bg-red-500/10'
              : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]/50'
      )}
      title={title}
    >
      <Icon className="w-5 h-5" />
    </button>
  );

  // 分隔线
  const Divider = () => (
    <div className="w-6 h-px bg-gray-200 mx-auto my-1" />
  );

  return (
    <div className="fixed left-0 top-1/2 -translate-y-1/2 z-30">
      <div className="flex flex-col items-center py-3 px-1.5 bg-white border border-gray-200 rounded-r-lg shadow-sm">
        {/* 大纲切换 - 增强视觉反馈 */}
        <button
          onClick={onToggleOutline}
          className={cn(
            'w-10 h-10 flex items-center justify-center rounded transition-all duration-200',
            showOutline
              ? 'bg-blue-100 text-blue-600'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          )}
          title={showOutline ? '隐藏大纲' : '显示大纲'}
        >
          {showOutline ? (
            <div className="relative">
              <SidebarClose className="w-5 h-5" />
            </div>
          ) : (
            <SidebarOpen className="w-5 h-5" />
          )}
        </button>
        {showOutline && (
          <div className="text-[10px] text-indigo-300 mt-0.5">收起</div>
        )}
        
        <Divider />
        
        {/* 撤销/重做 */}
        <ToolButton
          icon={Undo2}
          onClick={undo}
          title="撤销 (⌘Z)"
          disabled={!canUndo}
        />
        <ToolButton
          icon={Redo2}
          onClick={redo}
          title="重做 (⌘⇧Z)"
          disabled={!canRedo}
        />
        
        <Divider />
        
        {/* 缩放控制 */}
        <ToolButton
          icon={ZoomOut}
          onClick={() => zoomOut()}
          title="缩小"
        />
        <ToolButton
          icon={Maximize}
          onClick={() => fitView({ padding: 0.2 })}
          title="适应画布"
        />
        <ToolButton
          icon={ZoomIn}
          onClick={() => zoomIn()}
          title="放大"
        />
        
        <Divider />
        
        {/* 添加节点 */}
        <ToolButton
          icon={Plus}
          onClick={handleAddNode}
          title="添加对话节点"
        />
        <ToolButton
          icon={FileText}
          onClick={handleAddNoteNode}
          title="添加笔记节点"
        />
        <ToolButton
          icon={FolderPlus}
          onClick={handleAddGroup}
          title="添加分组"
        />
        
        <Divider />
        
        {/* 布局 */}
        <div className="relative" ref={layoutMenuRef}>
          <ToolButton
            icon={Layers}
            onClick={() => {
              setShowLayoutMenu(!showLayoutMenu);
              setShowMoreMenu(false);
            }}
            title="自动布局"
            active={showLayoutMenu}
          />
          
          {/* 布局菜单 */}
          {showLayoutMenu && (
            <div className="absolute left-full top-0 ml-2 w-36 py-1.5 bg-slate-800/95 backdrop-blur-sm border border-white/10 rounded-lg shadow-xl z-50">
              {layoutOptions.map((option) => (
                <button
                  key={option.type}
                  onClick={() => handleLayout(option.type)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 transition-colors"
                >
                  <option.icon className="w-4 h-4 text-amber-400" />
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <Divider />
        
        {/* 更多操作 */}
        <div className="relative">
          <ToolButton
            icon={LayoutGrid}
            onClick={() => {
              setShowMoreMenu(!showMoreMenu);
              setShowLayoutMenu(false);
            }}
            title="更多操作"
            active={showMoreMenu}
          />
          
          {/* 更多菜单 */}
          {showMoreMenu && (
            <div className="absolute left-full top-0 ml-2 w-36 py-1.5 bg-slate-800/95 backdrop-blur-sm border border-white/10 rounded-lg shadow-xl z-50">
              <button
                onClick={() => {
                  handleExport();
                  setShowMoreMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
              >
                <Download className="w-4 h-4" />
                <span>导出画布</span>
              </button>
              <button
                onClick={() => {
                  handleImport();
                  setShowMoreMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
              >
                <Upload className="w-4 h-4" />
                <span>导入画布</span>
              </button>
              <div className="my-1 border-t border-white/5" />
              {/* 并发聊天设置 */}
              <button
                onClick={() => {
                  setAllowConcurrentStreaming(!allowConcurrentStreaming);
                  setShowMoreMenu(false);
                }}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-white/5"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[var(--accent-primary)]" />
                  <span className={allowConcurrentStreaming ? 'text-[var(--text-secondary)]' : 'text-[var(--text-tertiary)]'}>
                    并发聊天
                  </span>
                </div>
                <div className={cn(
                  'w-8 h-4 rounded-full transition-colors relative',
                  allowConcurrentStreaming ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-tertiary)]'
                )}>
                  <div className={cn(
                    'absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform',
                    allowConcurrentStreaming ? 'left-4 translate-x-0' : 'left-0.5'
                  )} />
                </div>
              </button>
              {/* 显示当前状态 */}
              {streamingNodeIds.length > 0 && (
                <div className="px-3 py-1.5 text-xs text-slate-500">
                  {streamingNodeIds.length} 个对话进行中
                </div>
              )}
              <div className="my-1 border-t border-white/5" />
              <button
                onClick={() => {
                  if (confirm('确定要清空画布吗？')) {
                    clearCanvas();
                  }
                  setShowMoreMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4" />
                <span>清空画布</span>
              </button>
            </div>
          )}
        </div>
        
        {/* 多选删除 */}
        {selectedNodeIds.size > 0 && (
          <>
            <Divider />
            <div className="relative">
              <div className="w-10 h-10 flex items-center justify-center text-amber-400">
                <span className="text-xs font-bold">{selectedNodeIds.size}</span>
              </div>
              <ToolButton
                icon={Trash2}
                onClick={deleteSelectedNodes}
                title={`删除选中的 ${selectedNodeIds.size} 个节点`}
                danger
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
