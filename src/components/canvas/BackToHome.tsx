'use client';

/**
 * 返回主页按钮组件
 * 
 * 缤纷晨光主题优化版
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCanvasStore } from '@/store/canvasStore';
import { useSidebarStore } from '@/store/sidebarStore';
import { 
  ArrowLeft, 
  Home, 
  Save, 
  Edit3,
  Check,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BackToHomeProps {
  canvasId: string;
}

export function BackToHome({ canvasId }: BackToHomeProps) {
  const router = useRouter();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);
  
  const { meta, nodes, edges } = useCanvasStore();
  const { saveCanvasData, renameCanvas } = useSidebarStore();
  
  // 返回主页
  const handleBack = useCallback(() => {
    // 保存当前画布
    saveCanvasData(canvasId, { meta, nodes, edges });
    router.push('/');
  }, [canvasId, meta, nodes, edges, saveCanvasData, router]);
  
  // 开始编辑标题
  const startEditTitle = useCallback(() => {
    setEditTitle(meta.title);
    setIsEditingTitle(true);
  }, [meta.title]);
  
  // 保存标题
  const saveTitle = useCallback(() => {
    if (editTitle.trim()) {
      renameCanvas(canvasId, editTitle.trim());
    }
    setIsEditingTitle(false);
  }, [canvasId, editTitle, renameCanvas]);
  
  // 取消编辑
  const cancelEdit = useCallback(() => {
    setIsEditingTitle(false);
    setEditTitle('');
  }, []);
  
  // 手动保存
  const handleSave = useCallback(() => {
    saveCanvasData(canvasId, { meta, nodes, edges });
    setShowSaveIndicator(true);
    setTimeout(() => setShowSaveIndicator(false), 2000);
  }, [canvasId, meta, nodes, edges, saveCanvasData]);
  
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <div 
        className="flex items-center gap-2 px-3 py-2 rounded-full"
        style={{
          background: 'var(--node-bg)',
          border: '1px solid var(--border-primary)',
          boxShadow: 'var(--shadow-colorful)',
        }}
      >
        {/* 返回按钮 */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-hover)';
            e.currentTarget.style.color = 'var(--accent-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          title="返回主页"
        >
          <ArrowLeft className="w-4 h-4" />
          <Home className="w-4 h-4" />
        </button>
        
        <div 
          className="w-px h-5"
          style={{ background: 'var(--border-primary)' }}
        />
        
        {/* 画布标题 */}
        {isEditingTitle ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveTitle();
                if (e.key === 'Escape') cancelEdit();
              }}
              className="w-48 px-2 py-1 text-sm outline-none rounded"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--accent-primary)',
                color: 'var(--text-primary)',
              }}
              autoFocus
            />
            <button
              onClick={saveTitle}
              className="p-1 rounded transition-colors"
              style={{ color: 'var(--color-success)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(15, 123, 108, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={cancelEdit}
              className="p-1 rounded transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={startEditTitle}
            className="flex items-center gap-2 px-2 py-1 rounded-lg transition-all duration-200 group"
            style={{ color: 'var(--text-primary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            title="点击编辑标题"
          >
            <span 
              className="text-sm font-medium max-w-40 truncate"
              style={{ fontFamily: 'var(--font-noto-sans)' }}
            >
              {meta.title}
            </span>
            <Edit3 
              className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" 
              style={{ color: 'var(--text-tertiary)' }}
            />
          </button>
        )}
        
        <div 
          className="w-px h-5"
          style={{ background: 'var(--border-primary)' }}
        />
        
        {/* 保存状态 */}
        {showSaveIndicator ? (
          <div 
            className="flex items-center gap-1.5 px-2 py-1"
            style={{ color: 'var(--color-success)' }}
          >
            <Check className="w-3.5 h-3.5" />
            <span className="text-xs">已保存</span>
          </div>
        ) : (
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all duration-200"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            title="手动保存"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="text-xs">保存</span>
          </button>
        )}
        
        {/* 统计信息 */}
        <div 
          className="flex items-center gap-2 px-2 text-xs"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <span>{nodes.length} 节点</span>
          <span style={{ color: 'var(--border-secondary)' }}>·</span>
          <span>{nodes.reduce((acc, n) => acc + (n.data.messages?.length || 0), 0)} 消息</span>
        </div>
      </div>
    </div>
  );
}
