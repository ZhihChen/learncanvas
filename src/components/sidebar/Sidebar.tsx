'use client';

/**
 * 侧边栏组件
 * 类似飞书的文件管理侧边栏
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSidebarStore } from '@/store/sidebarStore';
import { cn } from '@/lib/utils';
import type { SidebarItem, FolderItem, CanvasItem } from '@/types';
import { 
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  Plus,
  MoreHorizontal,
  Pin,
  PinOff,
  Lock,
  Unlock,
  Trash2,
  Copy,
  Search,
  Home,
} from 'lucide-react';

interface SidebarProps {
  onSelectCanvas?: (id: string) => void;
}

export function Sidebar({ onSelectCanvas }: SidebarProps) {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const {
    items,
    selectedItemId,
    editingItemId,
    expandedFolders,
    draggedItemId,
    dropTargetId,
    dropPosition,
    searchQuery,
    loadItems,
    createFolder,
    createCanvas,
    selectItem,
    startEditing,
    stopEditing,
    toggleFolder,
    deleteFolder,
    deleteCanvas,
    duplicateCanvas,
    togglePin,
    toggleLock,
    startDrag,
    endDrag,
    setDropTarget,
    moveItem,
    setSearchQuery,
    getChildren,
  } = useSidebarStore();
  
  // 加载数据
  useEffect(() => {
    loadItems();
  }, [loadItems]);
  
  // 快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + N 新建画布
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        createCanvas(selectedItemId?.startsWith('folder-') ? selectedItemId : null);
      }
      // F2 重命名
      if (e.key === 'F2' && selectedItemId) {
        e.preventDefault();
        startEditing(selectedItemId);
      }
      // Delete 删除
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedItemId && !editingItemId) {
        e.preventDefault();
        const item = items.find(i => i.id === selectedItemId);
        if (item?.type === 'canvas') {
          if (confirm(`确定要删除画布 "${item.title}" 吗？`)) {
            deleteCanvas(selectedItemId);
          }
        } else if (item?.type === 'folder') {
          if (confirm(`确定要删除文件夹 "${item.title}" 及其所有内容吗？`)) {
            deleteFolder(selectedItemId);
          }
        }
      }
      // Escape 取消编辑
      if (e.key === 'Escape' && editingItemId) {
        stopEditing();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedItemId, editingItemId, items, createCanvas, startEditing, deleteCanvas, deleteFolder, stopEditing]);
  
  // 打开画布
  const handleOpenCanvas = useCallback((id: string) => {
    router.push(`/canvas/${id}`);
    onSelectCanvas?.(id);
  }, [router, onSelectCanvas]);
  
  // 渲染树形项目
  const renderItems = (parentId: string | null, depth: number = 0) => {
    const children = getChildren(parentId);
    
    return children.map((item) => (
      <SidebarItemComponent
        key={item.id}
        item={item}
        depth={depth}
        isExpanded={expandedFolders.has(item.id)}
        isSelected={selectedItemId === item.id}
        isEditing={editingItemId === item.id}
        isDragged={draggedItemId === item.id}
        isDropTarget={dropTargetId === item.id}
        dropPosition={dropTargetId === item.id ? dropPosition : null}
        onToggle={() => toggleFolder(item.id)}
        onSelect={() => selectItem(item.id)}
        onOpen={() => item.type === 'canvas' && handleOpenCanvas(item.id)}
        onStartEdit={() => startEditing(item.id)}
        onStopEdit={stopEditing}
        onRename={(title) => {
          if (item.type === 'folder') {
            useSidebarStore.getState().renameFolder(item.id, title);
          } else {
            useSidebarStore.getState().renameCanvas(item.id, title);
          }
          stopEditing();
        }}
        onDelete={() => {
          if (item.type === 'canvas') {
            if (confirm(`确定要删除画布 "${item.title}" 吗？`)) {
              deleteCanvas(item.id);
            }
          } else {
            if (confirm(`确定要删除文件夹 "${item.title}" 及其所有内容吗？`)) {
              deleteFolder(item.id);
            }
          }
        }}
        onDuplicate={() => item.type === 'canvas' && duplicateCanvas(item.id)}
        onTogglePin={() => item.type === 'canvas' && togglePin(item.id)}
        onToggleLock={() => item.type === 'canvas' && toggleLock(item.id)}
        onCreateCanvas={() => createCanvas(item.type === 'folder' ? item.id : null)}
        onCreateFolder={() => createFolder(item.type === 'folder' ? item.id : null)}
        onDragStart={() => startDrag(item.id)}
        onDragEnd={endDrag}
        onDragOver={(e, position) => {
          e.preventDefault();
          setDropTarget(item.id, position);
        }}
        onDrop={() => {
          if (draggedItemId && draggedItemId !== item.id && dropPosition) {
            moveItem(draggedItemId, item.id, dropPosition);
          }
          endDrag();
        }}
        renderChildren={() => renderItems(item.id, depth + 1)}
      />
    ));
  };
  
  return (
    <div
      className="flex flex-col h-full"
      style={{
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-primary)'
      }}
    >
      {/* 头部 */}
      <div
        className="flex-shrink-0 p-4"
        style={{ borderBottom: '1px solid var(--border-primary)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 mb-4">
          <div
            className="p-2 flex-shrink-0"
            style={{
              background: 'var(--accent-light)',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <Home className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div>
            <h1
              className="text-base font-semibold"
              style={{
                fontFamily: 'var(--font-noto-sans)',
                color: 'var(--text-primary)'
              }}
            >
              Canvas Chat
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              知识画布管理
            </p>
          </div>
        </div>

        {/* 搜索框 */}
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: 'var(--text-tertiary)' }}
          />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索..."
            className="w-full pl-9 pr-3 py-2 text-sm outline-none transition-all"
            style={{
              background: 'var(--node-bg)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-noto-sans)'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-pink)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(244, 114, 182, 0.15)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-primary)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>
      </div>

      {/* 操作栏 */}
      <div
        className="flex-shrink-0 px-4 py-2 flex items-center gap-2"
        style={{ borderBottom: '1px solid var(--border-primary)' }}
      >
        <button
          onClick={() => createCanvas(null)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm transition-all"
          style={{
            background: 'var(--accent-light)',
            color: 'var(--accent-primary)',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-noto-sans)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(229, 160, 128, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--accent-light)';
          }}
        >
          <Plus className="w-4 h-4" />
          <span>新建画布</span>
        </button>
        <button
          onClick={() => createFolder(null)}
          className="p-1.5 transition-all"
          style={{
            color: 'var(--text-secondary)',
            borderRadius: 'var(--radius-sm)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-primary)';
            e.currentTarget.style.background = 'var(--bg-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.background = 'transparent';
          }}
          title="新建文件夹"
        >
          <Folder className="w-4 h-4" />
        </button>
      </div>
      
      {/* 文件列表 */}
      <div className="flex-1 overflow-y-auto py-2">
        {renderItems(null)}
      </div>
      
      {/* 底部提示 */}
      <div className="flex-shrink-0 px-4 py-3 border-t" style={{ borderColor: 'var(--border-primary)' }}>
        <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          <span>快捷键：</span>
          <span className="ml-2">⌘N 新建</span>
          <span className="mx-1">·</span>
          <span>F2 重命名</span>
          <span className="mx-1">·</span>
          <span>Del 删除</span>
        </div>
      </div>
    </div>
  );
}

// 单个项目组件
interface SidebarItemComponentProps {
  item: SidebarItem;
  depth: number;
  isExpanded: boolean;
  isSelected: boolean;
  isEditing: boolean;
  isDragged: boolean;
  isDropTarget: boolean;
  dropPosition: 'before' | 'after' | 'inside' | null;
  onToggle: () => void;
  onSelect: () => void;
  onOpen: () => void;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onTogglePin: () => void;
  onToggleLock: () => void;
  onCreateCanvas: () => void;
  onCreateFolder: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, position: 'before' | 'after' | 'inside') => void;
  onDrop: () => void;
  renderChildren: () => React.ReactNode;
}

function SidebarItemComponent({
  item,
  depth,
  isExpanded,
  isSelected,
  isEditing,
  isDragged,
  isDropTarget,
  dropPosition,
  onToggle,
  onSelect,
  onOpen,
  onStartEdit,
  onStopEdit,
  onRename,
  onDelete,
  onDuplicate,
  onTogglePin,
  onToggleLock,
  onCreateCanvas,
  onCreateFolder,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  renderChildren,
}: SidebarItemComponentProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRef = useRef<HTMLDivElement>(null);
  
  // 自动聚焦编辑输入框
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);
  
  // 初始化编辑标题
  useEffect(() => {
    setTimeout(() => setEditTitle(item.title), 0);
  }, [item.title]);
  
  const isFolder = item.type === 'folder';
  const canvasItem = item as CanvasItem;
  
  // 处理点击
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // 如果已经选中，进入编辑模式
    if (isSelected && !isEditing) {
      onStartEdit();
    } else {
      onSelect();
    }
  };
  
  // 处理双击
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.type === 'canvas') {
      onOpen();
    } else if (isFolder) {
      onToggle();
    }
  };
  
  // 保存编辑
  const saveEdit = () => {
    if (editTitle.trim()) {
      onRename(editTitle.trim());
    }
    onStopEdit();
  };
  
  // 拖拽处理
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    onDragStart();
  };
  
  const handleDragEnd = () => {
    onDragEnd();
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    if (isFolder) {
      // 文件夹：判断位置
      const rect = itemRef.current?.getBoundingClientRect();
      if (rect) {
        const y = e.clientY - rect.top;
        const height = rect.height;
        
        if (y < height * 0.25) {
          onDragOver(e, 'before');
        } else if (y > height * 0.75) {
          onDragOver(e, 'after');
        } else {
          onDragOver(e, 'inside');
        }
      }
    } else {
      // 画布：只有前后
      const rect = itemRef.current?.getBoundingClientRect();
      if (rect) {
        const y = e.clientY - rect.top;
        onDragOver(e, y < rect.height / 2 ? 'before' : 'after');
      }
    }
  };
  
  const handleDrop = () => {
    onDrop();
  };
  
  return (
    <>
      {/* 拖放指示线 - before */}
      {isDropTarget && dropPosition === 'before' && (
        <div
          className="h-0.5 mx-4 rounded"
          style={{
            marginLeft: `${depth * 16 + 16}px`,
            background: 'var(--accent-primary)'
          }}
        />
      )}

      <div
        ref={itemRef}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        className={cn(
          'group relative flex items-center gap-1 px-2 py-1.5 mx-2 rounded cursor-pointer transition-all',
          isDragged && 'opacity-50',
          isDropTarget && dropPosition === 'inside' && 'bg-[var(--accent-light)]',
          isSelected
            ? 'bg-[var(--accent-light)]'
            : 'hover:bg-[var(--bg-hover)]',
        )}
        style={{
          paddingLeft: `${depth * 16 + 8}px`,
          color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)'
        }}
      >
        {/* 文件夹展开按钮 */}
        {isFolder && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="p-0.5 rounded transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-hover)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-tertiary)';
            }}
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        )}

        {/* 图标 */}
        <span className={cn(
          'flex-shrink-0',
          isFolder
            ? 'text-[var(--text-tertiary)]'
            : 'text-[var(--color-sky)]'
        )}>
          {isFolder ? (
            isExpanded ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />
          ) : (
            <FileText className="w-4 h-4" style={{ color: 'var(--color-sky)' }} />
          )}
        </span>

        {/* 标题 */}
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEdit();
              if (e.key === 'Escape') onStopEdit();
            }}
            className="flex-1 px-1 py-0.5 text-sm outline-none"
            style={{
              background: 'var(--node-bg)',
              border: '1px solid var(--accent-primary)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-noto-sans)'
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 text-sm truncate">{item.title}</span>
        )}

        {/* 状态标记 */}
        {!isEditing && !isFolder && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {canvasItem.isPinned && (
              <Pin className="w-3 h-3" style={{ color: 'var(--accent-primary)' }} />
            )}
            {canvasItem.isLocked && (
              <Lock className="w-3 h-3" style={{ color: 'var(--text-tertiary)' }} />
            )}
          </div>
        )}
        
        {/* 操作按钮 */}
        {!isEditing && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {isFolder && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateCanvas();
                  }}
                  className="p-1 rounded hover:bg-white/10 transition-colors"
                  title="新建画布"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 rounded hover:bg-white/10 transition-colors"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        
        {/* 右键菜单 */}
        {showMenu && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 top-full mt-1 z-50 min-w-36 py-1 bg-slate-800 border border-white/10 rounded-lg shadow-xl">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStartEdit();
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5"
              >
                重命名
              </button>
              
              {!isFolder && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate();
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    复制
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePin();
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5"
                  >
                    {canvasItem.isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                    {canvasItem.isPinned ? '取消置顶' : '置顶'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleLock();
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5"
                  >
                    {canvasItem.isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    {canvasItem.isLocked ? '解锁' : '锁定'}
                  </button>
                </>
              )}
              
              {isFolder && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateFolder();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5"
                >
                  <Folder className="w-3.5 h-3.5" />
                  新建子文件夹
                </button>
              )}
              
              <div className="my-1 border-t border-white/5" />
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-3.5 h-3.5" />
                删除
              </button>
            </div>
          </>
        )}
      </div>
      
      {/* 拖放指示线 - after */}
      {isDropTarget && dropPosition === 'after' && !isFolder && (
        <div
          className="h-0.5 mx-4 bg-blue-500 rounded"
          style={{ marginLeft: `${depth * 16 + 16}px` }}
        />
      )}
      
      {/* 子项 */}
      {isFolder && isExpanded && renderChildren()}
    </>
  );
}
