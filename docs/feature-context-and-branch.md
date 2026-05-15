# 上下文传递优化 & 分支节点功能设计

## 一、功能概述

### 1.1 上下文传递优化
**目标**：确保下游节点能智能获取上游节点的关键信息，而不是简单堆砌消息。

**现有问题**：
- 只获取直接连接的节点，没有递归获取完整的上游链路
- 没有智能摘要，可能传递大量无用信息
- 没有区分连线类型（层级传递 vs 引用关联）

**解决方案**：
- 递归获取所有上游节点（BFS 遍历）
- 根据距离和连线类型智能聚合上下文
- 使用摘要 API 精简上下文

### 1.2 分支节点快捷操作
**目标**：在对话中选中文字后，一键创建衍生节点深入讨论。

**用户场景**：
小明在学习"线性表"时，对"指针操作"有疑惑，选中相关文字后点击"分支"，自动创建新节点深入讨论这个问题，不影响主线学习。

**实现方式**：
- 在划线菜单中新增"分支"选项
- 点击后自动创建节点并建立引用连线
- 新节点预填充选中内容作为上下文

---

## 二、技术设计

### 2.1 上下文传递优化

#### 2.1.1 数据结构
```typescript
// 上下文节点信息
interface ContextNode {
  id: string;
  title: string;
  summary?: string;       // 摘要（优先使用）
  lastMessages: Message[]; // 最后几条消息（备选）
  distance: number;       // 距离当前节点的跳数
  relationType: EdgeRelationType; // 连线类型
  enabled: boolean;       // 是否启用
}

// 上下文聚合策略
interface ContextAggregationConfig {
  maxNodes: number;       // 最多包含多少个上游节点（默认 5）
  maxMessagesPerNode: number; // 每个节点最多包含多少条消息（默认 3）
  maxTotalLength: number; // 上下文总长度限制（默认 2000 字符）
  preferSummary: boolean; // 是否优先使用摘要（默认 true）
}
```

#### 2.1.2 核心函数
```typescript
/**
 * 递归获取所有上游节点
 * @param nodeId 当前节点 ID
 * @param maxDepth 最大递归深度（默认 3）
 * @returns 按距离排序的上游节点列表
 */
function getUpstreamNodes(nodeId: string, maxDepth: number = 3): ContextNode[]

/**
 * 智能聚合上下文
 * @param nodes 上游节点列表
 * @param config 聚合配置
 * @returns 聚合后的上下文消息
 */
function aggregateContext(nodes: ContextNode[], config: ContextAggregationConfig): Message[]

/**
 * 构建上下文摘要（如果节点没有摘要，调用 API 生成）
 * @param node 节点信息
 * @returns 摘要文本
 */
async function ensureSummary(node: ContextNode): Promise<string>
```

#### 2.1.3 上下文构建流程
```
1. 从当前节点开始，BFS 遍历所有上游节点
   ↓
2. 按距离排序（距离越近，权重越高）
   ↓
3. 过滤已禁用的上下文源
   ↓
4. 为每个节点确保有摘要（没有则调用 API 生成）
   ↓
5. 智能聚合（根据配置限制总长度）
   ↓
6. 返回上下文消息数组
```

#### 2.1.4 连线类型处理
- **层级传递（上下连线）**：完整传递上下文，距离权重高
- **引用关联（左右连线）**：只传递关键信息，距离权重低

### 2.2 分支节点功能

#### 2.2.1 UI 变化
在 `HighlightMenu` 组件中新增按钮：
```
[摘录] [笔记] [提问] [🌿 分支]
```

#### 2.2.2 分支节点创建流程
```
1. 用户选中文本
   ↓
2. 点击"分支"按钮
   ↓
3. 调用 createDerivedNode(sourceNodeId, selectedText, context)
   ↓
4. 自动创建新节点：
   - 标题：深入：{选中文字前20字}...
   - 位置：源节点右侧（+450px）
   - 预设消息：包含选中文本和上下文
   ↓
5. 自动创建引用连线：
   - sourceHandle: 'right-source'
   - targetHandle: 'left-target'
   - relationType: 'reference'
   ↓
6. 新节点自动获得焦点
```

#### 2.2.3 分支节点的智能初始化
```typescript
// 新节点的第一条消息（预设）
{
  role: 'user',
  content: `我想深入了解这个问题。

**问题：** ${selectedText}

**上下文：**
${contextBefore}
${selectedText}
${contextAfter}

请帮我详细解释这个概念。`
}
```

---

## 三、实现计划

### Phase 1: 上下文传递优化（核心）

#### 步骤 1.1：实现上游节点递归获取
- 文件：`src/lib/contextUtils.ts`（新建）
- 函数：`getUpstreamNodes()`
- 功能：BFS 遍历获取所有上游节点

#### 步骤 1.2：实现智能上下文聚合
- 文件：`src/lib/contextUtils.ts`
- 函数：`aggregateContext()`
- 功能：根据配置聚合上下文，限制总长度

#### 步骤 1.3：集成到 ChatNode
- 文件：`src/components/node/ChatNode.tsx`
- 修改：`getContextMessages()` 函数
- 功能：使用新的上下文聚合逻辑

### Phase 2: 分支节点功能

#### 步骤 2.1：更新划线菜单
- 文件：`src/components/excerpt/HighlightMenu.tsx`
- 修改：添加"分支"按钮

#### 步骤 2.2：实现分支节点创建
- 文件：`src/store/canvasStore.ts`
- 函数：`createDerivedNode()`（已存在，需要优化）
- 功能：智能创建分支节点

#### 步骤 2.3：处理分支操作
- 文件：`src/components/node/ChatNode.tsx`
- 修改：`handleHighlightMenuAction()`
- 功能：处理"分支"操作

### Phase 3: 测试与优化

#### 步骤 3.1：单元测试
- 测试上下文聚合逻辑
- 测试分支节点创建

#### 步骤 3.2：集成测试
- 测试完整流程
- 测试边界情况

---

## 四、数据流示意

### 4.1 上下文传递流程
```
[节点 A] ──层级──> [节点 B] ──层级──> [节点 C（当前）]
   │                  │
   └──引用──> [节点 D]

构建上下文时：
1. 先找节点 B（距离 1，层级传递）→ 权重高，完整传递
2. 再找节点 A（距离 2，层级传递）→ 权重中，传递摘要
3. 找节点 D（距离 2，引用关联）→ 权重低，只传关键信息

最终上下文 = [
  { role: 'system', content: '【来自"节点 B"的上下文】...' },
  { role: 'system', content: '【来自"节点 A"的上下文】...' },
  { role: 'system', content: '【来自"节点 D"的参考信息】...' }
]
```

### 4.2 分支节点创建流程
```
[节点：学习线性表]
   │
   │ 用户选中："指针是 C 语言的难点..."
   │ 点击"分支"
   ↓
[节点：学习线性表] ──引用──> [节点：深入：指针是 C 语言的难点...]
                                 │
                                 └─ 预设消息：
                                    "我想深入了解这个问题。
                                     问题：指针是 C 语言的难点...
                                     上下文：..."
```

---

## 五、注意事项

### 5.1 性能优化
- 缓存上游节点查询结果
- 延迟生成摘要（首次访问时生成）
- 限制递归深度（默认 3 层）

### 5.2 用户体验
- 分支节点创建后自动获得焦点
- 显示加载状态（如果需要生成摘要）
- 提供撤销操作（历史记录支持）

### 5.3 边界情况
- 循环引用检测（防止无限递归）
- 空节点处理（没有消息的节点）
- 超长上下文截断
