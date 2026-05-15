/**
 * 侧边栏管理 - Zustand Store
 * 管理文件夹和画布的层级结构，支持拖拽排序
 */

import { create } from 'zustand';
import { 
  SidebarItem, 
  FolderItem, 
  CanvasItem,
  STORAGE_KEYS,
  CanvasData,
  ChatNode,
  ChatEdge,
} from '@/types';

// ==================== 工具函数 ====================

const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// 加载侧边栏数据
const loadSidebarItems = (): SidebarItem[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SIDEBAR_STATE);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load sidebar items:', error);
  }
  return [];
};

// 保存侧边栏数据
const saveSidebarItems = (items: SidebarItem[]) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEYS.SIDEBAR_STATE, JSON.stringify(items));
  } catch (error) {
    console.error('Failed to save sidebar items:', error);
  }
};

// 加载画布数据
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

// 保存画布数据
const saveCanvasData = (id: string, data: CanvasData) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(`canvas-${id}`, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save canvas data:', error);
  }
};

// 删除画布数据
const deleteCanvasData = (id: string) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(`canvas-${id}`);
  } catch (error) {
    console.error('Failed to delete canvas data:', error);
  }
};

// ==================== Store 定义 ====================

interface SidebarStore {
  // 状态
  items: SidebarItem[];
  selectedItemId: string | null;
  editingItemId: string | null;
  expandedFolders: Set<string>;
  draggedItemId: string | null;
  dropTargetId: string | null;
  dropPosition: 'before' | 'after' | 'inside' | null;
  searchQuery: string;
  
  // 加载
  loadItems: () => void;
  
  // 文件夹操作
  createFolder: (parentId: string | null, title?: string) => string;
  renameFolder: (id: string, title: string) => void;
  deleteFolder: (id: string) => void;
  toggleFolder: (id: string) => void;
  expandFolder: (id: string) => void;
  collapseFolder: (id: string) => void;
  
  // 画布操作
  createCanvas: (parentId: string | null, title?: string) => string;
  renameCanvas: (id: string, title: string) => void;
  deleteCanvas: (id: string) => void;
  duplicateCanvas: (id: string) => string | null;
  togglePin: (id: string) => void;
  toggleLock: (id: string) => void;
  
  // 选择和编辑
  selectItem: (id: string | null) => void;
  startEditing: (id: string) => void;
  stopEditing: () => void;
  
  // 拖拽
  startDrag: (id: string) => void;
  endDrag: () => void;
  setDropTarget: (targetId: string | null, position: 'before' | 'after' | 'inside' | null) => void;
  moveItem: (itemId: string, targetId: string | null, position: 'before' | 'after' | 'inside') => void;
  
  // 搜索
  setSearchQuery: (query: string) => void;
  
  // 工具方法
  getItem: (id: string) => SidebarItem | undefined;
  getChildren: (parentId: string | null) => SidebarItem[];
  getCanvasData: (id: string) => CanvasData | null;
  saveCanvasData: (id: string, data: CanvasData) => void;
  getBreadcrumb: (id: string) => SidebarItem[];
  getTreeItems: () => SidebarItem[]; // 获取排序后的树形结构
}

export const useSidebarStore = create<SidebarStore>((set, get) => ({
  // 初始状态
  items: [],
  selectedItemId: null,
  editingItemId: null,
  expandedFolders: new Set<string>(),
  draggedItemId: null,
  dropTargetId: null,
  dropPosition: null,
  searchQuery: '',
  
  // 加载
  loadItems: () => {
    const items = loadSidebarItems();
    
    // 如果没有任何项目，创建默认文件夹
    if (items.length === 0) {
      const now = Date.now();
      const defaultFolder: FolderItem = {
        id: `folder-${now}`,
        type: 'folder',
        title: '我的画布',
        parentId: null,
        createdAt: now,
        updatedAt: now,
        sortOrder: 0,
        isExpanded: true,
      };
      saveSidebarItems([defaultFolder]);
      set({ items: [defaultFolder], expandedFolders: new Set([defaultFolder.id]) });
    } else {
      // 恢复展开状态
      const expandedIds = new Set<string>();
      items.forEach(item => {
        if (item.type === 'folder' && (item as FolderItem).isExpanded) {
          expandedIds.add(item.id);
        }
      });
      set({ items, expandedFolders: expandedIds });
    }
  },
  
  // 创建文件夹
  createFolder: (parentId, title = '新建文件夹') => {
    const now = Date.now();
    const siblings = get().getChildren(parentId);
    const maxSortOrder = siblings.length > 0 ? Math.max(...siblings.map(s => s.sortOrder)) : -1;
    
    const newFolder: FolderItem = {
      id: `folder-${generateId()}`,
      type: 'folder',
      title,
      parentId,
      createdAt: now,
      updatedAt: now,
      sortOrder: maxSortOrder + 1,
      isExpanded: true,
    };
    
    set((state) => {
      const newItems = [...state.items, newFolder];
      saveSidebarItems(newItems);
      return { 
        items: newItems, 
        editingItemId: newFolder.id,
        expandedFolders: new Set([...state.expandedFolders, newFolder.id])
      };
    });
    
    return newFolder.id;
  },
  
  // 重命名文件夹
  renameFolder: (id, title) => {
    set((state) => {
      const newItems = state.items.map(item => 
        item.id === id && item.type === 'folder'
          ? { ...item, title, updatedAt: Date.now() }
          : item
      );
      saveSidebarItems(newItems);
      return { items: newItems };
    });
  },
  
  // 删除文件夹（递归删除子项）
  deleteFolder: (id) => {
    set((state) => {
      // 获取所有子项ID
      const getDescendantIds = (folderId: string): string[] => {
        const children = state.items.filter(item => item.parentId === folderId);
        const ids: string[] = [folderId];
        children.forEach(child => {
          if (child.type === 'folder') {
            ids.push(...getDescendantIds(child.id));
          } else {
            ids.push(child.id);
            deleteCanvasData(child.id);
          }
        });
        return ids;
      };
      
      const idsToDelete = getDescendantIds(id);
      const newItems = state.items.filter(item => !idsToDelete.includes(item.id));
      saveSidebarItems(newItems);
      
      return { 
        items: newItems,
        selectedItemId: state.selectedItemId && idsToDelete.includes(state.selectedItemId) 
          ? null 
          : state.selectedItemId
      };
    });
  },
  
  // 切换文件夹展开状态
  toggleFolder: (id) => {
    set((state) => {
      const newExpanded = new Set(state.expandedFolders);
      if (newExpanded.has(id)) {
        newExpanded.delete(id);
      } else {
        newExpanded.add(id);
      }
      
      // 更新 isExpanded 属性
      const newItems = state.items.map(item =>
        item.id === id && item.type === 'folder'
          ? { ...item, isExpanded: newExpanded.has(id) }
          : item
      );
      saveSidebarItems(newItems);
      
      return { expandedFolders: newExpanded, items: newItems };
    });
  },
  
  // 展开文件夹
  expandFolder: (id) => {
    set((state) => {
      if (state.expandedFolders.has(id)) return state;
      const newExpanded = new Set(state.expandedFolders);
      newExpanded.add(id);
      return { expandedFolders: newExpanded };
    });
  },
  
  // 折叠文件夹
  collapseFolder: (id) => {
    set((state) => {
      const newExpanded = new Set(state.expandedFolders);
      newExpanded.delete(id);
      return { expandedFolders: newExpanded };
    });
  },
  
  // 创建画布
  createCanvas: (parentId, title = '新画布') => {
    const now = Date.now();
    const siblings = get().getChildren(parentId);
    const maxSortOrder = siblings.length > 0 ? Math.max(...siblings.map(s => s.sortOrder)) : -1;
    
    const newCanvas: CanvasItem = {
      id: `canvas-${generateId()}`,
      type: 'canvas',
      title,
      parentId,
      createdAt: now,
      updatedAt: now,
      sortOrder: maxSortOrder + 1,
      nodeCount: 0,
      messageCount: 0,
    };
    
    // 创建空画布数据
    const canvasData: CanvasData = {
      meta: {
        id: newCanvas.id,
        title,
        createdAt: now,
        updatedAt: now,
      },
      nodes: [],
      edges: [],
    };
    saveCanvasData(newCanvas.id, canvasData);
    
    set((state) => {
      const newItems = [...state.items, newCanvas];
      saveSidebarItems(newItems);
      return { items: newItems, editingItemId: newCanvas.id };
    });
    
    return newCanvas.id;
  },
  
  // 重命名画布
  renameCanvas: (id, title) => {
    set((state) => {
      const newItems = state.items.map(item =>
        item.id === id && item.type === 'canvas'
          ? { ...item, title, updatedAt: Date.now() }
          : item
      );
      saveSidebarItems(newItems);
      
      // 同时更新画布数据
      const data = loadCanvasData(id);
      if (data) {
        data.meta.title = title;
        data.meta.updatedAt = Date.now();
        saveCanvasData(id, data);
      }
      
      return { items: newItems };
    });
  },
  
  // 删除画布
  deleteCanvas: (id) => {
    set((state) => {
      const newItems = state.items.filter(item => item.id !== id);
      saveSidebarItems(newItems);
      deleteCanvasData(id);
      
      return { 
        items: newItems,
        selectedItemId: state.selectedItemId === id ? null : state.selectedItemId
      };
    });
  },
  
  // 复制画布
  duplicateCanvas: (id) => {
    const original = get().items.find(item => item.id === id && item.type === 'canvas') as CanvasItem | undefined;
    const originalData = loadCanvasData(id);
    
    if (!original || !originalData) return null;
    
    const now = Date.now();
    const siblings = get().getChildren(original.parentId);
    const maxSortOrder = siblings.length > 0 ? Math.max(...siblings.map(s => s.sortOrder)) : -1;
    
    const newId = `canvas-${generateId()}`;
    const newTitle = `${original.title} (副本)`;
    
    const newCanvas: CanvasItem = {
      ...original,
      id: newId,
      title: newTitle,
      createdAt: now,
      updatedAt: now,
      sortOrder: maxSortOrder + 1,
    };
    
    // 复制画布数据，重映射节点ID
    const idMap = new Map<string, string>();
    const newNodes: ChatNode[] = originalData.nodes.map(node => {
      const newNodeId = `${node.id}-copy-${now}`;
      idMap.set(node.id, newNodeId);
      return {
        ...node,
        id: newNodeId,
        data: { ...node.data },
      };
    });
    
    const newEdges: ChatEdge[] = originalData.edges
      .filter(edge => idMap.has(edge.source) && idMap.has(edge.target))
      .map(edge => ({
        ...edge,
        id: `${edge.id}-copy-${now}`,
        source: idMap.get(edge.source)!,
        target: idMap.get(edge.target)!,
      }));
    
    const newData: CanvasData = {
      meta: {
        id: newId,
        title: newTitle,
        createdAt: now,
        updatedAt: now,
      },
      nodes: newNodes,
      edges: newEdges,
    };
    
    saveCanvasData(newId, newData);
    
    set((state) => {
      const newItems = [...state.items, newCanvas];
      saveSidebarItems(newItems);
      return { items: newItems };
    });
    
    return newId;
  },
  
  // 切换置顶
  togglePin: (id) => {
    set((state) => {
      const newItems = state.items.map(item =>
        item.id === id && item.type === 'canvas'
          ? { ...item, isPinned: !item.isPinned, updatedAt: Date.now() }
          : item
      );
      saveSidebarItems(newItems);
      return { items: newItems };
    });
  },
  
  // 切换锁定
  toggleLock: (id) => {
    set((state) => {
      const newItems = state.items.map(item =>
        item.id === id && item.type === 'canvas'
          ? { ...item, isLocked: !item.isLocked, updatedAt: Date.now() }
          : item
      );
      saveSidebarItems(newItems);
      return { items: newItems };
    });
  },
  
  // 选择项目
  selectItem: (id) => {
    set({ selectedItemId: id });
  },
  
  // 开始编辑
  startEditing: (id) => {
    set({ editingItemId: id });
  },
  
  // 停止编辑
  stopEditing: () => {
    set({ editingItemId: null });
  },
  
  // 开始拖拽
  startDrag: (id) => {
    set({ draggedItemId: id });
  },
  
  // 结束拖拽
  endDrag: () => {
    set({ draggedItemId: null, dropTargetId: null, dropPosition: null });
  },
  
  // 设置拖放目标
  setDropTarget: (targetId, position) => {
    set({ dropTargetId: targetId, dropPosition: position });
  },
  
  // 移动项目
  moveItem: (itemId, targetId, position) => {
    set((state) => {
      const item = state.items.find(i => i.id === itemId);
      if (!item) return state;
      
      let newParentId: string | null;
      let newSortOrder: number;
      
      if (position === 'inside') {
        // 放入文件夹内
        newParentId = targetId;
        const siblings = state.items.filter(i => i.parentId === targetId);
        newSortOrder = siblings.length > 0 ? Math.max(...siblings.map(s => s.sortOrder)) + 1 : 0;
      } else {
        // 放在目标前后
        const target = state.items.find(i => i.id === targetId);
        if (!target) return state;
        
        newParentId = target.parentId;
        const siblings = state.items.filter(i => i.parentId === newParentId);
        const targetIndex = siblings.findIndex(s => s.id === targetId);
        
        if (position === 'before') {
          newSortOrder = targetIndex > 0 
            ? (siblings[targetIndex - 1].sortOrder + target.sortOrder) / 2 
            : target.sortOrder - 1;
        } else {
          newSortOrder = targetIndex < siblings.length - 1
            ? (target.sortOrder + siblings[targetIndex + 1].sortOrder) / 2
            : target.sortOrder + 1;
        }
      }
      
      const newItems = state.items.map(i =>
        i.id === itemId
          ? { ...i, parentId: newParentId, sortOrder: newSortOrder, updatedAt: Date.now() }
          : i
      );
      
      saveSidebarItems(newItems);
      return { items: newItems };
    });
  },
  
  // 设置搜索关键词
  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },
  
  // 获取项目
  getItem: (id) => {
    return get().items.find(item => item.id === id);
  },
  
  // 获取子项
  getChildren: (parentId) => {
    return get().items
      .filter(item => item.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },
  
  // 获取画布数据
  getCanvasData: (id) => {
    return loadCanvasData(id);
  },
  
  // 保存画布数据
  saveCanvasData: (id, data) => {
    saveCanvasData(id, data);
    
    // 更新统计
    set((state) => {
      const nodeCount = data.nodes.length;
      const messageCount = data.nodes.reduce((acc, n) => acc + (n.data.messages?.length || 0), 0);
      
      const newItems = state.items.map(item =>
        item.id === id && item.type === 'canvas'
          ? { ...item, nodeCount, messageCount, updatedAt: Date.now() }
          : item
      );
      saveSidebarItems(newItems);
      return { items: newItems };
    });
  },
  
  // 获取面包屑路径
  getBreadcrumb: (id) => {
    const result: SidebarItem[] = [];
    let current = get().items.find(item => item.id === id);
    
    while (current) {
      result.unshift(current);
      current = current.parentId ? get().items.find(item => item.id === current?.parentId) : undefined;
    }
    
    return result;
  },
  
  // 获取树形结构（排序后）
  getTreeItems: () => {
    const { items, searchQuery } = get();
    
    if (!searchQuery.trim()) {
      return items.sort((a, b) => {
        // 先按父级排序，再按sortOrder排序
        if (a.parentId !== b.parentId) {
          return 0; // 不同父级，保持原顺序
        }
        return a.sortOrder - b.sortOrder;
      });
    }
    
    // 搜索过滤
    const query = searchQuery.toLowerCase();
    return items.filter(item =>
      item.title.toLowerCase().includes(query)
    );
  },
}));
