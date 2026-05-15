'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import type { ChatNode as ChatNodeType } from '@/types';
import { Search, X, MessageSquare, FileText, ChevronDown, ChevronUp } from 'lucide-react';

interface SearchResult {
  type: 'node' | 'message';
  nodeId: string;
  nodeTitle: string;
  messageId?: string;
  content: string;
  matchIndex: number;
  matchLength: number;
}

interface GlobalSearchProps {
  onClose?: () => void;
}

export default function GlobalSearch({ onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);
  const { nodes, setSelectedNode } = useCanvasStore();

  // 搜索逻辑
  const searchResults = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return [];

    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    nodes.forEach((node: ChatNodeType) => {
      const nodeData = node.data;
      const title = nodeData.title || '未命名节点';
      const titleLower = title.toLowerCase();

      // 搜索节点标题
      let titleIndex = titleLower.indexOf(lowerQuery);
      if (titleIndex !== -1) {
        results.push({
          type: 'node',
          nodeId: node.id,
          nodeTitle: title,
          content: title,
          matchIndex: titleIndex,
          matchLength: query.length,
        });
      }

      // 搜索消息内容
      const messages = nodeData.messages || [];
      messages.forEach((msg: { id: string; role: string; content: string }) => {
        const contentLower = msg.content.toLowerCase();
        let contentIndex = contentLower.indexOf(lowerQuery);
        if (contentIndex !== -1) {
          results.push({
            type: 'message',
            nodeId: node.id,
            nodeTitle: title,
            messageId: msg.id,
            content: msg.content,
            matchIndex: contentIndex,
            matchLength: query.length,
          });
        }
      });
    });

    return results;
  }, [query, nodes]);

  // 按节点分组结果
  const groupedResults = useMemo(() => {
    const groups = new Map<string, SearchResult[]>();
    searchResults.forEach((result) => {
      const existing = groups.get(result.nodeId) || [];
      existing.push(result);
      groups.set(result.nodeId, existing);
    });
    return groups;
  }, [searchResults]);

  // 高亮匹配文本
  const highlightMatch = useCallback((text: string, matchIndex: number, matchLength: number) => {
    if (matchIndex === -1) return text;
    const before = text.slice(0, matchIndex);
    const match = text.slice(matchIndex, matchIndex + matchLength);
    const after = text.slice(matchIndex + matchLength);
    return (
      <>
        {before}
        <span className="bg-indigo-500/30 text-indigo-200 rounded px-0.5">{match}</span>
        {after}
      </>
    );
  }, []);

  // 截取上下文
  const truncateContext = useCallback((text: string, matchIndex: number, matchLength: number, contextLength = 60) => {
    const start = Math.max(0, matchIndex - contextLength);
    const end = Math.min(text.length, matchIndex + matchLength + contextLength);
    let result = text.slice(start, end);
    if (start > 0) result = '...' + result;
    if (end < text.length) result = result + '...';
    
    // 调整匹配位置
    const adjustedIndex = matchIndex - start + (start > 0 ? 3 : 0);
    return { text: result, adjustedIndex };
  }, []);

  // 点击结果跳转到节点
  const handleResultClick = useCallback((result: SearchResult) => {
    setSelectedNode(result.nodeId);
    setIsOpen(false);
    setQuery('');
    onClose?.();
  }, [setSelectedNode, onClose]);

  // 切换节点展开状态
  const toggleNodeExpand = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K 打开搜索
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      // Escape 关闭
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 聚焦输入框
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm text-gray-400"
      >
        <Search className="w-4 h-4" />
        <span>搜索</span>
        <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-xs">⌘K</kbd>
      </button>
    );
  }

  return (
    <div className="relative">
      {/* 搜索输入框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索节点标题或消息内容..."
          className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-white/5 border border-white/10 focus:outline-none text-white placeholder-gray-500 text-sm"
        />
        <button
          onClick={() => {
            setIsOpen(false);
            setQuery('');
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/10 text-gray-400"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 搜索结果 */}
      {query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-2 max-h-96 overflow-y-auto rounded-lg bg-gray-900/95 backdrop-blur-xl border border-white/10 shadow-xl z-50">
          {searchResults.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              未找到匹配结果
            </div>
          ) : (
            <div className="p-2">
              <div className="px-2 py-1 text-xs text-gray-500 border-b border-white/5 mb-2">
                找到 {searchResults.length} 个结果
              </div>
              
              {Array.from(groupedResults.entries()).map(([nodeId, results]) => {
                const isExpanded = expandedNodes.has(nodeId);
                const nodeResults = results.filter((r) => r.type === 'node');
                const messageResults = results.filter((r) => r.type === 'message');
                const displayCount = isExpanded ? messageResults.length : Math.min(3, messageResults.length);

                return (
                  <div key={nodeId} className="mb-2 last:mb-0">
                    {/* 节点标题 */}
                    <div
                      onClick={() => handleResultClick(results[0])}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="text-sm font-medium text-white truncate">
                        {highlightMatch(
                          results[0].nodeTitle,
                          results[0].type === 'node' ? results[0].matchIndex : -1,
                          results[0].matchLength
                        )}
                      </span>
                      {messageResults.length > 0 && (
                        <span className="text-xs text-gray-500 ml-auto">
                          {messageResults.length} 条消息
                        </span>
                      )}
                    </div>

                    {/* 消息结果 */}
                    {messageResults.length > 0 && (
                      <div className="ml-6 space-y-1">
                        {messageResults.slice(0, displayCount).map((result, index) => {
                          const { text: truncatedText, adjustedIndex } = truncateContext(
                            result.content,
                            result.matchIndex,
                            result.matchLength
                          );

                          return (
                            <div
                              key={`${result.nodeId}-${result.messageId}-${index}`}
                              onClick={() => handleResultClick(result)}
                              className="flex items-start gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                            >
                              <MessageSquare className="w-3 h-3 text-gray-500 shrink-0 mt-0.5" />
                              <span className="text-xs text-gray-400 line-clamp-2">
                                {highlightMatch(truncatedText, adjustedIndex, result.matchLength)}
                              </span>
                            </div>
                          );
                        })}

                        {/* 展开更多 */}
                        {messageResults.length > 3 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleNodeExpand(nodeId);
                            }}
                            className="flex items-center gap-1 px-3 py-1 text-xs text-gray-500 hover:text-gray-400 transition-colors"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="w-3 h-3" />
                                收起
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3 h-3" />
                                显示更多 ({messageResults.length - 3} 条)
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
