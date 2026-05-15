/**
 * 获取笔记节点的上下文内容
 * - 无连接：返回当前笔记的摘录
 * - 有连接：返回当前笔记 + 所有相连笔记的摘录
 */

import { useMemo } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import type { NoteNodeData, Excerpt } from '@/types';

export interface NoteContextItem {
  nodeId: string;
  title: string;
  excerpts: Excerpt[];
}

export interface UseNoteContextResult {
  /** 所有相关的笔记节点 ID（包含自己） */
  connectedNoteIds: string[];
  /** 所有相关的笔记内容 */
  contextContent: NoteContextItem[];
  /** 是否有连接的其他笔记节点 */
  hasConnectedNodes: boolean;
  /** 构建用于 AI 的上下文文本 */
  buildContextText: () => string;
}

/**
 * 获取笔记节点的上下文内容
 * @param nodeId 当前笔记节点 ID
 */
export function useNoteContext(nodeId: string): UseNoteContextResult {
  const nodes = useCanvasStore((state) => state.nodes);
  const edges = useCanvasStore((state) => state.edges);

  // 找到所有相连的笔记节点（无论方向）
  const connectedNoteIds = useMemo(() => {
    const noteIds = new Set<string>();
    noteIds.add(nodeId); // 包含自己

    // 找到与当前节点相关的所有连线
    const relatedEdges = edges.filter(
      (e) => e.source === nodeId || e.target === nodeId
    );

    relatedEdges.forEach((edge) => {
      // 找到另一端的节点 ID
      const otherId = edge.source === nodeId ? edge.target : edge.source;
      const otherNode = nodes.find((n) => n.id === otherId);
      
      // 只添加笔记节点
      if (otherNode?.type === 'noteNode') {
        noteIds.add(otherId);
      }
    });

    return Array.from(noteIds);
  }, [nodeId, nodes, edges]);

  // 收集所有摘录内容
  const contextContent = useMemo(() => {
    return connectedNoteIds
      .map((id) => {
        const node = nodes.find((n) => n.id === id);
        if (!node) return null;
        
        const data = node.data as NoteNodeData;
        return {
          nodeId: id,
          title: data?.title || '未命名笔记',
          excerpts: data?.excerpts || [],
        };
      })
      .filter((item): item is NoteContextItem => item !== null);
  }, [connectedNoteIds, nodes]);

  // 构建用于 AI 的上下文文本
  const buildContextText = useMemo(() => {
    return () => {
      const parts = contextContent.map((note) => {
        const excerptTexts = note.excerpts
          .map((e) => e.content)
          .filter(Boolean);
        
        if (excerptTexts.length === 0) return null;
        
        return `【${note.title}】\n${excerptTexts.map((t) => `- ${t}`).join('\n')}`;
      }).filter(Boolean);

      return parts.join('\n\n');
    };
  }, [contextContent]);

  return {
    connectedNoteIds,
    contextContent,
    hasConnectedNodes: connectedNoteIds.length > 1,
    buildContextText,
  };
}
