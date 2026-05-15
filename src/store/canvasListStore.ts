/**
 * 画布列表管理 - Zustand Store
 * 管理多个画布的创建、删除、切换
 */

import { create } from 'zustand';
import { 
  CanvasSummary, 
  CanvasData, 
  ChatNode, 
  ChatEdge,
  STORAGE_KEYS 
} from '@/types';

// ==================== 工具函数 ====================

const generateId = () => `canvas_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// 加载画布列表
const loadCanvasList = (): CanvasSummary[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CANVAS_LIST);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load canvas list:', error);
  }
  return [];
};

// 保存画布列表
const saveCanvasList = (list: CanvasSummary[]) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEYS.CANVAS_LIST, JSON.stringify(list));
  } catch (error) {
    console.error('Failed to save canvas list:', error);
  }
};

// 加载单个画布数据
const loadCanvasData = (id: string): CanvasData | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(`canvas-${id}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load canvas data:', error);
  }
  return null;
};

// 保存单个画布数据
const saveCanvasData = (id: string, data: CanvasData) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(`canvas-${id}`, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save canvas data:', error);
  }
};

// 删除单个画布数据
const deleteCanvasData = (id: string) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(`canvas-${id}`);
  } catch (error) {
    console.error('Failed to delete canvas data:', error);
  }
};

// ==================== Store 定义 ====================

interface CanvasListStore {
  // 状态
  canvases: CanvasSummary[];
  currentCanvasId: string | null;
  sortBy: 'updatedAt' | 'createdAt' | 'title';
  sortOrder: 'asc' | 'desc';
  searchQuery: string;
  viewMode: 'grid' | 'list';
  
  // 操作
  loadList: () => void;
  createCanvas: (title?: string, description?: string) => string;
  deleteCanvas: (id: string) => void;
  duplicateCanvas: (id: string) => string | null;
  renameCanvas: (id: string, title: string) => void;
  updateCanvasDescription: (id: string, description: string) => void;
  togglePin: (id: string) => void;
  toggleLock: (id: string) => void;
  setCurrentCanvas: (id: string | null) => void;
  updateCanvasStats: (id: string, nodeCount: number, messageCount: number) => void;
  setSortBy: (sortBy: 'updatedAt' | 'createdAt' | 'title') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  setSearchQuery: (query: string) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  
  // 画布数据操作
  getCanvasData: (id: string) => CanvasData | null;
  saveCanvasData: (id: string, data: CanvasData) => void;
}

export const useCanvasListStore = create<CanvasListStore>((set, get) => ({
  // 初始状态
  canvases: [],
  currentCanvasId: null,
  sortBy: 'updatedAt',
  sortOrder: 'desc',
  searchQuery: '',
  viewMode: 'grid',
  
  // 加载列表
  loadList: () => {
    const list = loadCanvasList();
    set({ canvases: list });
  },
  
  // 创建画布
  createCanvas: (title = '未命名画布', description = '') => {
    const id = generateId();
    const now = Date.now();
    
    const summary: CanvasSummary = {
      id,
      title,
      description,
      icon: '📝',
      createdAt: now,
      updatedAt: now,
      nodeCount: 0,
      messageCount: 0,
      isPinned: false,
      isLocked: false,
    };
    
    // 初始画布数据
    const data: CanvasData = {
      meta: {
        id,
        title,
        description,
        createdAt: now,
        updatedAt: now,
      },
      nodes: [],
      edges: [],
    };
    
    // 保存
    saveCanvasData(id, data);
    
    set((state) => {
      const newList = [summary, ...state.canvases];
      saveCanvasList(newList);
      return { canvases: newList };
    });
    
    return id;
  },
  
  // 删除画布
  deleteCanvas: (id) => {
    set((state) => {
      const newList = state.canvases.filter(c => c.id !== id);
      saveCanvasList(newList);
      deleteCanvasData(id);
      return { 
        canvases: newList,
        currentCanvasId: state.currentCanvasId === id ? null : state.currentCanvasId
      };
    });
  },
  
  // 复制画布
  duplicateCanvas: (id) => {
    const originalData = loadCanvasData(id);
    const originalSummary = get().canvases.find(c => c.id === id);
    
    if (!originalData || !originalSummary) return null;
    
    const newId = generateId();
    const now = Date.now();
    const newTitle = `${originalSummary.title} (副本)`;
    
    const newSummary: CanvasSummary = {
      ...originalSummary,
      id: newId,
      title: newTitle,
      createdAt: now,
      updatedAt: now,
      isPinned: false,
      isLocked: false,
    };
    
    const newData: CanvasData = {
      ...originalData,
      meta: {
        ...originalData.meta,
        id: newId,
        title: newTitle,
        createdAt: now,
        updatedAt: now,
      },
      // 重新生成节点ID
      nodes: originalData.nodes.map(node => ({
        ...node,
        id: `${node.id}-copy-${now}`,
        data: { ...node.data },
      })),
      // 重新生成连线ID并映射新的节点ID
      edges: [],
    };
    
    // 创建ID映射
    const idMap = new Map<string, string>();
    originalData.nodes.forEach((node, i) => {
      idMap.set(node.id, newData.nodes[i].id);
    });
    
    // 映射连线
    newData.edges = originalData.edges
      .filter(edge => idMap.has(edge.source) && idMap.has(edge.target))
      .map(edge => ({
        ...edge,
        id: `${edge.id}-copy-${now}`,
        source: idMap.get(edge.source)!,
        target: idMap.get(edge.target)!,
      }));
    
    // 保存
    saveCanvasData(newId, newData);
    
    set((state) => {
      const newList = [newSummary, ...state.canvases];
      saveCanvasList(newList);
      return { canvases: newList };
    });
    
    return newId;
  },
  
  // 重命名
  renameCanvas: (id, title) => {
    set((state) => {
      const newList = state.canvases.map(c => 
        c.id === id ? { ...c, title, updatedAt: Date.now() } : c
      );
      saveCanvasList(newList);
      
      // 同时更新画布数据
      const data = loadCanvasData(id);
      if (data) {
        data.meta.title = title;
        data.meta.updatedAt = Date.now();
        saveCanvasData(id, data);
      }
      
      return { canvases: newList };
    });
  },
  
  // 更新描述
  updateCanvasDescription: (id, description) => {
    set((state) => {
      const newList = state.canvases.map(c => 
        c.id === id ? { ...c, description, updatedAt: Date.now() } : c
      );
      saveCanvasList(newList);
      
      // 同时更新画布数据
      const data = loadCanvasData(id);
      if (data) {
        data.meta.description = description;
        data.meta.updatedAt = Date.now();
        saveCanvasData(id, data);
      }
      
      return { canvases: newList };
    });
  },
  
  // 切换置顶
  togglePin: (id) => {
    set((state) => {
      const newList = state.canvases.map(c => 
        c.id === id ? { ...c, isPinned: !c.isPinned, updatedAt: Date.now() } : c
      );
      saveCanvasList(newList);
      return { canvases: newList };
    });
  },
  
  // 切换锁定
  toggleLock: (id) => {
    set((state) => {
      const newList = state.canvases.map(c => 
        c.id === id ? { ...c, isLocked: !c.isLocked, updatedAt: Date.now() } : c
      );
      saveCanvasList(newList);
      return { canvases: newList };
    });
  },
  
  // 设置当前画布
  setCurrentCanvas: (id) => {
    set({ currentCanvasId: id });
  },
  
  // 更新画布统计
  updateCanvasStats: (id, nodeCount, messageCount) => {
    set((state) => {
      const newList = state.canvases.map(c => 
        c.id === id ? { ...c, nodeCount, messageCount, updatedAt: Date.now() } : c
      );
      saveCanvasList(newList);
      return { canvases: newList };
    });
  },
  
  // 设置排序方式
  setSortBy: (sortBy) => {
    set({ sortBy });
  },
  
  // 设置排序顺序
  setSortOrder: (sortOrder) => {
    set({ sortOrder });
  },
  
  // 设置搜索关键词
  setSearchQuery: (searchQuery) => {
    set({ searchQuery });
  },
  
  // 设置视图模式
  setViewMode: (viewMode) => {
    set({ viewMode });
  },
  
  // 获取画布数据
  getCanvasData: (id) => {
    return loadCanvasData(id);
  },
  
  // 保存画布数据
  saveCanvasData: (id, data) => {
    saveCanvasData(id, data);
    
    // 更新列表中的统计
    const nodeCount = data.nodes.length;
    const messageCount = data.nodes.reduce((acc, n) => acc + (n.data.messages?.length || 0), 0);
    
    set((state) => {
      const newList = state.canvases.map(c => 
        c.id === id ? { 
          ...c, 
          title: data.meta.title,
          description: data.meta.description,
          nodeCount, 
          messageCount, 
          updatedAt: Date.now() 
        } : c
      );
      saveCanvasList(newList);
      return { canvases: newList };
    });
  },
}));
