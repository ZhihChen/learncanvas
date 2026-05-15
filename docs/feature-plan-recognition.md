# 智能计划识别与节点生成功能设计

## 一、核心场景

### 用户故事
小明想学习数据结构，在初始对话中说明需求后，AI给出学习计划。小明认可计划后，一键生成多个独立的学习节点，每个节点对应一个学习步骤。

### 核心价值
1. **解决上下文窗口限制** - 每个学习部分独立对话，不会混淆
2. **结构化学习路径** - 可视化的学习树，一目了然
3. **灵活衍生** - 遇到问题时可以单独深入，不影响主线
4. **便于回顾和分享** - 每个知识点独立可查

---

## 二、功能设计

### 2.1 计划识别 API

#### API 设计
```typescript
POST /api/plan/extract

// 请求
{
  messages: Message[],  // 对话历史
  contextNodeId: string // 当前节点ID（用于后续创建）
}

// 响应
{
  hasPlan: boolean,
  plan: {
    title: string,           // 计划标题
    description: string,     // 计划描述
    steps: Array<{
      id: string,            // 步骤ID
      title: string,         // 步骤标题
      description: string,   // 步骤描述
      estimatedTime?: string // 预估时间
    }>
  } | null
}
```

#### Prompt 设计
```typescript
const PLAN_EXTRACTION_PROMPT = `你是一个学习计划识别助手。请分析用户的对话历史，识别是否包含结构化的学习计划或任务列表。

识别规则：
1. 必须是明确的多步骤计划（至少2个步骤）
2. 步骤之间有逻辑顺序或依赖关系
3. 每个步骤是独立可执行的任务

返回格式：
{
  "hasPlan": true/false,
  "plan": {
    "title": "计划标题",
    "description": "计划概述",
    "steps": [
      { "title": "步骤1标题", "description": "步骤1详细描述" },
      { "title": "步骤2标题", "description": "步骤2详细描述" }
    ]
  }
}

如果未识别到有效计划，返回：
{ "hasPlan": false, "plan": null }`;
```

### 2.2 一键生成节点

#### UI 设计
在对话节点底部显示操作按钮：

```
┌─────────────────────────────────┐
│  AI: 好的，我建议分5步学习：     │
│  1. 线性表                      │
│  2. 栈和队列                    │
│  ...                           │
│                                 │
│  [📊 识别到学习计划（5个步骤）]  │
│                                 │
│  [✨ 按计划创建学习节点]         │ ← 点击生成节点树
└─────────────────────────────────┘
```

#### 节点生成逻辑
```typescript
async function createNodesFromPlan(
  sourceNodeId: string,
  plan: Plan
): Promise<void> {
  const sourceNode = getNode(sourceNodeId);
  
  // 计算布局位置（树状向下展开）
  const startY = sourceNode.position.y + 200;
  const spacing = 300; // 节点间距
  
  plan.steps.forEach((step, index) => {
    const newNode = {
      id: generateId(),
      type: 'chatNode',
      position: {
        x: sourceNode.position.x + (index - plan.steps.length/2) * spacing,
        y: startY
      },
      data: {
        title: step.title,
        messages: [{
          role: 'assistant',
          content: `这是「${plan.title}」的第${index + 1}步：${step.title}\n\n${step.description}\n\n你可以在这里开始学习这部分内容。`,
          timestamp: Date.now()
        }],
        contextFrom: [sourceNodeId], // 继承上游上下文
      }
    };
    
    // 创建节点
    addNode(newNode);
    
    // 创建连线（层级传递）
    addEdge({
      id: generateId(),
      source: sourceNodeId,
      target: newNode.id,
      sourceHandle: 'bottom-source',
      targetHandle: 'top-target',
      type: 'context',
      data: {
        relationType: 'hierarchy', // 层级传递
        transferStrategy: 'full'   // 完整传递上下文
      }
    });
  });
}
```

### 2.3 上下文传递优化

#### 当前问题
现在连线只是视觉上的连接，上下文传递不够智能。

#### 优化方案
```typescript
// 构建上下文时，递归获取上游节点的关键信息
function buildContextForNode(nodeId: string): Message[] {
  const context: Message[] = [];
  
  // 获取所有上游节点（通过 BFS 遍历）
  const upstreamNodes = getUpstreamNodes(nodeId);
  
  // 按距离排序，越近的节点权重越高
  upstreamNodes.sort((a, b) => b.distance - a.distance);
  
  // 构建上下文摘要
  upstreamNodes.forEach(node => {
    // 只取每个节点的关键信息（标题 + 最后一条消息摘要）
    const summary = summarizeNode(node);
    context.push({
      role: 'system',
      content: `[来自「${node.data.title}」的上下文]\n${summary}`
    });
  });
  
  return context;
}
```

### 2.4 衍生节点快捷操作

#### 场景
小明在学习"线性表"时，对"指针"有疑惑，想单独深入讨论。

#### UI 设计
```
┌─────────────────────────────────┐
│  [线性表学习节点]                │
│  小明: 指针这块不太懂...         │
│  AI: 指针是C语言的难点...        │
│                                 │
│  用户选中: "指针这块不太懂"       │
│  弹出菜单:                       │
│  ┌────────────────┐            │
│  │ 📌 摘录到笔记   │            │
│  │ 🌿 衍生新对话   │ ← 新功能   │
│  │ ❓ 追问        │            │
│  └────────────────┘            │
└─────────────────────────────────┘
```

#### 衍生节点逻辑
```typescript
function createDerivedNode(
  sourceNodeId: string,
  selectedText: string,
  context: string
): void {
  const sourceNode = getNode(sourceNodeId);
  
  const newNode = {
    id: generateId(),
    type: 'chatNode',
    position: {
      x: sourceNode.position.x + 400, // 在右侧生成
      y: sourceNode.position.y
    },
    data: {
      title: `深入：${selectedText.slice(0, 20)}...`,
      messages: [{
        role: 'user',
        content: `我想深入了解「${selectedText}」这个问题。\n\n上下文：${context}`,
        timestamp: Date.now()
      }],
      contextFrom: [sourceNodeId]
    }
  };
  
  addNode(newNode);
  
  // 创建引用连线（左右连接）
  addEdge({
    source: sourceNodeId,
    target: newNode.id,
    sourceHandle: 'right-source',
    targetHandle: 'left-target',
    type: 'context',
    data: {
      relationType: 'reference', // 引用关联
      transferStrategy: 'focused' // 聚焦传递
    }
  });
}
```

### 2.5 学习进度可视化

#### 设计方案
在节点上显示进度状态：

```
┌─────────────────────────┐
│ ✓ 线性表      [已完成]  │ ← 绿色边框
│ ○ 栈和队列    [学习中]  │ ← 黄色边框
│ ○ 树          [未开始]  │ ← 灰色边框
└─────────────────────────┘
```

#### 状态定义
```typescript
type NodeProgress = 'not_started' | 'in_progress' | 'completed';

interface ChatNodeData {
  // ... 现有字段
  progress?: NodeProgress;
  startedAt?: number;
  completedAt?: number;
}
```

---

## 三、用户流程示意

### 完整流程
```
1. 用户创建初始对话节点
   ↓
2. 说明学习目标："我要学数据结构，用严蔚敏版..."
   ↓
3. AI 给出学习计划（5个步骤）
   ↓
4. 系统识别计划，显示"识别到学习计划"提示
   ↓
5. 用户点击"按计划创建学习节点"
   ↓
6. 自动生成5个学习节点，每个节点包含：
   - 预设的学习内容
   - 与上游节点的连线（层级传递）
   - 独立的上下文环境
   ↓
7. 用户进入某个节点开始学习
   ↓
8. 遇到问题时，选中内容点击"衍生新对话"
   ↓
9. 在右侧创建衍生节点，深入讨论该问题
   ↓
10. 完成后回到主节点，标记为"已完成"
```

---

## 四、技术实现要点

### 4.1 API 实现
- `/api/plan/extract` - 计划识别
- 复用现有 `/api/chat` - 流式对话

### 4.2 状态管理
```typescript
// 新增状态
interface PlanState {
  isDetected: boolean;
  plan: Plan | null;
  sourceNodeId: string | null;
}

// 新增 actions
createNodesFromPlan()
createDerivedNode()
updateNodeProgress()
```

### 4.3 UI 组件
1. `PlanDetector` - 计划识别提示组件
2. `DerivedNodeMenu` - 衍生节点菜单
3. `ProgressIndicator` - 进度指示器

---

## 五、MVP 优先级

### P0 - 必须实现
1. 计划识别 API
2. 一键生成节点
3. 上下文传递优化

### P1 - 应该实现
1. 衍生节点快捷操作
2. 学习进度标记

### P2 - 可以延后
1. 进度统计面板
2. 学习时间估算
3. 计划模板库
