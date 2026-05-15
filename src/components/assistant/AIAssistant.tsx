'use client';

/**
 * AI 智能建议组件
 * 分析对话内容和画布结构，生成深度学习建议
 */

import { useState, useCallback, useEffect } from 'react';
import { 
  Sparkles, 
  Lightbulb, 
  ArrowRight,
  X,
  Loader2,
  Compass,
  Target,
  GitBranch,
  Zap,
  BookOpen,
} from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';
import { cn } from '@/lib/utils';

// 建议类型
interface Suggestion {
  id: string;
  title: string;
  description: string;
  type: 'new_topic' | 'deep_dive' | 'related' | 'action';
  priority?: number;
  reason?: string;
}

// 建议类型配置
const suggestionTypeConfig = {
  new_topic: { 
    icon: BookOpen, 
    color: 'text-emerald-400', 
    bg: 'bg-emerald-500/10',
    label: '新话题'
  },
  deep_dive: { 
    icon: Target, 
    color: 'text-amber-400', 
    bg: 'bg-amber-500/10',
    label: '深入探索'
  },
  related: { 
    icon: GitBranch, 
    color: 'text-purple-400', 
    bg: 'bg-purple-500/10',
    label: '相关领域'
  },
  action: { 
    icon: Zap, 
    color: 'text-amber-400', 
    bg: 'bg-amber-500/10',
    label: '实践应用'
  },
};

interface AIAssistantProps {
  nodeId: string;
  messages: { role: string; content: string }[];
}

export function AIAssistant({ nodeId, messages }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  
  const { addNode, addEdge, nodes } = useCanvasStore();
  
  // 重置状态
  useEffect(() => {
    if (!isOpen) {
      setHoveredId(null);
    }
  }, [isOpen]);
  
  // 生成建议
  const generateSuggestions = useCallback(async () => {
    if (messages.length === 0) return;
    
    setIsLoading(true);
    setIsOpen(true);
    setSuggestions([]);
    
    try {
      // 获取画布上下文（其他节点的标题和摘要）
      const canvasContext = nodes
        .filter(n => n.id !== nodeId && n.data.title)
        .slice(0, 5)
        .map(n => ({
          title: n.data.title,
          summary: n.data.summary,
        }));
      
      // 调用建议 API
      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          canvasContext,
        }),
      });
      
      if (!response.ok) {
        throw new Error('请求失败');
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const json = JSON.parse(line.slice(6));
                if (json.type === 'content' && json.content) {
                  fullContent += json.content;
                }
                if (json.type === 'done' && json.raw) {
                  fullContent = json.raw;
                }
              } catch {
                // 忽略解析错误
              }
            }
          }
        }
      }
      
      // 解析建议
      try {
        const jsonMatch = fullContent.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const validSuggestions = parsed
            .filter((s: Suggestion) => s.title && s.description && s.type)
            .sort((a: Suggestion, b: Suggestion) => (a.priority || 4) - (b.priority || 4))
            .slice(0, 4)
            .map((s: Suggestion, i: number) => ({
              ...s,
              id: `suggestion-${i}-${Date.now()}`,
            }));
          
          if (validSuggestions.length > 0) {
            setSuggestions(validSuggestions);
          } else {
            setDefaultSuggestions();
          }
        } else {
          setDefaultSuggestions();
        }
      } catch {
        setDefaultSuggestions();
      }
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      setDefaultSuggestions();
    } finally {
      setIsLoading(false);
    }
  }, [messages, nodeId, nodes]);
  
  // 设置默认建议
  const setDefaultSuggestions = () => {
    setSuggestions([
      {
        id: 'default-1',
        title: '深入探索',
        description: '对当前话题进行更深入的讨论和学习',
        type: 'deep_dive',
        priority: 1,
      },
      {
        id: 'default-2',
        title: '相关主题',
        description: '探索与当前话题相关的其他知识领域',
        type: 'related',
        priority: 2,
      },
      {
        id: 'default-3',
        title: '实践应用',
        description: '将所学知识应用到实际场景中',
        type: 'action',
        priority: 3,
      },
    ]);
  };
  
  // 应用建议 - 创建新节点并连线
  const applySuggestion = useCallback((suggestion: Suggestion) => {
    const currentNode = nodes.find(n => n.id === nodeId);
    if (!currentNode) return;
    
    // 计算新节点位置
    const index = suggestions.indexOf(suggestion);
    const offsetY = (index - suggestions.length / 2) * 150;
    
    // 创建新节点
    const newNodeId = addNode(
      {
        x: currentNode.position.x + 450,
        y: currentNode.position.y + offsetY,
      },
      suggestion.title
    );
    
    // 添加初始问题作为第一条消息
    setTimeout(() => {
      const store = useCanvasStore.getState();
      store.updateNodeData(newNodeId, {
        messages: [{
          id: `initial-${Date.now()}`,
          role: 'user',
          content: `基于之前的讨论，我想${suggestion.description}。请帮我开始这个话题。`,
          timestamp: Date.now(),
          status: 'complete',
        }],
      });
      
      // 创建连线
      store.addEdge({
        id: `edge-${nodeId}-${newNodeId}`,
        source: nodeId,
        target: newNodeId,
        type: 'context',
        data: { relationType: 'hierarchy' },
      });
    }, 100);
    
    setIsOpen(false);
  }, [nodeId, nodes, suggestions, addNode]);
  
  return (
    <div className="relative">
      {/* 触发按钮 */}
      <button
        onClick={generateSuggestions}
        disabled={messages.length === 0}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg transition-all duration-200',
          messages.length === 0
            ? 'text-slate-600 cursor-not-allowed'
            : isOpen
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20'
        )}
        title={messages.length === 0 ? '开始对话后可获取建议' : 'AI 智能学习建议'}
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>学习建议</span>
      </button>
      
      {/* 建议面板 */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-[340px] bg-gradient-to-br from-[#1a1a2e]/98 to-[#16162a]/98 backdrop-blur-xl border border-amber-500/30 rounded-2xl shadow-2xl shadow-amber-500/10 overflow-hidden z-50">
          {/* 头部 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-amber-500/10 bg-gradient-to-r from-amber-500/5 to-purple-500/5">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-gradient-to-br from-amber-500/20 to-purple-500/20 rounded-lg">
                <Compass className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <span className="text-sm font-medium text-white">AI 学习建议</span>
                <p className="text-[10px] text-slate-500">基于对话内容智能生成</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* 建议列表 */}
          <div className="p-3 space-y-2">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Loader2 className="w-6 h-6 text-amber-400 animate-spin mb-3" />
                <span className="text-xs text-slate-400">分析对话内容中...</span>
              </div>
            ) : suggestions.length === 0 ? (
              <div className="text-center py-8">
                <Lightbulb className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400">暂无建议</p>
                <p className="text-xs text-slate-500 mt-1">开始对话后可获取个性化建议</p>
              </div>
            ) : (
              suggestions.map((suggestion) => {
                const config = suggestionTypeConfig[suggestion.type];
                const Icon = config.icon;
                const isHovered = hoveredId === suggestion.id;
                
                return (
                  <button
                    key={suggestion.id}
                    onClick={() => applySuggestion(suggestion)}
                    onMouseEnter={() => setHoveredId(suggestion.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className={cn(
                      'w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all duration-200',
                      'border group relative overflow-hidden',
                      isHovered
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'border-transparent hover:border-amber-500/20 hover:bg-white/5'
                    )}
                  >
                    {/* 背景发光效果 */}
                    <div className={cn(
                      'absolute inset-0 opacity-0 transition-opacity duration-300',
                      isHovered && 'opacity-100',
                      suggestion.type === 'new_topic' && 'bg-gradient-to-r from-emerald-500/5 to-transparent',
                      suggestion.type === 'deep_dive' && 'bg-gradient-to-r from-amber-500/5 to-transparent',
                      suggestion.type === 'related' && 'bg-gradient-to-r from-purple-500/5 to-transparent',
                      suggestion.type === 'action' && 'bg-gradient-to-r from-amber-500/5 to-transparent',
                    )} />
                    
                    <div className={cn('p-2 rounded-lg flex-shrink-0 relative', config.bg)}>
                      <Icon className={cn('w-4 h-4', config.color)} />
                    </div>
                    
                    <div className="flex-1 min-w-0 relative">
                      <div className="flex items-center gap-2">
                        <span className={cn('text-sm font-medium', config.color)}>
                          {suggestion.title}
                        </span>
                        <span className={cn(
                          'px-1.5 py-0.5 rounded text-[10px] font-medium',
                          config.bg, config.color
                        )}>
                          {config.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {suggestion.description}
                      </p>
                      {suggestion.reason && isHovered && (
                        <p className="text-[10px] text-slate-500 mt-1 italic">
                          💡 {suggestion.reason}
                        </p>
                      )}
                    </div>
                    
                    <ArrowRight className={cn(
                      'w-4 h-4 mt-2 flex-shrink-0 transition-all duration-200',
                      isHovered ? 'text-amber-400 translate-x-1' : 'text-slate-600'
                    )} />
                  </button>
                );
              })
            )}
          </div>
          
          {/* 底部提示 */}
          {!isLoading && suggestions.length > 0 && (
            <div className="px-4 py-2.5 border-t border-amber-500/10 bg-slate-900/30">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Sparkles className="w-3 h-3" />
                <span>点击建议将创建新节点并自动连线</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
