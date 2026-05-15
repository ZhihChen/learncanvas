'use client';

/**
 * 主页 - 画布管理
 * 左侧侧边栏 + 右侧内容区
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { useSidebarStore } from '@/store/sidebarStore';
import { cn } from '@/lib/utils';
import {
  FileText,
  MessageSquare,
  Clock,
  Plus,
  Sparkles,
  LayoutGrid,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { items, selectedItemId, getItem, getCanvasData, createCanvas } = useSidebarStore();
  
  // 获取选中的项目
  const selectedItem = selectedItemId ? getItem(selectedItemId) : null;
  const selectedCanvasData = selectedItem?.type === 'canvas' && selectedItemId 
    ? getCanvasData(selectedItemId) 
    : null;
  
  // 打开画布
  const handleOpenCanvas = (id: string) => {
    router.push(`/canvas/${id}`);
  };
  
  // 新建画布
  const handleCreateCanvas = () => {
    const id = createCanvas(null);
    router.push(`/canvas/${id}`);
  };
  
  // 统计信息
  const totalCanvases = items.filter(i => i.type === 'canvas').length;
  const totalFolders = items.filter(i => i.type === 'folder').length;
  const totalNodes = items.reduce((acc, item) => {
    if (item.type === 'canvas') {
      return acc + (item as any).nodeCount || 0;
    }
    return acc;
  }, 0);
  
  return (
    <div className="flex h-screen overflow-hidden page-enter" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* 左侧侧边栏 */}
      <div className="w-72 flex-shrink-0 animate-slide-in-left stagger-delay-1">
        <Sidebar onSelectCanvas={handleOpenCanvas} />
      </div>

      {/* 右侧内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部栏 */}
        <header className="flex-shrink-0 px-8 py-6 border-b animate-fade-in-up stagger-delay-2" style={{ borderColor: 'var(--border-primary)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-noto-serif)', color: 'var(--text-primary)' }}>
                {selectedItem ? selectedItem.title : '欢迎使用 Canvas Chat'}
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
                {selectedItem
                  ? (selectedItem.type === 'folder'
                      ? '管理你的知识画布'
                      : '点击打开进行编辑')
                  : '将碎片化的AI对话转化为结构化的知识画布'
                }
              </p>
            </div>

            {/* 统计信息 - 缤纷多彩 + 动画 */}
            <div className="flex items-center gap-8 text-sm">
              <div className="text-center animate-fade-in-scale stagger-delay-3">
                <div className="text-2xl font-semibold" style={{ color: 'var(--accent-primary)' }}>{totalCanvases}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>画布</div>
              </div>
              <div className="text-center animate-fade-in-scale stagger-delay-4">
                <div className="text-2xl font-semibold" style={{ color: 'var(--color-lavender)' }}>{totalFolders}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>文件夹</div>
              </div>
              <div className="text-center animate-fade-in-scale stagger-delay-5">
                <div className="text-2xl font-semibold" style={{ color: 'var(--color-mint)' }}>{totalNodes}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>节点</div>
              </div>
            </div>
          </div>
        </header>

        {/* 主内容区 */}
        <main className="flex-1 overflow-y-auto p-8" style={{ background: 'var(--bg-secondary)' }}>
          {selectedItem ? (
            // 选中了项目
            selectedItem.type === 'canvas' ? (
              // 选中画布 - 显示预览卡片
              <div className="max-w-2xl animate-fade-in-up stagger-delay-3">
                <div
                  onClick={() => handleOpenCanvas(selectedItem.id)}
                  className="group p-6 cursor-pointer card-hover-shimmer node-hover-lift btn-press"
                  style={{
                    background: 'var(--node-bg)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 'var(--radius-lg)',
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="p-4 flex-shrink-0 transition-colors"
                      style={{
                        background: 'var(--node-bg)',
                        borderRadius: 'var(--radius-lg)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-hover)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--node-bg)';
                      }}
                    >
                      <FileText className="w-8 h-8" style={{ color: 'var(--color-sky)' }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'var(--font-noto-sans)', color: 'var(--text-primary)' }}>
                        {selectedItem.title}
                      </h3>
                      <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>
                        {(selectedItem as any).description || '暂无描述'}
                      </p>
                      <div className="flex items-center gap-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <span className="flex items-center gap-1.5">
                          <MessageSquare className="w-4 h-4" />
                          {(selectedItem as any).nodeCount || 0} 节点
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          {new Date(selectedItem.updatedAt).toLocaleString('zh-CN')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex items-center justify-end">
                    <span
                      className="text-sm transition-colors"
                      style={{ color: 'var(--accent-primary)' }}
                    >
                      点击打开编辑 →
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              // 选中文件夹 - 显示文件夹内容
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up stagger-delay-3">
                {/* 新建按钮 - 流光边框 */}
                <button
                  onClick={handleCreateCanvas}
                  className="p-6 border-2 border-dashed transition-all group border-flowing-gradient btn-hover-3d btn-press"
                  style={{
                    borderColor: 'var(--border-secondary)',
                    color: 'var(--text-tertiary)',
                    borderRadius: 'var(--radius-xl)'
                  }}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div
                      className="p-3 transition-colors"
                      style={{
                        background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-lg)'
                      }}
                    >
                      <Plus className="w-6 h-6" />
                    </div>
                    <span className="text-sm">在此文件夹新建画布</span>
                  </div>
                </button>

                {/* 文件夹内的画布 - 列表项入场动画 */}
                {useSidebarStore.getState().getChildren(selectedItem.id)
                  .filter(item => item.type === 'canvas')
                  .map((canvas, index) => (
                    <div
                      key={canvas.id}
                      onClick={() => handleOpenCanvas(canvas.id)}
                      className="group p-5 cursor-pointer list-item-enter card-hover-shimmer btn-press"
                      style={{
                        background: 'var(--node-bg)',
                        border: '1px solid var(--border-primary)',
                        borderRadius: 'var(--radius-lg)',
                        animationDelay: `${(index + 1) * 0.08}s`
                      }}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <FileText className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-lavender)' }} />
                        <h4 className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>{canvas.title}</h4>
                      </div>
                      <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        <span>{(canvas as any).nodeCount || 0} 节点</span>
                        <span>{new Date(canvas.updatedAt).toLocaleDateString('zh-CN')}</span>
                      </div>
                    </div>
                  ))}
              </div>
            )
          ) : (
            // 没有选中 - 显示欢迎页
            <div className="flex flex-col items-center justify-center h-full">
              <div
                className="w-24 h-24 mb-8 flex items-center justify-center animate-float-rotate animate-pulse-glow"
                style={{
                  background: 'var(--node-bg)',
                  borderRadius: 'var(--radius-xl)',
                  boxShadow: 'var(--shadow-colorful-glow)'
                }}
              >
                <Sparkles className="w-10 h-10 icon-hover-pop" style={{ color: 'var(--accent-primary)' }} />
              </div>

              <h2 className="text-3xl font-semibold mb-3 animate-fade-in-up stagger-delay-1" style={{ fontFamily: 'var(--font-noto-serif)', color: 'var(--text-primary)' }}>
                开始构建你的知识体系
              </h2>
              <p className="text-center max-w-md mb-8 animate-fade-in-up stagger-delay-2" style={{ color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
                Canvas Chat 帮助你将碎片化的AI对话转化为结构化的知识画布，
                每个对话节点可独立交互，通过连线实现上下文传递。
              </p>

              <div className="flex items-center gap-4 animate-fade-in-up stagger-delay-3">
                <button
                  onClick={handleCreateCanvas}
                  className="flex items-center gap-2 px-6 py-3 text-white btn-hover-3d btn-press btn-ripple"
                  style={{
                    background: 'var(--accent-primary)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-colorful)'
                  }}
                >
                  <Plus className="w-5 h-5 icon-hover-pop" />
                  <span className="font-medium">创建第一个画布</span>
                </button>
                <button
                  onClick={() => useSidebarStore.getState().createFolder(null)}
                  className="flex items-center gap-2 px-6 py-3 btn-hover-3d btn-press"
                  style={{
                    background: 'var(--node-bg)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <LayoutGrid className="w-5 h-5 icon-hover-pop" />
                  <span>新建文件夹</span>
                </button>
              </div>

              {/* 快捷键提示 - 流光效果 */}
              <div className="mt-12 flex items-center gap-8 text-sm animate-fade-in-up stagger-delay-4" style={{ color: 'var(--text-tertiary)' }}>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 rounded glass-shine" style={{ background: 'var(--node-bg)', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)' }}>⌘N</kbd>
                  <span>新建画布</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 rounded glass-shine" style={{ background: 'var(--node-bg)', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)' }}>F2</kbd>
                  <span>重命名</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 rounded glass-shine" style={{ background: 'var(--node-bg)', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)' }}>Del</kbd>
                  <span>删除</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 rounded glass-shine" style={{ background: 'var(--node-bg)', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)' }}>拖拽</kbd>
                  <span>移动排序</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
