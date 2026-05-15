/**
 * 画布化对话系统 - 类型定义
 */

import type { Node, Edge } from '@xyflow/react';

// ==================== 消息类型 ====================

export type MessageRole = 'user' | 'assistant' | 'system';

export type MessageStatus = 'pending' | 'streaming' | 'complete' | 'error';

// 附件类型
export type AttachmentType = 'image' | 'file' | 'pdf' | 'word' | 'excel' | 'powerpoint' | 'markdown';

// 文件上传状态
export type FileUploadStatus = 'uploading' | 'parsing' | 'ready' | 'error';

// 附件接口
export interface Attachment {
  id: string;
  type: AttachmentType;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  // 对象存储key（用于持久化）
  storageKey?: string;
  // 提取的文本内容（用于AI对话）
  textContent?: string;
  // 上传/解析状态
  status?: FileUploadStatus;
  // 错误信息
  error?: string;
  // 文件元数据
  metadata?: {
    pageCount?: number; // PDF页数
    width?: number; // 图片宽度
    height?: number; // 图片高度
    duration?: number; // 音视频时长
  };
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  status?: MessageStatus;
  attachments?: Attachment[]; // 附件列表
  highlights?: MessageHighlight[]; // 高亮/摘录标记
}

// ==================== 摘录类型系统 ====================

/**
 * 摘录类型
 */
export type ExcerptType = 'excerpt' | 'note';

/**
 * 消息高亮标记
 */
export interface MessageHighlight {
  id: string;
  startOffset: number;
  endOffset: number;
  type: 'highlight' | 'excerpt';
  excerptId?: string; // 关联的摘录 ID
  color?: string; // 高亮颜色
}

/**
 * 摘录内容
 */
export interface Excerpt {
  // 基础信息
  id: string; // 唯一标识
  type: ExcerptType; // 摘录类型

  // 内容
  content: string; // 摘录的文本内容
  htmlContent?: string; // 摘录的HTML内容（保留格式，如表格、粗体等）
  note?: string; // 用户添加的笔记/批注
  tags?: string[]; // 标签

  // 来源信息
  sourceNodeId: string; // 来源节点 ID
  sourceNodeTitle: string; // 来源节点标题
  sourceMessageId: string; // 来源消息 ID
  sourceContext?: {
    // 上下文（可选）
    before: string; // 前文（最多100字）
    after: string; // 后文（最多100字）
  };

  // 位置信息（用于高亮定位）
  sourceRange?: {
    startOffset: number; // 选区起始位置
    endOffset: number; // 选区结束位置
  };

  // 时间信息
  createdAt: number; // 创建时间
  updatedAt?: number; // 更新时间

  // 状态
  isResolved?: boolean; // 待办类型专用：是否已完成

  // AI 相关
  aiSummary?: string; // AI 生成的摘要
  suggestedTags?: string[]; // AI 建议的标签
}

/**
 * 摘录分组（用于全局视图）
 */
export interface ExcerptGroup {
  id: string;
  title: string; // 分组标题（日期或标签名）
  type: 'date' | 'tag' | 'node';
  excerpts: Excerpt[];
}

/**
 * 划线统计数据
 */
export interface ExcerptStats {
  totalCount: number; // 总摘录数
  todayCount: number; // 今日摘录数
  weekCount: number; // 本周摘录数
  monthCount: number; // 本月摘录数
  topTags: Array<{
    // 热门标签
    tag: string;
    count: number;
  }>;
  topNodes: Array<{
    // 热门来源节点
    nodeId: string;
    nodeTitle: string;
    count: number;
  }>;
  peakHours: Array<{
    // 摘录高峰时段
    hour: number;
    count: number;
  }>;
}

/**
 * 划线菜单状态
 */
export interface HighlightMenuState {
  visible: boolean;
  position: { x: number; y: number };
  selectedText: string;
  selectedHtml?: string; // 选中内容的HTML（保留格式）
  sourceNodeId: string;
  sourceNodeTitle: string;
  sourceMessageId: string;
  sourceRange?: { startOffset: number; endOffset: number };
  sourceFullContent?: string; // 完整消息内容（用于获取上下文）
}

// ==================== 节点状态类型 ====================

export type NodeStatus = 'idle' | 'active' | 'completed';

// ==================== 节点数据类型 ====================

// 基础节点数据（所有节点共享）
export interface BaseNodeData extends Record<string, unknown> {
  title: string;
  collapsed?: boolean;
}

// 聊天节点数据
export interface ChatNodeData extends BaseNodeData {
  messages?: Message[];
  systemPrompt?: string;
  tags?: string[];
  contextFrom?: string[];
  isStreaming?: boolean;
  status?: NodeStatus;
  summary?: string;
  contextEnabled?: { [nodeId: string]: boolean };
}

// 笔记节点数据
export interface NoteNodeData extends BaseNodeData {
  type: 'note'; // 节点类型标识

  // 摘录内容
  excerpts: Excerpt[]; // 摘录列表

  // 排版设置
  displayMode: 'list' | 'card' | 'compact'; // 展示模式
  sortBy: 'time' | 'source' | 'custom'; // 排序方式

  // AI 整理
  aiOrganized: boolean; // 是否经过 AI 整理
  aiOrganization?: {
    // AI 整理结果
    sections: Array<{
      title: string;
      excerptIds: string[];
      summary?: string;
    }>;
    generatedAt: number;
  };

  // AI 对话
  messages?: Message[]; // AI 对话历史
  aiMode?: boolean; // 是否展开 AI 对话模式

  // 导出记录
  exportHistory?: Array<{
    format: 'markdown' | 'notion' | 'pdf';
    exportedAt: number;
  }>;
}

// 分组节点数据
export interface GroupNodeData extends BaseNodeData {
  theme?: 'indigo' | 'purple' | 'teal' | 'amber' | 'rose';
  childNodes?: string[];
  description?: string;
}

// ==================== 连线类型 ====================

// 连线关系类型
export type EdgeRelationType = 'hierarchy' | 'reference';

// 上下文传递策略
export type ContextTransferStrategy = 'all' | 'summary' | 'recent' | 'custom';

// 上下文传递配置
export interface ContextTransferConfig {
  strategy: ContextTransferStrategy;
  recentCount?: number; // 当 strategy 为 'recent' 时，传递最近N条
  customMessageIds?: string[]; // 当 strategy 为 'custom' 时，指定的消息ID
  enabled: boolean; // 是否启用传递
}

// 连线样式
export interface EdgeStyle {
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
  animated: boolean;
  markerEnd?: string;
}

// 上下文预览数据
export interface ContextPreview {
  sourceNodeId: string;
  sourceNodeTitle: string;
  strategy: ContextTransferStrategy;
  messageCount: number;
  previewContent: string; // 预览文本（前200字符）
  fullContent?: string; // 完整内容
  summary?: string; // 摘要
}

// ==================== 节点和连线类型 ====================

// 使用 React Flow 的 Node 类型
export type ChatNode = Node<ChatNodeData, 'chatNode' | 'groupNode' | 'noteNode'>;

// 扩展 Edge 类型，添加关系类型和上下文配置
export interface ChatEdge extends Edge {
  relationType?: EdgeRelationType;
  contextConfig?: ContextTransferConfig;
}

// 连线样式预设
export const EDGE_STYLES: Record<EdgeRelationType, EdgeStyle> = {
  hierarchy: {
    stroke: '#d97706', // amber-600
    strokeWidth: 2,
    animated: true,
    markerEnd: 'arrow',
  },
  reference: {
    stroke: '#b45309', // amber-700
    strokeWidth: 2,
    strokeDasharray: '5,5',
    animated: false,
    markerEnd: 'arrow',
  },
};

// ==================== 画布类型 ====================

export interface CanvasMeta {
  id: string;
  title: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ViewportState {
  x: number;
  y: number;
  zoom: number;
}

export interface CanvasState {
  meta: CanvasMeta;
  nodes: ChatNode[];
  edges: ChatEdge[];
  viewport?: ViewportState;
}

// ==================== API 类型 ====================

export interface ChatRequest {
  messages: Message[];
  contextMessages?: Message[];
  nodeId: string;
}

export interface ChatStreamEvent {
  type: 'content' | 'done' | 'error';
  content?: string;
  message?: string;
}

// ==================== 存储类型 ====================

export const STORAGE_KEYS = {
  CANVAS_STATE: 'canvas-chat-state',
  VIEWPORT: 'canvas-viewport',
  CANVAS_LIST: 'canvas-list',
  SIDEBAR_STATE: 'sidebar-state',
} as const;

// ==================== 文件夹/画布管理系统类型 ====================

// 项目类型
export type ItemType = 'folder' | 'canvas';

// 基础项目接口
export interface BaseItem {
  id: string;
  type: ItemType;
  title: string;
  parentId: string | null; // null 表示根目录
  createdAt: number;
  updatedAt: number;
  sortOrder: number; // 排序顺序
}

// 文件夹项目
export interface FolderItem extends BaseItem {
  type: 'folder';
  icon?: string;
  color?: string;
  isExpanded?: boolean; // UI状态：是否展开
}

// 画布项目
export interface CanvasItem extends BaseItem {
  type: 'canvas';
  description?: string;
  nodeCount: number;
  messageCount: number;
  isPinned?: boolean;
  isLocked?: boolean;
}

// 联合类型
export type SidebarItem = FolderItem | CanvasItem;

// 侧边栏状态
export interface SidebarState {
  items: SidebarItem[];
  expandedFolders: Set<string>; // 展开的文件夹ID
  selectedItemId: string | null;
  editingItemId: string | null; // 正在编辑的项目ID
  draggedItemId: string | null; // 正在拖拽的项目ID
  dropTargetId: string | null; // 拖放目标ID
  dropPosition: 'before' | 'after' | 'inside' | null; // 拖放位置
}

// ==================== 画布列表管理类型（兼容旧版）====================

// 画布摘要（用于列表展示）
export interface CanvasSummary {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  createdAt: number;
  updatedAt: number;
  nodeCount: number;
  messageCount: number;
  isPinned?: boolean;
  isLocked?: boolean;
}

// 画布完整数据
export interface CanvasData {
  meta: CanvasMeta;
  nodes: ChatNode[];
  edges: ChatEdge[];
  viewport?: ViewportState;
}

// 画布排序方式
export type CanvasSortBy = 'updatedAt' | 'createdAt' | 'title';
export type CanvasSortOrder = 'asc' | 'desc';

// 画布视图模式
export type CanvasViewMode = 'grid' | 'list';
