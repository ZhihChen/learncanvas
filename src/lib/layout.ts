/**
 * 画布布局算法
 * 支持树形布局、力导向布局等
 */

import dagre from 'dagre';
import type { ChatNode, ChatEdge } from '@/types';

// 布局方向
export type LayoutDirection = 'TB' | 'LR' | 'BT' | 'RL';

// 布局选项
export interface LayoutOptions {
  direction?: LayoutDirection;
  nodeWidth?: number;
  nodeHeight?: number;
  nodesep?: number;   // 同层节点间距
  ranksep?: number;   // 层级间距
  align?: 'UL' | 'UR' | 'DL' | 'DR';
}

// 默认布局选项
const defaultOptions: LayoutOptions = {
  direction: 'TB',    // 从上到下（树形）
  nodeWidth: 380,
  nodeHeight: 280,
  nodesep: 80,
  ranksep: 120,
};

/**
 * 使用 dagre 算法进行自动布局
 * 适用于树形结构
 */
export function layoutTree(
  nodes: ChatNode[],
  edges: ChatEdge[],
  options: LayoutOptions = {}
): ChatNode[] {
  if (nodes.length === 0) return nodes;
  
  const opts = { ...defaultOptions, ...options };
  
  // 创建 dagre 图
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: opts.direction,
    nodesep: opts.nodesep,
    ranksep: opts.ranksep,
    align: opts.align,
    marginx: 50,
    marginy: 50,
  });
  g.setDefaultEdgeLabel(() => ({}));
  
  // 添加节点
  nodes.forEach((node) => {
    const width = node.type === 'groupNode' ? 450 : opts.nodeWidth!;
    const height = node.type === 'groupNode' 
      ? (node.data.collapsed ? 56 : 200) 
      : (node.data.collapsed ? 56 : opts.nodeHeight!);
    
    g.setNode(node.id, { width, height });
  });
  
  // 添加边（只添加层级关系的边）
  edges.forEach((edge) => {
    // 判断是否为层级连线（通过端口判断）
    const isHierarchyEdge = 
      (edge.sourceHandle?.includes('bottom') && edge.targetHandle?.includes('top')) ||
      (edge.sourceHandle?.includes('right') && edge.targetHandle?.includes('left') && opts.direction === 'LR') ||
      (!edge.sourceHandle && !edge.targetHandle); // 默认视为层级
    
    if (isHierarchyEdge) {
      g.setEdge(edge.source, edge.target);
    }
  });
  
  // 执行布局
  dagre.layout(g);
  
  // 返回新位置的节点
  return nodes.map((node) => {
    const nodeData = g.node(node.id);
    if (nodeData) {
      const width = node.type === 'groupNode' ? 450 : opts.nodeWidth!;
      const height = node.type === 'groupNode' 
        ? (node.data.collapsed ? 56 : 200) 
        : (node.data.collapsed ? 56 : opts.nodeHeight!);
      
      return {
        ...node,
        position: {
          x: nodeData.x - width / 2,
          y: nodeData.y - height / 2,
        },
      };
    }
    return node;
  });
}

/**
 * 水平树形布局
 */
export function layoutHorizontal(
  nodes: ChatNode[],
  edges: ChatEdge[]
): ChatNode[] {
  return layoutTree(nodes, edges, { direction: 'LR' });
}

/**
 * 垂直树形布局（默认）
 */
export function layoutVertical(
  nodes: ChatNode[],
  edges: ChatEdge[]
): ChatNode[] {
  return layoutTree(nodes, edges, { direction: 'TB' });
}

/**
 * 自由布局（按网格排列）
 */
export function layoutGrid(
  nodes: ChatNode[],
  _edges: ChatEdge[],
  columns: number = 3
): ChatNode[] {
  if (nodes.length === 0) return nodes;
  
  const nodeWidth = 380;
  const nodeHeight = 280;
  const gapX = 100;
  const gapY = 120;
  const startX = 50;
  const startY = 50;
  
  return nodes.map((node, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    
    return {
      ...node,
      position: {
        x: startX + col * (nodeWidth + gapX),
        y: startY + row * (nodeHeight + gapY),
      },
    };
  });
}

/**
 * 紧凑布局（自动计算最佳排列）
 */
export function layoutCompact(
  nodes: ChatNode[],
  edges: ChatEdge[]
): ChatNode[] {
  if (nodes.length === 0) return nodes;
  
  // 先尝试树形布局
  const laidOutNodes = layoutTree(nodes, edges);
  
  // 计算边界框
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;
  
  laidOutNodes.forEach(node => {
    const width = node.type === 'groupNode' ? 450 : 380;
    const height = node.type === 'groupNode' ? 200 : 280;
    
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + width);
    maxY = Math.max(maxY, node.position.y + height);
  });
  
  // 平移到原点
  const offsetX = -minX + 50;
  const offsetY = -minY + 50;
  
  return laidOutNodes.map(node => ({
    ...node,
    position: {
      x: node.position.x + offsetX,
      y: node.position.y + offsetY,
    },
  }));
}

/**
 * 智能布局（根据节点数量和连线关系自动选择）
 */
export function layoutAuto(
  nodes: ChatNode[],
  edges: ChatEdge[]
): ChatNode[] {
  if (nodes.length === 0) return nodes;
  
  // 如果没有连线，使用网格布局
  if (edges.length === 0) {
    const columns = Math.ceil(Math.sqrt(nodes.length));
    return layoutGrid(nodes, edges, columns);
  }
  
  // 如果有连线，使用树形布局
  return layoutCompact(nodes, edges);
}

/**
 * 获取画布的边界框
 */
export function getBoundingBox(nodes: ChatNode[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (nodes.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;
  
  nodes.forEach(node => {
    const width = node.type === 'groupNode' ? 450 : 380;
    const height = node.type === 'groupNode' ? 200 : 280;
    
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + width);
    maxY = Math.max(maxY, node.position.y + height);
  });
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
