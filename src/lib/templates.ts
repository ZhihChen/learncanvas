/**
 * 画布模板数据
 * 预置多种场景模板，帮助用户快速开始
 */

import type { ChatNode, ChatEdge } from '@/types';

// 模板类型
export interface CanvasTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'learning' | 'project' | 'brainstorm' | 'research';
  nodes: Array<{
    id: string;
    type: 'chatNode' | 'groupNode';
    position: { x: number; y: number };
    data: Record<string, unknown>;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    data?: Record<string, unknown>;
  }>;
}

// 节点尺寸参考: 宽度380px, 最小高度200px
// 间距设计: 水平间距500px+, 垂直间距320px+

// 分类样式映射
export function getCategoryStyle(category: CanvasTemplate['category']) {
  const styles = {
    learning: {
      bg: 'bg-blue-500/10',
      color: 'text-blue-400',
      label: '学习笔记',
    },
    project: {
      bg: 'bg-emerald-500/10',
      color: 'text-emerald-400',
      label: '项目规划',
    },
    brainstorm: {
      bg: 'bg-amber-500/10',
      color: 'text-amber-400',
      label: '头脑风暴',
    },
    research: {
      bg: 'bg-purple-500/10',
      color: 'text-purple-400',
      label: '研究笔记',
    },
  };
  return styles[category];
}

// 预置模板
export const templates: CanvasTemplate[] = [
  {
    id: 'learning-notes',
    name: '学习笔记',
    description: '结构化学习笔记，适合课程学习和知识整理',
    icon: '📚',
    category: 'learning',
    nodes: [
      {
        id: 'node-1',
        type: 'chatNode',
        position: { x: 100, y: 150 },
        data: {
          title: '📚 学习主题',
          messages: [],
          collapsed: false,
          status: 'active',
        },
      },
      {
        id: 'node-2',
        type: 'chatNode',
        position: { x: 650, y: 50 },
        data: {
          title: '💡 核心概念',
          messages: [],
          collapsed: false,
        },
      },
      {
        id: 'node-3',
        type: 'chatNode',
        position: { x: 650, y: 400 },
        data: {
          title: '📝 重点笔记',
          messages: [],
          collapsed: false,
        },
      },
      {
        id: 'node-4',
        type: 'chatNode',
        position: { x: 1200, y: 220 },
        data: {
          title: '❓ 问题与思考',
          messages: [],
          collapsed: false,
        },
      },
    ],
    edges: [
      { id: 'edge-1', source: 'node-1', target: 'node-2', data: { relationType: 'hierarchy' } },
      { id: 'edge-2', source: 'node-1', target: 'node-3', data: { relationType: 'hierarchy' } },
      { id: 'edge-3', source: 'node-2', target: 'node-4', data: { relationType: 'hierarchy' } },
      { id: 'edge-4', source: 'node-3', target: 'node-4', data: { relationType: 'reference' } },
    ],
  },
  {
    id: 'project-planning',
    name: '项目规划',
    description: '项目规划与任务分解，适合开发项目管理',
    icon: '🚀',
    category: 'project',
    nodes: [
      {
        id: 'node-1',
        type: 'chatNode',
        position: { x: 100, y: 220 },
        data: {
          title: '🎯 项目目标',
          messages: [],
          collapsed: false,
          status: 'active',
        },
      },
      {
        id: 'node-2',
        type: 'chatNode',
        position: { x: 650, y: 50 },
        data: {
          title: '📋 需求分析',
          messages: [],
          collapsed: false,
        },
      },
      {
        id: 'node-3',
        type: 'chatNode',
        position: { x: 650, y: 400 },
        data: {
          title: '🏗️ 技术方案',
          messages: [],
          collapsed: false,
        },
      },
      {
        id: 'node-4',
        type: 'chatNode',
        position: { x: 1200, y: 50 },
        data: {
          title: '✅ 任务清单',
          messages: [],
          collapsed: false,
        },
      },
      {
        id: 'node-5',
        type: 'chatNode',
        position: { x: 1200, y: 400 },
        data: {
          title: '⚠️ 风险评估',
          messages: [],
          collapsed: false,
        },
      },
    ],
    edges: [
      { id: 'edge-1', source: 'node-1', target: 'node-2', data: { relationType: 'hierarchy' } },
      { id: 'edge-2', source: 'node-1', target: 'node-3', data: { relationType: 'hierarchy' } },
      { id: 'edge-3', source: 'node-2', target: 'node-4', data: { relationType: 'hierarchy' } },
      { id: 'edge-4', source: 'node-3', target: 'node-5', data: { relationType: 'hierarchy' } },
      { id: 'edge-5', source: 'node-2', target: 'node-3', data: { relationType: 'reference' } },
    ],
  },
  {
    id: 'brainstorm',
    name: '头脑风暴',
    description: '自由发散思维，适合创意构思和问题探索',
    icon: '💡',
    category: 'brainstorm',
    nodes: [
      {
        id: 'node-1',
        type: 'chatNode',
        position: { x: 450, y: 280 },
        data: {
          title: '🤔 核心问题',
          messages: [],
          collapsed: false,
          status: 'active',
        },
      },
      {
        id: 'node-2',
        type: 'chatNode',
        position: { x: 50, y: 50 },
        data: {
          title: '💡 想法 A',
          messages: [],
          collapsed: false,
        },
      },
      {
        id: 'node-3',
        type: 'chatNode',
        position: { x: 850, y: 50 },
        data: {
          title: '💡 想法 B',
          messages: [],
          collapsed: false,
        },
      },
      {
        id: 'node-4',
        type: 'chatNode',
        position: { x: 50, y: 500 },
        data: {
          title: '💡 想法 C',
          messages: [],
          collapsed: false,
        },
      },
      {
        id: 'node-5',
        type: 'chatNode',
        position: { x: 850, y: 500 },
        data: {
          title: '💡 想法 D',
          messages: [],
          collapsed: false,
        },
      },
    ],
    edges: [
      { id: 'edge-1', source: 'node-1', target: 'node-2', data: { relationType: 'hierarchy' } },
      { id: 'edge-2', source: 'node-1', target: 'node-3', data: { relationType: 'hierarchy' } },
      { id: 'edge-3', source: 'node-1', target: 'node-4', data: { relationType: 'hierarchy' } },
      { id: 'edge-4', source: 'node-1', target: 'node-5', data: { relationType: 'hierarchy' } },
    ],
  },
  {
    id: 'research-notes',
    name: '研究笔记',
    description: '学术研究笔记，适合文献综述和研究记录',
    icon: '🔬',
    category: 'research',
    nodes: [
      {
        id: 'node-1',
        type: 'chatNode',
        position: { x: 100, y: 100 },
        data: {
          title: '🔬 研究问题',
          messages: [],
          collapsed: false,
          status: 'active',
        },
      },
      {
        id: 'node-2',
        type: 'chatNode',
        position: { x: 650, y: 50 },
        data: {
          title: '📖 文献综述',
          messages: [],
          collapsed: false,
        },
      },
      {
        id: 'node-3',
        type: 'chatNode',
        position: { x: 650, y: 400 },
        data: {
          title: '📊 数据分析',
          messages: [],
          collapsed: false,
        },
      },
      {
        id: 'node-4',
        type: 'chatNode',
        position: { x: 1200, y: 50 },
        data: {
          title: '🔗 相关工作',
          messages: [],
          collapsed: false,
        },
      },
      {
        id: 'node-5',
        type: 'chatNode',
        position: { x: 1200, y: 400 },
        data: {
          title: '✍️ 结论与展望',
          messages: [],
          collapsed: false,
        },
      },
    ],
    edges: [
      { id: 'edge-1', source: 'node-1', target: 'node-2', data: { relationType: 'hierarchy' } },
      { id: 'edge-2', source: 'node-1', target: 'node-3', data: { relationType: 'hierarchy' } },
      { id: 'edge-3', source: 'node-2', target: 'node-4', data: { relationType: 'reference' } },
      { id: 'edge-4', source: 'node-3', target: 'node-5', data: { relationType: 'hierarchy' } },
      { id: 'edge-5', source: 'node-2', target: 'node-5', data: { relationType: 'reference' } },
      { id: 'edge-6', source: 'node-4', target: 'node-5', data: { relationType: 'reference' } },
    ],
  },
];
