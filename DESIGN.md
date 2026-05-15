# 画布化对话系统 - 项目设计文档

> 版本：MVP v1.0  
> 创建时间：2025年1月  
> 状态：开发中

---

## 📌 项目概述

### 核心理念

将传统的碎片化 AI 对话转化为**结构化的知识画布**，每个对话节点可独立交互，同时通过连线实现上下文传递和知识关联，形成清晰的知识图谱。

### 解决的痛点

```
❌ 传统方式的问题：
   - 对话散乱，没有层级结构
   - 主题之间的关系不清晰
   - 难以回溯整体学习路径
   - 无法看到知识全景图

✅ 画布化方案的优势：
   - 层级清晰：父子主题关系一目了然
   - 结构可视：知识图谱化呈现
   - 自由组织：按需展开、折叠、分组
   - 上下文传递：节点间可共享关键信息
```

---

## 一、MVP 功能范围定义

### 🎯 核心功能（必须有）

| 模块 | 功能 | 优先级 | 说明 |
|------|------|--------|------|
| **画布基础** | 无限平移缩放 | P0 | 鼠标拖拽平移，滚轮/触控板缩放 |
| | 网格背景 | P0 | 辅助对齐的视觉参考 |
| | 小地图导航 | P1 | 右下角缩略图，快速定位 |
| | 框选多选 | P1 | 框选多个节点批量操作 |
| **节点管理** | 添加节点 | P0 | 双击画布/侧边栏拖拽/快捷键 |
| | 删除节点 | P0 | Delete键/右键菜单 |
| | 复制节点 | P1 | Ctrl+C/V |
| | 节点拖拽 | P0 | 自由移动节点位置 |
| | 节点折叠/展开 | P1 | 复杂节点可折叠简化视图 |
| **聊天功能** | 流式输出 | P0 | SSE协议，打字机效果 |
| | 多轮对话 | P0 | 节点内完整对话上下文 |
| | 聊天记录持久化 | P0 | 刷新后保留聊天内容 |
| | Markdown渲染 | P0 | 支持代码块、列表等 |
| **连线系统** | 创建连线 | P0 | 拖拽端口连接节点 |
| | 删除连线 | P0 | 点击连线删除/右键菜单 |
| | 连线样式 | P0 | 贝塞尔曲线，方向箭头 |
| | 上下文传递 | P1 | 连线节点可共享关键信息 |
| **数据持久化** | 画布状态保存 | P0 | 节点位置、连线关系 |
| | 自动保存 | P1 | 定时自动保存到本地 |
| | 导入导出 | P2 | JSON格式导入导出画布 |

### 🚫 暂不包含（后续迭代）

| 功能 | 原因 |
|------|------|
| 多人协作编辑 | 复杂度高，需要后端支持 |
| AI智能建议节点 | 需要额外AI能力集成 |
| 复杂节点分组 | MVP聚焦核心功能 |
| 画布模板市场 | 需要生态建设 |
| 移动端适配 | 先聚焦桌面端体验 |

---

## 二、技术架构设计

### 🏗️ 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         前端应用层                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  画布组件   │  │  节点组件   │  │  聊天组件   │             │
│  │ (Canvas)    │  │  (Node)     │  │  (Chat)     │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│         │                │                │                      │
│         ▼                ▼                ▼                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              React Flow (画布引擎)                       │   │
│  │    • 节点管理  • 连线管理  • 视口控制  • 事件系统        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              状态管理层 (Zustand)                        │   │
│  │    • 画布状态  • 聊天状态  • UI状态  • 持久化           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                         后端服务层                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Next.js API Routes                          │   │
│  │    /api/chat  - 流式聊天接口 (SSE)                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              LLM 集成 (通过 Skill)                        │   │
│  │    • 豆包/DeepSeek/Kimi 流式调用                         │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 📦 技术栈选型

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **框架** | Next.js | 16+ | 全栈框架，App Router |
| **UI库** | React | 19+ | 前端框架 |
| **语言** | TypeScript | 5+ | 类型安全 |
| **画布引擎** | React Flow | 12+ | 节点、连线、画布核心 |
| **状态管理** | Zustand | 5+ | 轻量级状态管理 |
| **样式** | Tailwind CSS | 4+ | 原子化CSS |
| **组件库** | shadcn/ui | - | 基础UI组件 |
| **Markdown** | react-markdown | 9+ | 消息渲染 |
| **图标** | Lucide React | - | 图标库 |

---

## 三、数据模型设计

### 📊 核心数据结构

```typescript
// ==================== 画布数据模型 ====================

/** 画布元数据 */
interface CanvasMeta {
  id: string;           // 画布唯一ID
  title: string;        // 画布标题，如"机器学习学习笔记"
  description?: string; // 画布描述
  createdAt: number;    // 创建时间戳
  updatedAt: number;    // 更新时间戳
}

/** 聊天节点 */
interface ChatNode {
  id: string;           // 节点唯一ID
  type: 'chatNode';     // 节点类型
  position: {           // 节点位置
    x: number;
    y: number;
  };
  data: {
    title: string;      // 节点标题，如"监督学习"
    messages: Message[];// 聊天记录
    systemPrompt?: string; // 系统提示词（可选）
    tags?: string[];    // 用户自定义标签
    contextFrom?: string[]; // 从哪些节点继承上下文（连线来源）
    collapsed?: boolean; // 是否折叠
  };
}

/** 连线 */
interface ChatEdge {
  id: string;           // 连线唯一ID
  source: string;       // 源节点ID
  target: string;       // 目标节点ID
  sourceHandle?: string; // 源端口（可选）
  targetHandle?: string; // 目标端口（可选）
  type?: 'default' | 'context'; // 连线类型
  animated?: boolean;   // 是否动画
}

/** 消息 */
interface Message {
  id: string;           // 消息唯一ID
  role: 'user' | 'assistant' | 'system';
  content: string;      // 消息内容
  timestamp: number;    // 时间戳
  status?: 'pending' | 'streaming' | 'complete' | 'error';
}

/** 画布完整状态 */
interface CanvasState {
  meta: CanvasMeta;
  nodes: ChatNode[];
  edges: ChatEdge[];
  viewport?: {          // 视口状态
    x: number;
    y: number;
    zoom: number;
  };
}
```

### 💾 持久化策略

| 数据 | 存储位置 | 存储方式 | 时机 |
|------|---------|---------|------|
| 画布状态 | LocalStorage | JSON | 自动保存（防抖500ms） |
| 聊天记录 | LocalStorage | JSON | 每条消息后保存 |
| 视口状态 | LocalStorage | JSON | 视口变化后保存 |

---

## 四、组件架构设计

### 🧩 组件树结构

```
App
├── CanvasProvider          // React Flow Provider
│   ├── Canvas              // 画布主体
│   │   ├── CanvasBackground // 网格背景
│   │   ├── NodeTypes       // 节点类型注册
│   │   │   └── ChatNode    // 聊天节点组件
│   │   │       ├── NodeHeader    // 节点标题栏
│   │   │       ├── ChatMessages  // 消息列表
│   │   │       ├── ChatInput     // 输入框
│   │   │       └── NodeHandles   // 连接端口
│   │   ├── EdgeTypes       // 连线类型注册
│   │   │   └── ContextEdge // 上下文连线
│   │   └── MiniMap         // 小地图（可选）
│   ├── Toolbar             // 工具栏
│   │   ├── ZoomControls    // 缩放控制
│   │   ├── AddNodeButton   // 添加节点按钮
│   │   └── ExportButton    // 导出按钮
│   └── Sidebar             // 侧边栏（可选）
│       └── NodeList        // 节点列表大纲
└── StoreProvider           // Zustand Store
```

### 📐 聊天节点组件详细设计

```
┌─────────────────────────────────────────────────────────┐
│ ChatNode Component                                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ NodeHeader                                       │    │
│  │ ┌─────┐                                          │    │
│  │ │ 📖 │ 监督学习                    [折叠] [⋮]  │    │
│  │ └─────┘                                          │    │
│  │ 标签：#基础 #重要                                │    │
│  └─────────────────────────────────────────────────┘    │
│                          │                               │
│                          ▼                               │
│  ┌─────────────────────────────────────────────────┐    │
│  │ ChatMessages (可滚动区域)                        │    │
│  │                                                  │    │
│  │ ┌─────────────────────────────────────────────┐ │    │
│  │ │ MessageItem (AI)                            │ │    │
│  │ │ 监督学习是指从标注数据中学习的方法...        │ │    │
│  │ └─────────────────────────────────────────────┘ │    │
│  │                                                  │    │
│  │ ┌─────────────────────────────────────────────┐ │    │
│  │ │ MessageItem (User)                          │ │    │
│  │ │ 能举个例子吗？                               │ │    │
│  │ └─────────────────────────────────────────────┘ │    │
│  │                                                  │    │
│  │ ┌─────────────────────────────────────────────┐ │    │
│  │ │ MessageItem (AI) - Streaming                │ │    │
│  │ │ 比如垃圾邮件分类▊                            │ │    │
│  │ └─────────────────────────────────────────────┘ │    │
│  │                                                  │    │
│  └─────────────────────────────────────────────────┘    │
│                          │                               │
│                          ▼                               │
│  ┌─────────────────────────────────────────────────┐    │
│  │ ChatInput                                        │    │
│  │ ┌───────────────────────────────────────┐ [发送]│    │
│  │ │ 输入消息...                            │      │    │
│  │ └───────────────────────────────────────┘      │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ○ Input Handle          ○ Output Handle                │
│  (左侧接收上下文)         (右侧输出关键信息)              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 五、实现阶段规划

### 📅 五阶段迭代计划

```
阶段一：基础画布搭建 (P0核心)
├── 1.1 项目初始化 (Next.js + React Flow)
├── 1.2 画布基础组件
├── 1.3 节点基础框架
├── 1.4 连线基础功能
└── 1.5 画布状态持久化

阶段二：聊天节点核心 (P0核心)
├── 2.1 聊天UI组件
├── 2.2 消息渲染 (Markdown)
├── 2.3 输入交互
└── 2.4 节点内状态管理

阶段三：LLM集成 (P0核心)
├── 3.1 流式聊天API (SSE)
├── 3.2 前端流式消费
├── 3.3 错误处理与重试
└── 3.4 多模型支持

阶段四：上下文传递 (P1重要)
├── 4.1 连线数据传递机制
├── 4.2 上下文继承UI
├── 4.3 智能摘要生成
└── 4.4 引用其他节点内容

阶段五：体验优化 (P1-P2)
├── 5.1 节点折叠/展开
├── 5.2 小地图导航
├── 5.3 框选多选
├── 5.4 导入导出
└── 5.5 整体性能优化
```

---

## 六、各阶段详细任务分解

### 🚀 阶段一：基础画布搭建

#### 1.1 项目初始化
```yaml
任务清单:
  - 使用 coze init 初始化 Next.js 项目
  - 安装依赖: reactflow, zustand, react-markdown, lucide-react
  - 配置 Tailwind CSS
  - 创建基础目录结构:
    /src
    ├── app/
    │   ├── page.tsx          # 首页(画布页面)
    │   ├── layout.tsx        # 全局布局
    │   └── api/
    │       └── chat/
    │           └── route.ts  # 聊天API
    ├── components/
    │   ├── canvas/           # 画布相关组件
    │   ├── node/             # 节点相关组件
    │   ├── chat/             # 聊天相关组件
    │   └── ui/               # shadcn/ui 组件
    ├── store/                # Zustand stores
    │   └── canvasStore.ts
    └── types/                # TypeScript 类型定义
        └── index.ts
```

#### 1.2 画布基础组件
```yaml
文件: /src/components/canvas/Canvas.tsx

功能要点:
  - ReactFlow Provider 包装
  - 网格背景配置
  - 视口控制
  - 事件处理
  - 初始化示例节点

核心代码结构:
  <ReactFlow
    nodes={nodes}
    edges={edges}
    onNodesChange={onNodesChange}
    onEdgesChange={onEdgesChange}
    onConnect={onConnect}
    nodeTypes={nodeTypes}
    edgeTypes={edgeTypes}
    fitView
  >
    <Background variant={BackgroundVariant.Dots} />
    <Controls />
  </ReactFlow>
```

#### 1.3 节点基础框架
```yaml
文件: /src/components/node/ChatNode.tsx

功能要点:
  - 自定义节点组件
  - 基础布局结构
  - 连接端口定义
  - 拖拽支持

节点结构:
  ┌──────────────────┐
  │ 📖 新对话        │  ← 标题区
  ├──────────────────┤
  │                  │
  │   聊天区域       │  ← 初始为空
  │   (待实现)       │
  │                  │
  ├──────────────────┤
  │ 输入框 (待实现)  │  ← 输入区
  └──────────────────┘
  ○                ○   ← 左右端口
```

#### 1.4 连线基础功能
```yaml
功能要点:
  - 拖拽端口创建连线
  - 贝塞尔曲线样式
  - 连线删除 (选中后Delete键或点击删除)
  - 连线方向箭头

样式配置:
  edgeTypes: {
    default: ContextEdge  // 自定义连线组件
  }
  
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#6366f1'
  }
```

#### 1.5 画布状态持久化
```yaml
文件: /src/store/canvasStore.ts

功能要点:
  - Zustand store 定义
  - LocalStorage 读写
  - 防抖自动保存 (500ms)
  - 画布加载/保存方法

Store 结构:
  interface CanvasStore {
    // 状态
    nodes: ChatNode[];
    edges: ChatEdge[];
    selectedNodeId: string | null;
    
    // 方法
    addNode: (position: {x, y}) => void;
    updateNode: (id, data) => void;
    deleteNode: (id) => void;
    addEdge: (source, target) => void;
    deleteEdge: (id) => void;
    
    // 持久化
    saveToStorage: () => void;
    loadFromStorage: () => void;
  }
```

---

### 💬 阶段二：聊天节点核心

#### 2.1 聊天UI组件
```yaml
文件结构:
  /src/components/chat/
  ├── ChatMessages.tsx    # 消息列表容器
  ├── MessageItem.tsx     # 单条消息组件
  ├── ChatInput.tsx       # 输入框组件
  └── StreamingMessage.tsx # 流式消息组件

ChatMessages 功能:
  - 消息列表渲染
  - 自动滚动到底部
  - 加载状态显示

MessageItem 功能:
  - 用户/AI头像区分
  - Markdown渲染
  - 代码块语法高亮
  - 复制代码按钮

ChatInput 功能:
  - 文本输入框
  - 发送按钮
  - Enter发送 / Shift+Enter换行
  - 发送中禁用状态
```

#### 2.2 消息渲染 (Markdown)
```yaml
技术方案:
  - react-markdown 渲染Markdown
  - remark-gfm 支持GitHub风格Markdown
  - react-syntax-highlighter 代码高亮

代码块处理:
  // 自定义代码块组件
  const CodeBlock = ({ language, code }) => {
    const [copied, setCopied] = useState(false);
    
    return (
      <div className="relative">
        <button onClick={() => copyCode(code)}>
          {copied ? '已复制' : '复制'}
        </button>
        <SyntaxHighlighter language={language}>
          {code}
        </SyntaxHighlighter>
      </div>
    );
  };
```

#### 2.3 输入交互
```yaml
交互设计:
  - 输入框自动聚焦 (点击节点时)
  - 发送后自动滚动到底部
  - 发送时显示加载状态
  - 支持多行输入
  - 字符限制提示 (可选)

快捷键:
  - Enter: 发送消息
  - Shift + Enter: 换行
  - Escape: 取消输入焦点
```

#### 2.4 节点内状态管理
```yaml
状态设计:
  interface NodeChatState {
    nodeId: string;
    messages: Message[];
    input: string;
    isLoading: boolean;
    error: string | null;
  }

  // 每个节点的聊天状态独立管理
  // 通过 nodeId 关联
```

---

### 🤖 阶段三：LLM集成

#### 3.1 流式聊天API (SSE)
```yaml
文件: /src/app/api/chat/route.ts

技术方案:
  - 使用 LLM Skill 集成大模型
  - SSE (Server-Sent Events) 协议
  - ReadableStream 流式响应

API 设计:
  POST /api/chat
  Request Body:
    {
      "messages": [
        { "role": "user", "content": "什么是监督学习?" }
      ],
      "contextMessages?: Message[]  // 来自连线节点的上下文
    }
  
  Response:
    Content-Type: text/event-stream
    Transfer-Encoding: chunked
    
    data: {"type":"content","content":"监督"}
    data: {"type":"content","content":"学习"}
    data: {"type":"content","content":"是指"}
    data: {"type":"done"}
```

#### 3.2 前端流式消费
```yaml
文件: /src/lib/chatStream.ts

技术方案:
  - fetch API + ReadableStream
  - 逐字渲染 (打字机效果)
  - 中止控制器

核心代码:
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const content = parseSSE(chunk);
    
    // 更新消息内容
    setMessages(prev => {
      const last = prev[prev.length - 1];
      last.content += content;
      return [...prev];
    });
  }
```

#### 3.3 错误处理与重试
```yaml
错误类型:
  - 网络错误: 提示用户检查网络
  - API限流: 显示等待提示
  - Token超限: 提示清理历史消息
  - 模型错误: 显示错误信息

重试机制:
  - 自动重试: 最多3次，指数退避
  - 手动重试: 提供"重试"按钮
  - 降级策略: 主模型失败切换备用模型
```

#### 3.4 多模型支持
```yaml
模型配置:
  - 豆包 (Doubao) - 默认
  - DeepSeek - 备选
  - Kimi - 长文本场景

配置方式:
  interface ModelConfig {
    id: string;
    name: string;
    maxTokens: number;
    description: string;
  }
  
  // 用户可在设置中选择偏好模型
```

---

### 🔗 阶段四：上下文传递

#### 4.1 连线数据传递机制
```yaml
功能设计:
  - 连线表示上下文继承关系
  - 源节点的"关键信息"传递给目标节点
  - 可选择传递完整对话 or 摘要

数据流:
  [监督学习节点] ──连线──→ [决策树节点]
        │                        │
        └── 输出关键信息 ──────→ 作为上下文注入

实现方案:
  // 获取节点的上下文消息
  function getContextMessages(nodeId: string): Message[] {
    const incomingEdges = edges.filter(e => e.target === nodeId);
    const contextMessages = [];
    
    for (const edge of incomingEdges) {
      const sourceNode = getNode(edge.source);
      // 获取源节点的关键信息或摘要
      const summary = getNodeSummary(sourceNode);
      contextMessages.push({
        role: 'system',
        content: `【来自"${sourceNode.data.title}"的相关信息】\n${summary}`
      });
    }
    
    return contextMessages;
  }
```

#### 4.2 上下文继承UI
```yaml
节点UI增强:
  ┌──────────────────────────┐
  │ 📖 决策树                 │
  ├──────────────────────────┤
  │ 📥 继承上下文:            │
  │   • 监督学习 (基础概念)   │  ← 显示来源
  │   [管理上下文]            │
  ├──────────────────────────┤
  │ ...聊天内容...            │
  └──────────────────────────┘

上下文管理面板:
  - 显示所有连线来源
  - 可开关每个来源的继承
  - 预览继承的内容摘要
```

#### 4.3 智能摘要生成
```yaml
功能设计:
  - 每个节点可生成"关键信息摘要"
  - 摘要用于传递给下游节点
  - 避免传递完整对话导致Token超限

实现方案:
  - 用户手动生成摘要
  - AI自动提取关键点
  - 用户可编辑摘要内容

摘要结构:
  interface NodeSummary {
    keyPoints: string[];      // 关键要点
    conclusions: string[];    // 结论总结
    relatedTopics: string[];  // 相关主题
    createdAt: number;
  }
```

#### 4.4 引用其他节点内容
```yaml
快捷引用功能:
  - 输入 @ 触发节点列表
  - 选择节点插入引用
  - 引用内容作为上下文

示例:
  用户输入: "对比一下 @决策树 和 @神经网络 的区别"
  
  系统处理:
  1. 解析出引用的节点
  2. 获取节点摘要
  3. 组装为上下文发送给AI
```

---

### ✨ 阶段五：体验优化

#### 5.1 节点折叠/展开
```yaml
功能设计:
  - 点击节点标题栏折叠按钮
  - 折叠后只显示标题和标签
  - 节省画布空间

折叠状态:
  ┌──────────────────┐
  │ 📖 监督学习 [展开]│  ← 折叠后
  │ #基础 #重要      │
  └──────────────────┘
```

#### 5.2 小地图导航
```yaml
功能设计:
  - 右下角显示画布缩略图
  - 当前视口高亮
  - 点击快速跳转

React Flow 内置支持:
  <MiniMap 
    nodeColor={(node) => {
      return node.data.tags?.includes('重要') ? '#ef4444' : '#6366f1';
    }}
    maskColor="rgba(0,0,0,0.1)"
  />
```

#### 5.3 框选多选
```yaml
功能设计:
  - 拖拽框选多个节点
  - 批量移动/删除
  - React Flow 内置支持

配置:
  <ReactFlow
    selectionOnDrag
    panOnDrag={[1, 2]}  // 中键/右键拖拽画布
    selectionMode={SelectionMode.Partial}
  />
```

#### 5.4 导入导出
```yaml
功能设计:
  - 导出画布为JSON文件
  - 导入JSON恢复画布
  - 分享画布给他人

导出格式:
  {
    "meta": {
      "title": "机器学习学习笔记",
      "createdAt": 1234567890,
      ...
    },
    "nodes": [...],
    "edges": [...]
  }
```

#### 5.5 整体性能优化
```yaml
优化点:
  - 虚拟化: 节点内容懒加载
  - 防抖: 频繁操作防抖处理
  - 缓存: 聊天记录缓存
  - 懒渲染: 折叠节点不渲染内容

性能监控:
  - 节点数量警告 (>50个节点提示)
  - 消息数量限制 (单节点>100条提示归档)
```

---

## 七、关键交互流程

### 📝 创建新对话节点

```
用户操作                 系统响应
────────                ────────
双击画布空白处    →     在点击位置创建新节点
                     →   节点默认标题"新对话"
                     →   自动聚焦到输入框
                     →   用户可立即开始对话
```

### 💬 发送消息流程

```
用户                     前端                      后端
────                     ────                      ────
输入消息           →    
点击发送           →     添加用户消息到列表
                     →   添加空白AI消息
                     →   设置loading状态
                     →   POST /api/chat (stream)
                           →                    调用LLM Skill
                           →                    创建ReadableStream
                           ←                    返回SSE响应
                     →   读取stream
                     →   逐字更新AI消息
                     →   完成后保存到LocalStorage
```

### 🔗 创建上下文连线

```
用户操作                 系统响应
────────                ────────
拖拽节点右侧端口   →     显示可连接目标提示
拖到目标节点左侧   →     创建连线
                     →   目标节点显示"继承上下文"提示
                     →   后续对话自动注入上下文
```

---

## 八、项目目录结构最终形态

```
/workspace/projects/
├── src/
│   ├── app/
│   │   ├── page.tsx              # 画布主页
│   │   ├── layout.tsx            # 全局布局
│   │   └── api/
│   │       └── chat/
│   │           └── route.ts      # 流式聊天API
│   │
│   ├── components/
│   │   ├── canvas/
│   │   │   ├── Canvas.tsx        # 画布主体
│   │   │   ├── Toolbar.tsx       # 工具栏
│   │   │   └── MiniMap.tsx       # 小地图
│   │   │
│   │   ├── node/
│   │   │   ├── ChatNode.tsx      # 聊天节点
│   │   │   ├── NodeHeader.tsx    # 节点头部
│   │   │   └── NodeHandles.tsx   # 连接端口
│   │   │
│   │   ├── chat/
│   │   │   ├── ChatMessages.tsx  # 消息列表
│   │   │   ├── MessageItem.tsx   # 单条消息
│   │   │   ├── ChatInput.tsx     # 输入框
│   │   │   └── StreamingText.tsx # 流式文本
│   │   │
│   │   └── ui/                   # shadcn/ui组件
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       └── ...
│   │
│   ├── store/
│   │   ├── canvasStore.ts        # 画布状态
│   │   └── chatStore.ts          # 聊天状态
│   │
│   ├── lib/
│   │   ├── chatStream.ts         # 流式处理
│   │   ├── storage.ts            # 本地存储
│   │   └── utils.ts              # 工具函数
│   │
│   ├── types/
│   │   └── index.ts              # 类型定义
│   │
│   └── styles/
│       └── globals.css           # 全局样式
│
├── public/
│   └── ...                       # 静态资源
│
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── .coze                         # Coze配置
```

---

## 九、风险与应对

| 风险 | 影响 | 应对方案 |
|------|------|---------|
| React Flow性能瓶颈 | 节点多时卡顿 | 虚拟化渲染、节点折叠懒加载 |
| LLM API限流 | 无法正常对话 | 多模型备份、请求队列、友好提示 |
| Token超限 | 上下文传递失败 | 智能摘要、截断策略、用量提示 |
| LocalStorage容量限制 | 数据丢失 | IndexedDB备选、云端存储备选 |
| 浏览器兼容性 | 部分功能异常 | 明确支持的浏览器版本 |

---

## 十、验收标准

### ✅ 阶段一验收
- [ ] 画布可正常显示网格背景
- [ ] 可通过双击添加新节点
- [ ] 节点可自由拖拽移动
- [ ] 可通过拖拽端口创建连线
- [ ] 刷新页面后画布状态保留

### ✅ 阶段二验收
- [ ] 节点内可输入消息并发送
- [ ] AI回复正常显示
- [ ] 支持Markdown渲染
- [ ] 代码块语法高亮

### ✅ 阶段三验收
- [ ] AI回复流式显示(打字机效果)
- [ ] 错误时显示友好提示
- [ ] 支持重试功能

### ✅ 阶段四验收
- [ ] 连线后目标节点显示上下文来源
- [ ] 对话时自动注入上下文
- [ ] 可管理/开关上下文继承

### ✅ 阶段五验收
- [ ] 节点可折叠/展开
- [ ] 小地图正常显示
- [ ] 支持导出/导入画布JSON

---

## 十一、设计风格指南

### 🎨 整体设计方向

**气质与意象**：
- 关键词：优雅、现代、流畅、专业、沉浸感
- 具象场景：深夜专注工作的开发者，在一张无限延伸的白色工作台上，用流畅的笔画勾勒思维导图，每个节点都是一个微型的对话窗口，光线柔和地从节点中溢出

**视觉策略**：
- 深色主题为主，营造沉浸专注感
- 节点采用毛玻璃效果，增加层次感
- 连线采用渐变发光效果，体现数据流动感
- 微妙的阴影和光晕，增强立体感

### 🎨 配色方案

```css
/* 主色调 - 深邃优雅 */
--background: #0a0a0f;           /* 深空背景 */
--canvas-bg: #12121a;            /* 画布背景 */
--grid-color: rgba(99, 102, 241, 0.1); /* 网格线 */

/* 节点颜色 */
--node-bg: rgba(30, 30, 45, 0.8); /* 节点背景 - 毛玻璃 */
--node-border: rgba(99, 102, 241, 0.3); /* 节点边框 */
--node-header: rgba(99, 102, 241, 0.15); /* 节点头部 */

/* 强调色 - 靛蓝紫 */
--primary: #6366f1;              /* 主强调色 */
--primary-light: #818cf8;        /* 浅色变体 */
--primary-dark: #4f46e5;         /* 深色变体 */

/* 辅助色 */
--accent-success: #10b981;       /* 成功/在线 */
--accent-warning: #f59e0b;       /* 警告/加载 */
--accent-error: #ef4444;         /* 错误 */

/* 文字颜色 */
--text-primary: #f8fafc;         /* 主文字 */
--text-secondary: #94a3b8;       /* 次要文字 */
--text-muted: #64748b;           /* 弱化文字 */

/* 连线颜色 */
--edge-default: rgba(99, 102, 241, 0.5);
--edge-active: #6366f1;
--edge-glow: rgba(99, 102, 241, 0.3);
```

### 📝 字体排版

```css
/* 推荐字体 */
--font-display: 'Plus Jakarta Sans', sans-serif; /* 标题字体 */
--font-body: 'Inter', sans-serif;                /* 正文字体 */
--font-mono: 'JetBrains Mono', monospace;        /* 代码字体 */

/* 字体大小 */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */

/* 行高 */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

### ✨ 动效设计

```css
/* 过渡曲线 */
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);

/* 动画时长 */
--duration-fast: 150ms;
--duration-normal: 300ms;
--duration-slow: 500ms;

/* 关键动效 */
- 节点创建：缩放 + 淡入 (200ms)
- 节点拖拽：实时响应 + 阴影增强
- 连线创建：路径绘制动画
- 消息出现：滑入 + 淡入
- 流式输出：打字机效果
```

---

## 📝 更新日志

| 日期 | 版本 | 更新内容 |
|------|------|---------|
| 2025-01 | v1.0 | 初始设计文档创建 |

---

*此文档将随项目进展持续更新*
