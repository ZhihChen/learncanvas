/**
 * 画布状态管理 - Zustand Store
 * 支持撤销/重做功能
 */

import { create } from 'zustand';
import { 
  Node, 
  Edge, 
  NodeChange, 
  EdgeChange, 
  Connection,
  applyNodeChanges, 
  applyEdgeChanges,
  addEdge,
} from '@xyflow/react';
import { 
  ChatNode, 
  ChatEdge, 
  CanvasMeta, 
  STORAGE_KEYS,
  ChatNodeData,
  Message,
  MessageHighlight,
  EdgeRelationType,
  Excerpt,
  ExcerptStats,
  HighlightMenuState,
  NoteNodeData,
  Attachment,
} from '@/types';
import { layoutTree, layoutHorizontal, layoutGrid, layoutCompact } from '@/lib/layout';

// ==================== 安全限制 ====================

const MAX_MESSAGES_PER_NODE = 100; // 单个节点最大消息数
const MAX_MESSAGE_CONTENT_LENGTH = 50000; // 单条消息最大长度
const MAX_NODES = 50; // 最大节点数
const MAX_NODES_WARNING = 30; // 节点数警告阈值

// 截断过长内容
const truncateContent = (content: string, maxLength: number): string => {
  if (content.length > maxLength) {
    return content.slice(0, maxLength) + '\n\n[内容已截断]';
  }
  return content;
};

// ==================== 工具函数 ====================

const generateId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const defaultMeta: CanvasMeta = {
  id: generateId(),
  title: '我的知识画布',
  description: '结构化的AI对话知识图谱',
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

// ==================== 历史记录管理 ====================

interface HistoryState {
  nodes: ChatNode[];
  edges: ChatEdge[];
}

const MAX_HISTORY_SIZE = 50;

class HistoryManager {
  private past: HistoryState[] = [];
  private present: HistoryState | null = null;
  private future: HistoryState[] = [];

  canUndo(): boolean {
    return this.past.length > 0;
  }

  canRedo(): boolean {
    return this.future.length > 0;
  }

  push(state: HistoryState): void {
    // 如果有future，清空（新操作会覆盖重做栈）
    this.future = [];
    
    // 如果有present，推入past
    if (this.present) {
      this.past.push(this.present);
    }
    
    // 更新present
    this.present = state;
    
    // 限制历史记录大小
    if (this.past.length > MAX_HISTORY_SIZE) {
      this.past.shift();
    }
  }

  undo(currentState: HistoryState): HistoryState | null {
    if (!this.canUndo()) return null;
    
    // 保存当前状态到future
    this.future.push(currentState);
    
    // 从past取出上一个状态
    const previous = this.past.pop()!;
    this.present = previous;
    
    return previous;
  }

  redo(currentState: HistoryState): HistoryState | null {
    if (!this.canRedo()) return null;
    
    // 保存当前状态到past
    this.past.push(currentState);
    
    // 从future取出下一个状态
    const next = this.future.pop()!;
    this.present = next;
    
    return next;
  }

  clear(): void {
    this.past = [];
    this.present = null;
    this.future = [];
  }
}

const historyManager = new HistoryManager();

// ==================== 持久化 ====================

const loadFromStorage = (): { nodes: ChatNode[]; edges: ChatEdge[]; meta: CanvasMeta } | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CANVAS_STATE);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        nodes: parsed.nodes || [],
        edges: parsed.edges || [],
        meta: parsed.meta || defaultMeta,
      };
    }
  } catch (error) {
    console.error('Failed to load from storage:', error);
  }
  return null;
};

const saveToStorage = (state: { nodes: ChatNode[]; edges: ChatEdge[]; meta: CanvasMeta }) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEYS.CANVAS_STATE, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save to storage:', error);
  }
};

// 防抖保存
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
const debouncedSave = (state: { nodes: ChatNode[]; edges: ChatEdge[]; meta: CanvasMeta }) => {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveToStorage(state);
  }, 500);
};

// 防抖历史记录
let historyTimeout: ReturnType<typeof setTimeout> | null = null;
const debouncedPushHistory = (state: HistoryState) => {
  if (historyTimeout) clearTimeout(historyTimeout);
  historyTimeout = setTimeout(() => {
    historyManager.push(state);
  }, 300);
};

// ==================== Store 定义 ====================

interface CanvasStore {
  // 状态
  nodes: ChatNode[];
  edges: ChatEdge[];
  meta: CanvasMeta;
  selectedNodeId: string | null;
  selectedNodeIds: Set<string>; // 多选支持
  searchQuery: string; // 搜索关键词
  canUndo: boolean;
  canRedo: boolean;
  expandedNodeId: string | null; // 展开的聊天节点ID
  streamingNodeIds: string[]; // 当前正在流式输出的节点ID列表
  
  // 并发控制
  allowConcurrentStreaming: boolean; // 是否允许并发聊天
  
  // ===== 文件预览相关状态 =====
  previewingFile: Attachment | null; // 当前预览的文件
  showFilePreview: boolean; // 是否显示文件预览面板
  
  // ===== 摘录相关状态 =====
  allExcerpts: Excerpt[]; // 全局摘录列表（所有节点的摘录汇总）
  selectedExcerptId: string | null; // 当前选中的摘录（用于编辑）
  excerptStats: ExcerptStats | null; // 摘录统计
  highlightMenuState: HighlightMenuState | null; // 划线菜单状态
  
  // 节点操作
  addNode: (position: { x: number; y: number }, title?: string) => string;
  addNoteNode: (position: { x: number; y: number }, title?: string) => string;
  addGroup: (position: { x: number; y: number }, title?: string) => string;
  updateNodeData: (id: string, data: Partial<ChatNodeData>) => void;
  deleteNode: (id: string) => void;
  deleteSelectedNodes: () => void;
  setSelectedNode: (id: string | null) => void;
  toggleNodeSelection: (id: string) => void;
  selectAllNodes: () => void;
  clearSelection: () => void;
  setSearchQuery: (query: string) => void;
  setExpandedNode: (nodeId: string | null) => void;
  addStreamingNode: (nodeId: string) => void;
  removeStreamingNode: (nodeId: string) => void;
  canSendMessage: () => boolean;
  setAllowConcurrentStreaming: (allow: boolean) => void;
  
  // ===== 摘录相关方法 =====
  // 添加摘录
  addExcerpt: (excerpt: Omit<Excerpt, 'id' | 'createdAt'>, targetNodeId?: string) => string;
  // 更新摘录
  updateExcerpt: (excerptId: string, updates: Partial<Excerpt>) => void;
  // 删除摘录
  deleteExcerpt: (excerptId: string) => void;
  // 获取节点的所有摘录
  getNodeExcerpts: (nodeId: string) => Excerpt[];
  // 获取来源节点的摘录（所有摘录自该节点的）
  getSourceNodeExcerpts: (sourceNodeId: string) => Excerpt[];
  // 创建笔记节点
  createNoteNode: (position: { x: number; y: number }, title?: string) => string;
  // 显示划线菜单
  showHighlightMenu: (state: Omit<HighlightMenuState, 'visible'>) => void;
  // 隐藏划线菜单
  hideHighlightMenu: () => void;
  // 计算摘录统计
  calculateExcerptStats: () => ExcerptStats;
  // 刷新全局摘录列表
  refreshAllExcerpts: () => void;
  
  // ===== 文件预览相关方法 =====
  setPreviewingFile: (file: Attachment | null) => void;
  setShowFilePreview: (show: boolean) => void;
  
  // 布局操作
  applyLayout: (layoutType: 'tree' | 'horizontal' | 'grid' | 'compact') => void;
  setNodes: (nodes: ChatNode[]) => void;
  
  // 消息操作
  addMessage: (nodeId: string, message: Message) => void;
  updateMessage: (nodeId: string, messageId: string, content: string, status?: Message['status']) => void;
  addHighlight: (nodeId: string, messageId: string, highlight: Omit<MessageHighlight, 'id'>) => void;
  
  // 笔记节点消息操作
  addNoteMessage: (nodeId: string, message: Message) => void;
  updateNoteMessage: (nodeId: string, messageId: string, content: string, status?: Message['status']) => void;
  clearNoteMessages: (nodeId: string) => void;
  
  // 连线操作
  onNodesChange: (changes: NodeChange<ChatNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<ChatEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  addEdge: (edge: { id: string; source: string; target: string; sourceHandle?: string | null; targetHandle?: string | null; type?: string; data?: Record<string, unknown> }) => void;
  deleteEdge: (id: string) => void;
  updateEdgeConfig: (id: string, config: { contextConfig?: Record<string, unknown> }) => void;
  
  // 画布操作
  clearCanvas: () => void;
  loadCanvas: () => void;
  importCanvas: (data: { meta?: Partial<CanvasMeta>; nodes: ChatNode[]; edges: ChatEdge[] }) => void;
  updateMeta: (meta: Partial<CanvasMeta>) => void;
  
  // 计划相关操作
  createNodesFromPlan: (
    sourceNodeId: string,
    plan: {
      title: string;
      description: string;
      overallGoal?: string;
      prerequisites?: string[];
      steps: Array<{
        id: string;
        title: string;
        description: string;
        estimatedTime?: string;
        keywords?: string[];
        goals?: string[];
      }>;
    }
  ) => string[]; // 返回创建的节点ID列表
  
  createDerivedNode: (
    sourceNodeId: string,
    selectedText: string,
    context: string
  ) => string; // 返回创建的节点ID
  
  // 历史操作
  undo: () => void;
  redo: () => void;
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  // 初始状态
  nodes: [],
  edges: [],
  meta: defaultMeta,
  selectedNodeId: null,
  selectedNodeIds: new Set<string>(),
  searchQuery: '',
  canUndo: false,
  canRedo: false,
  expandedNodeId: null,
  streamingNodeIds: [],
  allowConcurrentStreaming: true, // 恢复允许并发聊天，配合深度性能优化
  
  // 文件预览相关初始状态
  previewingFile: null,
  showFilePreview: false,
  
  // 摘录相关初始状态
  allExcerpts: [],
  selectedExcerptId: null,
  excerptStats: null,
  highlightMenuState: null,
  
  // 添加节点
  addNode: (position, title = '新对话') => {
    const id = generateId();
    const newNode: ChatNode = {
      id,
      type: 'chatNode',
      position,
      data: {
        title,
        messages: [],
        collapsed: false,
        isStreaming: false,
      },
    };
    
    set((state) => {
      const nodes = [...state.nodes, newNode];
      const meta = { ...state.meta, updatedAt: Date.now() };
      
      // 推入历史记录
      debouncedPushHistory({ nodes: state.nodes, edges: state.edges });
      
      debouncedSave({ nodes, edges: state.edges, meta });
      return { ...state, nodes, meta, canUndo: true, canRedo: false };
    });
    
    return id;
  },
  
  // 添加笔记节点
  addNoteNode: (position, title = '新笔记') => {
    const id = generateId();
    const newNode: ChatNode = {
      id,
      type: 'noteNode',
      position,
      data: {
        type: 'note',
        title,
        excerpts: [],
        collapsed: false,
        displayMode: 'list',
        sortBy: 'time',
        aiOrganized: false,
      },
    };
    
    set((state) => {
      const nodes = [...state.nodes, newNode];
      const meta = { ...state.meta, updatedAt: Date.now() };
      
      // 推入历史记录
      debouncedPushHistory({ nodes: state.nodes, edges: state.edges });
      
      debouncedSave({ nodes, edges: state.edges, meta });
      return { ...state, nodes, meta, canUndo: true, canRedo: false };
    });
    
    return id;
  },
  
  // 添加分组
  addGroup: (position, title = '新分组') => {
    const id = generateId();
    const newNode: ChatNode = {
      id,
      type: 'groupNode',
      position,
      data: {
        title,
        collapsed: false,
        theme: 'indigo',
        childNodes: [],
      },
    };
    
    set((state) => {
      const nodes = [...state.nodes, newNode];
      const meta = { ...state.meta, updatedAt: Date.now() };
      
      // 推入历史记录
      debouncedPushHistory({ nodes: state.nodes, edges: state.edges });
      
      debouncedSave({ nodes, edges: state.edges, meta });
      return { ...state, nodes, meta, canUndo: true, canRedo: false };
    });
    
    return id;
  },
  
  // 更新节点数据
  updateNodeData: (id, data) => {
    set((state) => {
      const nodes = state.nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, ...data } }
          : node
      );
      const meta = { ...state.meta, updatedAt: Date.now() };
      debouncedSave({ nodes, edges: state.edges, meta });
      return { ...state, nodes, meta };
    });
  },
  
  // 删除节点
  deleteNode: (id) => {
    set((state) => {
      // 推入历史记录
      historyManager.push({ nodes: state.nodes, edges: state.edges });
      
      const nodes = state.nodes.filter((node) => node.id !== id);
      const edges = state.edges.filter(
        (edge) => edge.source !== id && edge.target !== id
      );
      const meta = { ...state.meta, updatedAt: Date.now() };
      debouncedSave({ nodes, edges, meta });
      return { ...state, nodes, edges, meta, canUndo: true, canRedo: false };
    });
  },
  
  // 设置选中节点
  setSelectedNode: (id) => {
    set({ selectedNodeId: id });
  },
  
  // 添加消息
  addMessage: (nodeId, message) => {
    // 防御性处理：截断过长内容
    const safeMessage = {
      ...message,
      content: truncateContent(message.content, MAX_MESSAGE_CONTENT_LENGTH),
    };
    
    set((state) => {
      const targetNode = state.nodes.find(n => n.id === nodeId);
      const currentMessages = targetNode?.data.messages || [];
      
      // 限制消息数量，保留最新的消息
      let newMessages = [...currentMessages, safeMessage];
      if (newMessages.length > MAX_MESSAGES_PER_NODE) {
        // 保留系统消息（如果有）和最新的消息
        const systemMessages = newMessages.filter(m => m.role === 'system');
        const otherMessages = newMessages.filter(m => m.role !== 'system');
        newMessages = [
          ...systemMessages,
          ...otherMessages.slice(-(MAX_MESSAGES_PER_NODE - systemMessages.length))
        ];
      }
      
      const nodes = state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                messages: newMessages,
              },
            }
          : node
      );
      const meta = { ...state.meta, updatedAt: Date.now() };
      debouncedSave({ nodes, edges: state.edges, meta });
      return { ...state, nodes, meta };
    });
  },
  
  // 更新消息
  updateMessage: (nodeId, messageId, content, status) => {
    // 防御性处理：截断过长内容
    const safeContent = truncateContent(content, MAX_MESSAGE_CONTENT_LENGTH);
    
    set((state) => {
      const nodes = state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                messages: (node.data.messages || []).map((msg) =>
                  msg.id === messageId
                    ? { ...msg, content: safeContent, ...(status && { status }) }
                    : msg
                ),
              },
            }
          : node
      );
      const meta = { ...state.meta, updatedAt: Date.now() };
      
      // 关键优化：流式输出期间禁用 localStorage 保存，避免主线程阻塞
      // 只在没有节点在流式输出时才保存
      if (state.streamingNodeIds.length === 0) {
        debouncedSave({ nodes, edges: state.edges, meta });
      }
      
      return { ...state, nodes, meta };
    });
  },
  
  // 添加高亮
  addHighlight: (nodeId, messageId, highlightData) => {
    const id = `highlight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const highlight: MessageHighlight = {
      ...highlightData,
      id,
    };
    
    set((state) => {
      const nodes = state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                messages: (node.data.messages || []).map((msg) =>
                  msg.id === messageId
                    ? { ...msg, highlights: [...(msg.highlights || []), highlight] }
                    : msg
                ),
              },
            }
          : node
      );
      const meta = { ...state.meta, updatedAt: Date.now() };
      debouncedSave({ nodes, edges: state.edges, meta });
      
      return { ...state, nodes, meta };
    });
  },
  
  // 添加笔记节点消息
  addNoteMessage: (nodeId, message) => {
    const safeMessage = {
      ...message,
      content: truncateContent(message.content, MAX_MESSAGE_CONTENT_LENGTH),
    };
    
    set((state) => {
      const nodes = state.nodes.map((node) => {
        if (node.id === nodeId && node.type === 'noteNode') {
          const noteData = node.data as NoteNodeData;
          const currentMessages = noteData.messages || [];
          const newMessages = [...currentMessages, safeMessage];
          
          return {
            ...node,
            data: {
              ...noteData,
              messages: newMessages,
            },
          };
        }
        return node;
      });
      const meta = { ...state.meta, updatedAt: Date.now() };
      debouncedSave({ nodes, edges: state.edges, meta });
      return { ...state, nodes, meta };
    });
  },
  
  // 更新笔记节点消息
  updateNoteMessage: (nodeId, messageId, content, status) => {
    const safeContent = truncateContent(content, MAX_MESSAGE_CONTENT_LENGTH);
    
    set((state) => {
      const nodes = state.nodes.map((node) => {
        if (node.id === nodeId && node.type === 'noteNode') {
          const noteData = node.data as NoteNodeData;
          const messages = noteData.messages || [];
          
          return {
            ...node,
            data: {
              ...noteData,
              messages: messages.map((msg) =>
                msg.id === messageId
                  ? { ...msg, content: safeContent, status: status || msg.status }
                  : msg
              ),
            },
          };
        }
        return node;
      });
      const meta = { ...state.meta, updatedAt: Date.now() };
      debouncedSave({ nodes, edges: state.edges, meta });
      return { ...state, nodes, meta };
    });
  },
  
  // 清空笔记节点消息
  clearNoteMessages: (nodeId) => {
    set((state) => {
      const nodes = state.nodes.map((node) => {
        if (node.id === nodeId && node.type === 'noteNode') {
          const noteData = node.data as NoteNodeData;
          return {
            ...node,
            data: {
              ...noteData,
              messages: [],
            },
          };
        }
        return node;
      });
      const meta = { ...state.meta, updatedAt: Date.now() };
      debouncedSave({ nodes, edges: state.edges, meta });
      return { ...state, nodes, meta };
    });
  },
  
  // 节点变化处理
  onNodesChange: (changes) => {
    set((state) => {
      const nodes = applyNodeChanges(changes, state.nodes);
      
      // 只在拖拽结束时保存和记录历史
      const hasPositionChange = changes.some(
        (change) => change.type === 'position' && !change.dragging
      );
      
      if (hasPositionChange) {
        // 推入历史记录
        historyManager.push({ nodes: state.nodes, edges: state.edges });
        
        const meta = { ...state.meta, updatedAt: Date.now() };
        debouncedSave({ nodes, edges: state.edges, meta });
        return { ...state, nodes, meta, canUndo: true, canRedo: false };
      }
      
      return { ...state, nodes };
    });
  },
  
  // 连线变化处理
  onEdgesChange: (changes) => {
    set((state) => {
      // 检查是否有删除操作
      const hasRemove = changes.some(change => change.type === 'remove');
      
      if (hasRemove) {
        historyManager.push({ nodes: state.nodes, edges: state.edges });
      }
      
      const edges = applyEdgeChanges(changes, state.edges);
      const meta = { ...state.meta, updatedAt: Date.now() };
      debouncedSave({ nodes: state.nodes, edges, meta });
      return { ...state, edges, meta, canUndo: hasRemove ? true : state.canUndo, canRedo: hasRemove ? false : state.canRedo };
    });
  },
  
  // 连接处理
  onConnect: (connection) => {
    set((state) => {
      // 推入历史记录
      historyManager.push({ nodes: state.nodes, edges: state.edges });
      
      const edges = addEdge(
        {
          ...connection,
          type: 'context',
          animated: true,
        },
        state.edges
      );
      const meta = { ...state.meta, updatedAt: Date.now() };
      debouncedSave({ nodes: state.nodes, edges, meta });
      return { ...state, edges, meta, canUndo: true, canRedo: false };
    });
  },
  
  // 直接添加连线
  addEdge: (edge) => {
    set((state) => {
      // 检查是否已存在相同连线
      const exists = state.edges.some(
        (e) => e.source === edge.source && e.target === edge.target
      );
      if (exists) return state;
      
      // 推入历史记录
      historyManager.push({ nodes: state.nodes, edges: state.edges });
      
      const newEdge: ChatEdge = {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        type: edge.type || 'context',
        animated: true,
        // 保留 data 字段（包含 relationType）
        data: edge.data,
        // 从 data 中提取 relationType 到顶层，便于访问
        relationType: (edge.data as { relationType?: EdgeRelationType })?.relationType || 'hierarchy',
      };
      const edges = [...state.edges, newEdge];
      const meta = { ...state.meta, updatedAt: Date.now() };
      debouncedSave({ nodes: state.nodes, edges, meta });
      return { ...state, edges, meta, canUndo: true, canRedo: false };
    });
  },
  
  // 删除连线
  deleteEdge: (id) => {
    set((state) => {
      // 推入历史记录
      historyManager.push({ nodes: state.nodes, edges: state.edges });
      
      const edges = state.edges.filter((edge) => edge.id !== id);
      const meta = { ...state.meta, updatedAt: Date.now() };
      debouncedSave({ nodes: state.nodes, edges, meta });
      return { ...state, edges, meta, canUndo: true, canRedo: false };
    });
  },
  
  // 更新连线配置
  updateEdgeConfig: (id, config) => {
    set((state) => {
      const edges = state.edges.map((edge) =>
        edge.id === id
          ? { ...edge, data: { ...edge.data, ...config } }
          : edge
      );
      const meta = { ...state.meta, updatedAt: Date.now() };
      debouncedSave({ nodes: state.nodes, edges, meta });
      return { ...state, edges, meta };
    });
  },
  
  // 从计划创建多个节点 - 优化版本，生成更丰富的内容
  createNodesFromPlan: (sourceNodeId, plan) => {
    const state = get();
    const sourceNode = state.nodes.find(n => n.id === sourceNodeId);
    
    if (!sourceNode) {
      console.error('Source node not found');
      return [];
    }
    
    // 推入历史记录
    historyManager.push({ nodes: state.nodes, edges: state.edges });
    
    const createdNodeIds: string[] = [];
    const newNodes: ChatNode[] = [];
    const newEdges: ChatEdge[] = [];
    
    // 计算布局参数
    const startY = sourceNode.position.y + 250;
    const spacing = 350;
    const totalWidth = (plan.steps.length - 1) * spacing;
    const startX = sourceNode.position.x - totalWidth / 2;
    
    plan.steps.forEach((step, index) => {
      const nodeId = generateId();
      createdNodeIds.push(nodeId);
      
      // 构建更丰富的节点内容
      let nodeContent = `## 📚 ${plan.title}\n\n`;
      nodeContent += `### 第 ${index + 1} 步：${step.title}\n\n`;
      
      // 添加步骤描述
      nodeContent += `${step.description}\n\n`;
      
      // 添加学习目标
      if (step.goals && step.goals.length > 0) {
        nodeContent += `**🎯 学习目标**\n`;
        step.goals.forEach(goal => {
          nodeContent += `- ${goal}\n`;
        });
        nodeContent += '\n';
      }
      
      // 添加关键词
      if (step.keywords && step.keywords.length > 0) {
        nodeContent += `**🔑 核心概念**：${step.keywords.join('、')}\n\n`;
      }
      
      // 添加预计时间
      if (step.estimatedTime) {
        nodeContent += `**⏱️ 预计时间**：${step.estimatedTime}\n\n`;
      }
      
      // 添加引导语
      nodeContent += `---\n\n`;
      nodeContent += `💡 **开始学习**\n\n你可以在这里深入学习这个主题。有任何问题都可以直接问我，我会尽力帮助你理解！`;
      
      // 构建标签
      const nodeTags = step.keywords?.slice(0, 2) || [];
      
      // 创建节点
      const newNode: ChatNode = {
        id: nodeId,
        type: 'chatNode',
        position: {
          x: startX + index * spacing,
          y: startY,
        },
        data: {
          title: step.title,
          messages: [
            {
              id: `msg_${Date.now()}_${index}`,
              role: 'assistant',
              content: nodeContent,
              timestamp: Date.now(),
              status: 'complete',
            },
          ],
          collapsed: false,
          isStreaming: false,
          contextFrom: [sourceNodeId],
          status: 'idle',
          tags: nodeTags,
        },
      };
      
      newNodes.push(newNode);
      
      // 创建连线（层级传递）
      const edgeId = generateId();
      const newEdge: ChatEdge = {
        id: edgeId,
        source: sourceNodeId,
        target: nodeId,
        sourceHandle: 'bottom-source',
        targetHandle: 'top-target',
        type: 'context',
        data: {
          relationType: 'hierarchy',
          contextConfig: {
            strategy: 'all',
            enabled: true,
          },
        },
      };
      
      newEdges.push(newEdge);
    });
    
    // 更新源节点的标题和摘要
    const updatedSourceNode = {
      ...sourceNode,
      data: {
        ...sourceNode.data,
        title: sourceNode.data.title === '新对话' ? plan.title : sourceNode.data.title,
        summary: plan.overallGoal || plan.description,
      },
    };
    
    // 批量更新
    set((state) => {
      const nodes = [updatedSourceNode, ...state.nodes.filter(n => n.id !== sourceNodeId), ...newNodes];
      const edges = [...state.edges, ...newEdges];
      const meta = { ...state.meta, updatedAt: Date.now() };
      
      debouncedSave({ nodes, edges, meta });
      
      return {
        nodes,
        edges,
        meta,
        canUndo: true,
        canRedo: false,
      };
    });
    
    return createdNodeIds;
  },
  
  // 创建衍生节点
  createDerivedNode: (sourceNodeId, selectedText, context) => {
    const state = get();
    const sourceNode = state.nodes.find(n => n.id === sourceNodeId);
    
    if (!sourceNode) {
      console.error('Source node not found');
      return '';
    }
    
    // 推入历史记录
    historyManager.push({ nodes: state.nodes, edges: state.edges });
    
    const nodeId = generateId();
    
    // 创建衍生节点（在右侧）
    const newNode: ChatNode = {
      id: nodeId,
      type: 'chatNode',
      position: {
        x: sourceNode.position.x + 450,
        y: sourceNode.position.y,
      },
      data: {
        title: `深入：${selectedText.slice(0, 20)}${selectedText.length > 20 ? '...' : ''}`,
        messages: [
          {
            id: `msg_${Date.now()}`,
            role: 'user',
            content: `我想深入了解这个问题。\n\n**问题：** ${selectedText}\n\n**上下文：**\n${context}`,
            timestamp: Date.now(),
            status: 'complete',
          },
        ],
        collapsed: false,
        isStreaming: false,
        contextFrom: [sourceNodeId],
        status: 'idle',
      },
    };
    
    // 创建引用连线
    const edgeId = generateId();
    const newEdge: ChatEdge = {
      id: edgeId,
      source: sourceNodeId,
      target: nodeId,
      sourceHandle: 'right-source',
      targetHandle: 'left-target',
      type: 'context',
      data: {
        relationType: 'reference', // 引用关联
        contextConfig: {
          transferStrategy: 'focused', // 聚焦传递
          enabled: true,
        },
      },
    };
    
    // 更新状态
    set((state) => {
      const nodes = [...state.nodes, newNode];
      const edges = [...state.edges, newEdge];
      const meta = { ...state.meta, updatedAt: Date.now() };
      
      debouncedSave({ nodes, edges, meta });
      
      return {
        nodes,
        edges,
        meta,
        canUndo: true,
        canRedo: false,
      };
    });
    
    return nodeId;
  },
  
  // 清空画布
  clearCanvas: () => {
    set((state) => {
      // 推入历史记录
      historyManager.push({ nodes: state.nodes, edges: state.edges });
      
      const newState = {
        nodes: [] as ChatNode[],
        edges: [] as ChatEdge[],
        meta: { ...defaultMeta, id: generateId(), createdAt: Date.now(), updatedAt: Date.now() },
        selectedNodeId: null as string | null,
        selectedNodeIds: new Set<string>(),
        searchQuery: '',
        canUndo: true,
        canRedo: false,
      };
      saveToStorage(newState);
      return newState;
    });
  },
  
  // 加载画布
  loadCanvas: () => {
    const stored = loadFromStorage();
    if (stored) {
      // 清空历史记录
      historyManager.clear();
      
      set({
        nodes: stored.nodes,
        edges: stored.edges,
        meta: stored.meta,
        canUndo: false,
        canRedo: false,
      });
    }
  },
  
  // 导入画布
  importCanvas: (data) => {
    set((state) => {
      // 推入历史记录
      historyManager.push({ nodes: state.nodes, edges: state.edges });
      
      const newMeta = {
        ...defaultMeta,
        ...(data.meta || {}),
        id: data.meta?.id || generateId(),
        createdAt: data.meta?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };
      
      // 确保节点有正确的类型和位置
      const newNodes = (data.nodes || []).map((node) => ({
        ...node,
        type: node.type || 'chatNode',
        position: node.position || { x: 0, y: 0 },
        data: {
          ...node.data,
          title: node.data?.title || '未命名节点',
          messages: node.data?.messages || [],
          collapsed: node.data?.collapsed ?? false,
        },
      }));
      
      // 确保连线有正确的类型
      const newEdges = (data.edges || []).map((edge) => ({
        ...edge,
        type: edge.type || 'context',
        animated: edge.animated ?? true,
        relationType: edge.relationType || (edge.data as { relationType?: EdgeRelationType })?.relationType || 'hierarchy',
      }));
      
      const newState = {
        nodes: newNodes,
        edges: newEdges,
        meta: newMeta,
        selectedNodeId: null as string | null,
        selectedNodeIds: new Set<string>(),
        searchQuery: '',
        canUndo: true,
        canRedo: false,
      };
      
      saveToStorage(newState);
      return newState;
    });
  },
  
  // 更新元数据
  updateMeta: (meta) => {
    set((state) => {
      const newMeta = { ...state.meta, ...meta, updatedAt: Date.now() };
      debouncedSave({ nodes: state.nodes, edges: state.edges, meta: newMeta });
      return { ...state, meta: newMeta };
    });
  },
  
  // 删除选中节点
  deleteSelectedNodes: () => {
    set((state) => {
      const selectedIds = state.selectedNodeIds;
      if (selectedIds.size === 0) return state;
      
      // 推入历史记录
      historyManager.push({ nodes: state.nodes, edges: state.edges });
      
      const nodes = state.nodes.filter((node) => !selectedIds.has(node.id));
      const edges = state.edges.filter(
        (edge) => !selectedIds.has(edge.source) && !selectedIds.has(edge.target)
      );
      const meta = { ...state.meta, updatedAt: Date.now() };
      debouncedSave({ nodes, edges, meta });
      return { ...state, nodes, edges, meta, selectedNodeIds: new Set(), selectedNodeId: null, canUndo: true, canRedo: false };
    });
  },
  
  // 切换节点选中状态
  toggleNodeSelection: (id) => {
    set((state) => {
      const newSelected = new Set(state.selectedNodeIds);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return { ...state, selectedNodeIds: newSelected };
    });
  },
  
  // 全选
  selectAllNodes: () => {
    set((state) => ({
      ...state,
      selectedNodeIds: new Set(state.nodes.map(n => n.id)),
    }));
  },
  
  // 清除选择
  clearSelection: () => {
    set((state) => ({
      ...state,
      selectedNodeIds: new Set(),
      selectedNodeId: null,
    }));
  },
  
  // 设置搜索关键词
  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },
  
  // 设置展开的节点
  setExpandedNode: (nodeId: string | null) => {
    set({ expandedNodeId: nodeId });
  },
  
  // 添加 streaming 节点
  addStreamingNode: (nodeId: string) => {
    set((state) => {
      if (state.streamingNodeIds.includes(nodeId)) return state;
      return { streamingNodeIds: [...state.streamingNodeIds, nodeId] };
    });
  },
  
  // 移除 streaming 节点
  removeStreamingNode: (nodeId: string) => {
    set((state) => {
      const newStreamingIds = state.streamingNodeIds.filter(id => id !== nodeId);
      
      // 如果所有流式输出都结束了，立即保存状态
      if (state.streamingNodeIds.length > 0 && newStreamingIds.length === 0) {
        const meta = { ...state.meta, updatedAt: Date.now() };
        debouncedSave({ nodes: state.nodes, edges: state.edges, meta });
      }
      
      return { streamingNodeIds: newStreamingIds };
    });
  },
  
  // 检查是否可以发送消息（考虑并发设置）
  canSendMessage: () => {
    const state = get();
    if (state.allowConcurrentStreaming) return true;
    return state.streamingNodeIds.length === 0;
  },
  
  // 切换并发聊天设置
  setAllowConcurrentStreaming: (allow: boolean) => {
    set({ allowConcurrentStreaming: allow });
  },
  
  // 应用布局
  applyLayout: (layoutType) => {
    set((state) => {
      // 推入历史记录
      historyManager.push({ nodes: state.nodes, edges: state.edges });
      
      let newNodes: ChatNode[];
      
      switch (layoutType) {
        case 'tree':
          newNodes = layoutTree(state.nodes, state.edges);
          break;
        case 'horizontal':
          newNodes = layoutHorizontal(state.nodes, state.edges);
          break;
        case 'grid':
          newNodes = layoutGrid(state.nodes, state.edges);
          break;
        case 'compact':
          newNodes = layoutCompact(state.nodes, state.edges);
          break;
        default:
          newNodes = state.nodes;
      }
      
      const meta = { ...state.meta, updatedAt: Date.now() };
      debouncedSave({ nodes: newNodes, edges: state.edges, meta });
      return { ...state, nodes: newNodes, meta, canUndo: true, canRedo: false };
    });
  },
  
  // 设置节点（用于外部更新）
  setNodes: (nodes) => {
    set((state) => {
      const meta = { ...state.meta, updatedAt: Date.now() };
      debouncedSave({ nodes, edges: state.edges, meta });
      return { ...state, nodes, meta };
    });
  },
  
  // 撤销
  undo: () => {
    set((state) => {
      const previous = historyManager.undo({ nodes: state.nodes, edges: state.edges });
      if (!previous) return state;
      
      const meta = { ...state.meta, updatedAt: Date.now() };
      debouncedSave({ nodes: previous.nodes, edges: previous.edges, meta });
      
      return {
        ...state,
        nodes: previous.nodes,
        edges: previous.edges,
        meta,
        canUndo: historyManager.canUndo(),
        canRedo: historyManager.canRedo(),
      };
    });
  },
  
  // 重做
  redo: () => {
    set((state) => {
      const next = historyManager.redo({ nodes: state.nodes, edges: state.edges });
      if (!next) return state;
      
      const meta = { ...state.meta, updatedAt: Date.now() };
      debouncedSave({ nodes: next.nodes, edges: next.edges, meta });
      
      return {
        ...state,
        nodes: next.nodes,
        edges: next.edges,
        meta,
        canUndo: historyManager.canUndo(),
        canRedo: historyManager.canRedo(),
      };
    });
  },
  
  // ==================== 摘录相关方法 ====================
  
  // 添加摘录
  addExcerpt: (excerptData, targetNodeId) => {
    const id = `excerpt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const excerpt: Excerpt = {
      ...excerptData,
      id,
      createdAt: Date.now(),
    };
    
    set((state) => {
      // 如果指定了目标节点，添加到该节点
      if (targetNodeId) {
        const nodes = state.nodes.map((node) => {
          // 检查是否是目标笔记节点
          if (node.id === targetNodeId) {
            const noteData = node.data as NoteNodeData;
            if (noteData.type === 'note') {
              return {
                ...node,
                data: {
                  ...noteData,
                  excerpts: [...(noteData.excerpts || []), excerpt],
                } as NoteNodeData,
              } as ChatNode;
            }
          }
          return node;
        });
        
        // 更新原消息的高亮
        if (excerpt.sourceRange) {
          const sourceNodeIndex = nodes.findIndex(n => n.id === excerpt.sourceNodeId);
          if (sourceNodeIndex !== -1) {
            const sourceNode = nodes[sourceNodeIndex];
            const sourceData = sourceNode.data as ChatNodeData;
            if (sourceData.messages) {
              const messages = sourceData.messages;
              const messageIndex = messages.findIndex((m: Message) => m.id === excerpt.sourceMessageId);
              
              if (messageIndex !== -1) {
                const updatedMessages = [...messages];
                const message = { ...updatedMessages[messageIndex] };
                
                message.highlights = [
                  ...(message.highlights || []),
                  {
                    id: excerpt.id,
                    startOffset: excerpt.sourceRange.startOffset,
                    endOffset: excerpt.sourceRange.endOffset,
                    type: 'excerpt' as const,
                    excerptId: excerpt.id,
                  },
                ];
                
                updatedMessages[messageIndex] = message;
                nodes[sourceNodeIndex] = {
                  ...sourceNode,
                  data: {
                    ...sourceData,
                    messages: updatedMessages,
                  },
                } as ChatNode;
              }
            }
          }
        }
        
        const meta = { ...state.meta, updatedAt: Date.now() };
        debouncedSave({ nodes, edges: state.edges, meta });
        
        return {
          ...state,
          nodes,
          meta,
          allExcerpts: [...state.allExcerpts, excerpt],
        };
      }
      
      // 没有指定目标节点，只更新全局摘录列表
      return {
        ...state,
        allExcerpts: [...state.allExcerpts, excerpt],
      };
    });
    
    return id;
  },
  
  // 更新摘录
  updateExcerpt: (excerptId, updates) => {
    set((state) => {
      // 更新全局摘录列表
      const allExcerpts = state.allExcerpts.map((e) =>
        e.id === excerptId ? { ...e, ...updates, updatedAt: Date.now() } : e
      );
      
      // 更新笔记节点中的摘录
      const nodes = state.nodes.map((node) => {
        const noteData = node.data as NoteNodeData;
        if (noteData.type === 'note' && noteData.excerpts?.some((e) => e.id === excerptId)) {
          return {
            ...node,
            data: {
              ...noteData,
              excerpts: noteData.excerpts.map((e) =>
                e.id === excerptId ? { ...e, ...updates, updatedAt: Date.now() } : e
              ),
            } as NoteNodeData,
          } as ChatNode;
        }
        return node;
      });
      
      const meta = { ...state.meta, updatedAt: Date.now() };
      debouncedSave({ nodes, edges: state.edges, meta });
      
      return { ...state, nodes, meta, allExcerpts };
    });
  },
  
  // 删除摘录
  deleteExcerpt: (excerptId) => {
    set((state) => {
      // 从全局摘录列表中删除
      const allExcerpts = state.allExcerpts.filter((e) => e.id !== excerptId);
      
      // 从笔记节点中删除
      const nodes = state.nodes.map((node) => {
        const noteData = node.data as NoteNodeData;
        if (noteData.type === 'note' && noteData.excerpts?.some((e) => e.id === excerptId)) {
          return {
            ...node,
            data: {
              ...noteData,
              excerpts: noteData.excerpts.filter((e) => e.id !== excerptId),
            } as NoteNodeData,
          } as ChatNode;
        }
        
        // 同时移除源消息中的高亮标记
        const chatData = node.data as ChatNodeData;
        if (chatData.messages) {
          const messages = chatData.messages;
          const hasHighlight = messages.some((m: Message) =>
            m.highlights?.some((h) => h.excerptId === excerptId)
          );
          if (hasHighlight) {
            return {
              ...node,
              data: {
                ...chatData,
                messages: messages.map((m: Message) => ({
                  ...m,
                  highlights: m.highlights?.filter((h) => h.excerptId !== excerptId),
                })),
              },
            } as ChatNode;
          }
        }
        
        return node;
      });
      
      const meta = { ...state.meta, updatedAt: Date.now() };
      debouncedSave({ nodes, edges: state.edges, meta });
      
      return { ...state, nodes, meta, allExcerpts };
    });
  },
  
  // 获取节点的所有摘录
  getNodeExcerpts: (nodeId) => {
    const state = get();
    const node = state.nodes.find((n) => n.id === nodeId);
    if (node) {
      const noteData = node.data as NoteNodeData;
      if (noteData.type === 'note') {
        return noteData.excerpts || [];
      }
    }
    return [];
  },
  
  // 获取来源节点的摘录
  getSourceNodeExcerpts: (sourceNodeId) => {
    const state = get();
    return state.allExcerpts.filter((e) => e.sourceNodeId === sourceNodeId);
  },
  
  // 创建笔记节点
  createNoteNode: (position, title = '新笔记') => {
    const id = generateId();
    const newNode: ChatNode = {
      id,
      type: 'noteNode',
      position,
      data: {
        title,
        type: 'note',
        excerpts: [],
        displayMode: 'list',
        sortBy: 'time',
        aiOrganized: false,
        collapsed: false,
      } as NoteNodeData,
    };
    
    set((state) => {
      const nodes = [...state.nodes, newNode];
      const meta = { ...state.meta, updatedAt: Date.now() };
      
      // 推入历史记录
      debouncedPushHistory({ nodes: state.nodes, edges: state.edges });
      
      debouncedSave({ nodes, edges: state.edges, meta });
      return { ...state, nodes, meta, canUndo: true, canRedo: false };
    });
    
    return id;
  },
  
  // 显示划线菜单
  showHighlightMenu: (menuState) => {
    set({
      highlightMenuState: {
        ...menuState,
        visible: true,
      },
    });
  },
  
  // 隐藏划线菜单
  hideHighlightMenu: () => {
    set((state) => ({
      highlightMenuState: state.highlightMenuState
        ? { ...state.highlightMenuState, visible: false }
        : null,
    }));
  },
  
  // 计算摘录统计
  calculateExcerptStats: () => {
    const state = get();
    const excerpts = state.allExcerpts;
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const oneWeekMs = 7 * oneDayMs;
    const oneMonthMs = 30 * oneDayMs;
    
    // 计算各时间段摘录数
    const todayCount = excerpts.filter((e) => now - e.createdAt < oneDayMs).length;
    const weekCount = excerpts.filter((e) => now - e.createdAt < oneWeekMs).length;
    const monthCount = excerpts.filter((e) => now - e.createdAt < oneMonthMs).length;
    
    // 统计热门标签
    const tagCounts: Record<string, number> = {};
    excerpts.forEach((e) => {
      e.tags?.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    const topTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // 统计热门来源节点
    const nodeCounts: Record<string, { title: string; count: number }> = {};
    excerpts.forEach((e) => {
      if (!nodeCounts[e.sourceNodeId]) {
        nodeCounts[e.sourceNodeId] = { title: e.sourceNodeTitle, count: 0 };
      }
      nodeCounts[e.sourceNodeId].count++;
    });
    const topNodes = Object.entries(nodeCounts)
      .map(([nodeId, data]) => ({ nodeId, nodeTitle: data.title, count: data.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // 统计高峰时段
    const hourCounts: Record<number, number> = {};
    excerpts.forEach((e) => {
      const hour = new Date(e.createdAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const peakHours = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => a.hour - b.hour);
    
    const stats: ExcerptStats = {
      totalCount: excerpts.length,
      todayCount,
      weekCount,
      monthCount,
      topTags,
      topNodes,
      peakHours,
    };
    
    set({ excerptStats: stats });
    return stats;
  },
  
  // 刷新全局摘录列表
  refreshAllExcerpts: () => {
    set((state) => {
      const allExcerpts: Excerpt[] = [];
      
      state.nodes.forEach((node) => {
        const noteData = node.data as NoteNodeData;
        if (noteData.type === 'note' && noteData.excerpts) {
          allExcerpts.push(...noteData.excerpts);
        }
      });
      
      return { ...state, allExcerpts };
    });
  },
  
  // ===== 文件预览相关方法 =====
  setPreviewingFile: (file) => {
    set({ previewingFile: file, showFilePreview: file !== null });
  },
  
  setShowFilePreview: (show) => {
    set({ showFilePreview: show });
    if (!show) {
      set({ previewingFile: null });
    }
  },
}));
