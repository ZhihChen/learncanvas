'use client';

/**
 * 画布编辑页面
 * 支持按ID加载画布，自动保存
 */

import { useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Canvas } from '@/components/canvas/Canvas';
import { useSidebarStore } from '@/store/sidebarStore';
import { useCanvasStore } from '@/store/canvasStore';

export default function CanvasPage() {
  const params = useParams();
  const router = useRouter();
  const canvasId = params.id as string;
  const lastSaveRef = useRef<number>(0);
  const isLoadedRef = useRef<boolean>(false);
  
  const { getCanvasData, saveCanvasData, getItem, selectItem } = useSidebarStore();
  const { importCanvas, nodes, edges, meta } = useCanvasStore();
  
  // 加载画布数据
  useEffect(() => {
    if (!canvasId) return;
    
    const data = getCanvasData(canvasId);
    if (data) {
      importCanvas({
        meta: data.meta,
        nodes: data.nodes,
        edges: data.edges,
      });
      selectItem(canvasId);
      isLoadedRef.current = true;
    } else {
      // 画布不存在，返回主页
      router.push('/');
    }
  }, [canvasId]); // 只在canvasId变化时执行
  
  // 防抖保存
  useEffect(() => {
    if (!canvasId || !isLoadedRef.current) return;
    
    const now = Date.now();
    if (now - lastSaveRef.current < 1000) return; // 至少间隔1秒
    
    const timer = setTimeout(() => {
      const state = useCanvasStore.getState();
      saveCanvasData(canvasId, { 
        meta: state.meta, 
        nodes: state.nodes, 
        edges: state.edges 
      });
      lastSaveRef.current = Date.now();
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [nodes, edges, meta, canvasId, saveCanvasData]);
  
  // 页面离开时保存
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!isLoadedRef.current) return;
      const state = useCanvasStore.getState();
      saveCanvasData(canvasId, { 
        meta: state.meta, 
        nodes: state.nodes, 
        edges: state.edges 
      });
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [canvasId, saveCanvasData]);
  
  return (
    <main className="w-screen h-screen overflow-hidden bg-[var(--bg-primary)]">
      {/* 画布主体 */}
      <Canvas canvasId={canvasId} />
    </main>
  );
}
