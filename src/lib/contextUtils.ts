/**
 * 上下文工具函数
 * 用于递归获取上游节点并智能聚合上下文
 * 支持连线级别的上下文传递策略配置
 */

import type { Node, Edge } from '@xyflow/react';
import type { 
  Message, 
  EdgeRelationType, 
  ChatNode, 
  ChatEdge,
  ContextTransferStrategy,
  ContextTransferConfig 
} from '@/types';

// ==================== 类型定义 ====================

/**
 * 上下文节点信息
 */
export interface ContextNode {
  id: string;
  title: string;
  summary?: string; // 摘要（优先使用）
  messages: Message[]; // 根据策略选择的消息
  distance: number; // 距离当前节点的跳数
  relationType: EdgeRelationType; // 连线类型
  enabled: boolean; // 是否启用（来自连线的 contextConfig.enabled）
  config?: ContextTransferConfig; // 连线的上下文配置
}

/**
 * 上下文聚合配置
 */
export interface ContextAggregationConfig {
  maxNodes: number; // 最多包含多少个上游节点
  maxTotalLength: number; // 上下文总长度限制（字符数）
}

// 默认配置
const DEFAULT_CONFIG: ContextAggregationConfig = {
  maxNodes: 5,
  maxTotalLength: 3000,
};

// ==================== 核心函数 ====================

/**
 * 根据连线配置策略获取消息
 */
function getMessagesByStrategy(
  allMessages: Message[],
  summary: string | undefined,
  config: ContextTransferConfig | undefined
): Message[] {
  // 如果没有配置或配置未启用，默认传递最后3条
  if (!config || config.enabled === false) {
    return allMessages.slice(-3);
  }

  switch (config.strategy) {
    case 'all':
      // 全部传递
      return allMessages;

    case 'summary':
      // 智能摘要：如果有摘要则作为一条 system 消息
      if (summary) {
        return [{
          id: `summary-${Date.now()}`,
          role: 'system',
          content: `【对话摘要】\n${summary}`,
          timestamp: Date.now(),
        }];
      }
      // 没有摘要则回退到最近3条
      return allMessages.slice(-3);

    case 'recent':
      // 最近N条消息
      const count = config.recentCount || 3;
      return allMessages.slice(-count);

    case 'custom':
      // 自定义选择
      if (config.customMessageIds && config.customMessageIds.length > 0) {
        return allMessages.filter(m => config.customMessageIds!.includes(m.id));
      }
      return [];

    default:
      return allMessages.slice(-3);
  }
}

/**
 * 递归获取所有上游节点（BFS 遍历）
 * @param nodeId 当前节点 ID
 * @param nodes 画布中的所有节点
 * @param edges 画布中的所有连线
 * @param nodeContextEnabled 节点级别的上下文启用配置（快捷开关）
 * @param maxDepth 最大递归深度
 * @returns 按距离排序的上游节点列表
 */
export function getUpstreamNodes(
  nodeId: string,
  nodes: ChatNode[],
  edges: ChatEdge[],
  nodeContextEnabled: { [nodeId: string]: boolean } = {},
  maxDepth: number = 3
): ContextNode[] {
  const result: ContextNode[] = [];
  const visited = new Set<string>();
  const queue: Array<{ id: string; distance: number }> = [{ id: nodeId, distance: 0 }];

  visited.add(nodeId);

  while (queue.length > 0) {
    const current = queue.shift()!;

    // 如果已达到最大深度，停止搜索
    if (current.distance >= maxDepth) continue;

    // 查找所有连接到当前节点的边（上游节点）
    const incomingEdges = edges.filter(
      (edge) => edge.target === current.id && edge.type === 'context'
    );

    for (const edge of incomingEdges) {
      const sourceId = edge.source;

      // 防止循环引用
      if (visited.has(sourceId)) continue;

      visited.add(sourceId);

      // 查找源节点
      const sourceNode = nodes.find((n) => n.id === sourceId);
      if (!sourceNode) continue;

      // 获取连线类型
      const relationType = (edge.data?.relationType as EdgeRelationType) || 'hierarchy';

      // 获取连线配置（关键修改：从 edge.data.contextConfig 读取）
      const config = edge.data?.contextConfig as ContextTransferConfig | undefined;

      // 检查是否启用（需要同时满足两个条件：节点级别启用 AND 连线级别启用）
      // 1. 节点级别的快捷开关（默认启用）
      const nodeEnabled = nodeContextEnabled[sourceId] !== false;
      // 2. 连线级别的配置开关（默认启用）
      const edgeEnabled = config ? config.enabled !== false : true;
      // 最终启用状态：两者都为 true 才启用
      const enabled = nodeEnabled && edgeEnabled;

      // 获取所有消息
      const allMessages = sourceNode.data.messages || [];
      const summary = sourceNode.data.summary;

      // 根据策略获取消息
      const messages = getMessagesByStrategy(allMessages, summary, config);

      result.push({
        id: sourceId,
        title: sourceNode.data.title || '未命名节点',
        summary,
        messages,
        distance: current.distance + 1,
        relationType,
        enabled,
        config,
      });

      // 继续向上游搜索
      queue.push({ id: sourceId, distance: current.distance + 1 });
    }
  }

  // 按距离和连线类型排序
  // 距离近的优先，层级传递优先于引用关联
  result.sort((a, b) => {
    // 先按距离排序
    if (a.distance !== b.distance) {
      return a.distance - b.distance;
    }
    // 距离相同时，层级传递优先
    const typeOrder: Record<EdgeRelationType, number> = {
      hierarchy: 0,
      reference: 1,
    };
    return typeOrder[a.relationType] - typeOrder[b.relationType];
  });

  return result;
}

/**
 * 智能聚合上下文
 * @param contextNodes 上游节点列表
 * @param config 聚合配置
 * @returns 聚合后的上下文消息
 */
export function aggregateContext(
  contextNodes: ContextNode[],
  config: Partial<ContextAggregationConfig> = {}
): Message[] {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const messages: Message[] = [];
  let totalLength = 0;

  // 过滤已禁用的节点
  const enabledNodes = contextNodes.filter((node) => node.enabled);

  // 限制节点数量
  const limitedNodes = enabledNodes.slice(0, finalConfig.maxNodes);

  for (const node of limitedNodes) {
    // 如果没有消息，跳过
    if (node.messages.length === 0) continue;

    // 构建上下文内容
    let content = '';

    // 检查是否有摘要消息（summary 策略会产生）
    const hasSummaryMessage = node.messages.length === 1 && 
      node.messages[0].role === 'system' &&
      node.messages[0].content.startsWith('【对话摘要】');

    if (hasSummaryMessage) {
      // 摘要模式：直接使用摘要消息
      content = node.messages[0].content;
    } else {
      // 普通模式：格式化消息
      content = node.messages
        .map((m) => {
          const roleLabel = m.role === 'user' ? '用户' : 
                           m.role === 'assistant' ? 'AI' : '系统';
          return `${roleLabel}: ${m.content}`;
        })
        .join('\n');
    }

    // 如果内容为空，跳过
    if (!content) continue;

    // 检查总长度限制
    const prefix = node.relationType === 'hierarchy' ? '【上下文' : '【参考';
    const strategyLabel = node.config?.strategy === 'all' ? '（全部）' :
                          node.config?.strategy === 'summary' ? '（摘要）' :
                          node.config?.strategy === 'recent' ? `（最近${node.config.recentCount || 3}条）` :
                          node.config?.strategy === 'custom' ? '（自定义）' : '';
    const fullContent = `${prefix}："${node.title}"】${strategyLabel}\n${content}`;

    if (totalLength + fullContent.length > finalConfig.maxTotalLength) {
      // 截断内容
      const remaining = finalConfig.maxTotalLength - totalLength;
      if (remaining > 100) {
        // 至少保留 100 字符
        const truncatedContent = fullContent.slice(0, remaining - 20) + '...\n[内容已截断]';
        messages.push({
          id: `context-${node.id}`,
          role: 'system',
          content: truncatedContent,
          timestamp: Date.now(),
        });
        totalLength += truncatedContent.length;
      }
      break;
    }

    messages.push({
      id: `context-${node.id}`,
      role: 'system',
      content: fullContent,
      timestamp: Date.now(),
    });

    totalLength += fullContent.length;
  }

  return messages;
}
