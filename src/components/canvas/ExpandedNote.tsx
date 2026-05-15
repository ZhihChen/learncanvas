'use client';

/**
 * 全屏笔记抽屉组件
 * 展开单个笔记为全屏视图，支持 AI 对话
 * 
 * 缤纷晨光主题优化版
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { 
  X, 
  FileText, 
  MoreVertical, 
  Trash2, 
  ChevronDown, 
  ChevronUp,
  Edit3,
  ExternalLink,
  Clock,
  Tag,
  Maximize2,
  Minimize2,
  Sparkles,
  Send,
  Loader2,
  MessageCircle,
} from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';
import { useNoteContext } from '@/hooks/useNoteContext';
import { MarkdownRenderer } from '@/components/chat/MarkdownRenderer';
import type { Excerpt, NoteNodeData, Message } from '@/types';
import { cn } from '@/lib/utils';

// 生成唯一 ID
const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// 多彩标签颜色
const tagColors = [
  { bg: 'rgba(167, 139, 250, 0.15)', color: 'var(--color-lavender)' }, // 薰衣草
  { bg: 'rgba(110, 231, 183, 0.15)', color: 'var(--color-mint)' },     // 薄荷
  { bg: 'rgba(96, 165, 250, 0.15)', color: 'var(--color-sky)' },       // 天蓝
  { bg: 'rgba(244, 162, 96, 0.15)', color: 'var(--color-coral)' },     // 珊瑚
  { bg: 'rgba(244, 114, 182, 0.15)', color: 'var(--color-peach)' },    // 粉桃
];

// 摘录卡片组件
const ExcerptCard = ({ 
  excerpt, 
  onJumpToSource,
  onDelete,
}: { 
  excerpt: Excerpt;
  onJumpToSource?: () => void;
  onDelete?: () => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins} 分钟前`;
    if (diffHours < 24) return `${diffHours} 小时前`;
    if (diffDays < 7) return `${diffDays} 天前`;
    return date.toLocaleDateString('zh-CN');
  };
  
  return (
    <div 
      className="rounded-xl overflow-hidden"
      style={{
        background: 'var(--node-bg)',
        border: '1px solid var(--border-primary)',
      }}
    >
      {/* 来源信息栏 */}
      <div 
        className="flex items-center justify-between px-4 py-3"
        style={{
          background: 'var(--accent-subtle)',
          borderBottom: '1px solid var(--border-primary)',
        }}
      >
        <button
          onClick={onJumpToSource}
          className="flex items-center gap-2 text-sm transition-colors"
          style={{ color: 'var(--accent-primary)' }}
        >
          <ExternalLink className="w-4 h-4" />
          <span>来自「{excerpt.sourceNodeTitle}」节点</span>
        </button>
        <div className="flex items-center gap-3">
          <span 
            className="flex items-center gap-1.5 text-sm"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <Clock className="w-4 h-4" />
            {formatTime(excerpt.createdAt)}
          </span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg transition-all duration-200"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-tertiary)';
            }}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
      
      {/* 内容区 */}
      {isExpanded && (
        <div className="p-4">
          {/* 摘录内容 */}
          {excerpt.htmlContent ? (
            <div 
              className="text-base leading-relaxed excerpt-html-content"
              style={{ color: 'var(--text-primary)' }}
              dangerouslySetInnerHTML={{ __html: excerpt.htmlContent }}
            />
          ) : (
            <div 
              className="text-base whitespace-pre-wrap leading-relaxed"
              style={{ color: 'var(--text-primary)' }}
            >
              {excerpt.content}
            </div>
          )}
          
          {/* 用户笔记 */}
          {excerpt.note && (
            <div 
              className="mt-4 pt-4"
              style={{ borderTop: '1px solid var(--border-primary)' }}
            >
              <div className="flex items-start gap-3">
                <Edit3 
                  className="w-4 h-4 mt-0.5 flex-shrink-0" 
                  style={{ color: 'var(--color-lavender)' }}
                />
                <div 
                  className="text-base italic"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {excerpt.note}
                </div>
              </div>
            </div>
          )}
          
          {/* 标签 */}
          {excerpt.tags && excerpt.tags.length > 0 && (
            <div 
              className="mt-4 pt-4 flex flex-wrap gap-2"
              style={{ borderTop: '1px solid var(--border-primary)' }}
            >
              <Tag className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
              {excerpt.tags.map((tag, index) => {
                const colorSet = tagColors[index % tagColors.length];
                return (
                  <span
                    key={index}
                    className="px-3 py-1 text-sm rounded-full"
                    style={{
                      background: colorSet.bg,
                      color: colorSet.color,
                    }}
                  >
                    #{tag}
                  </span>
                );
              })}
            </div>
          )}
          
          {/* 操作按钮 */}
          <div 
            className="mt-4 pt-4 flex items-center gap-3"
            style={{ borderTop: '1px solid var(--border-primary)' }}
          >
            {onJumpToSource && (
              <button
                onClick={onJumpToSource}
                className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-all duration-200"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--accent-light)';
                  e.currentTarget.style.color = 'var(--accent-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <ExternalLink className="w-4 h-4" />
                跳转来源
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-all duration-200"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(224, 62, 62, 0.1)';
                  e.currentTarget.style.color = 'var(--color-danger)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <Trash2 className="w-4 h-4" />
                删除
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export function ExpandedNote() {
  const { 
    nodes, 
    expandedNodeId, 
    setExpandedNode,
    deleteNode,
    updateNodeData,
    setSelectedNode,
    deleteExcerpt,
    addNoteMessage,
  } = useCanvasStore();
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [sortBy, setSortBy] = useState<'time' | 'source'>('time');
  
  // 退出动画状态
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  
  // AI 对话状态
  const [showAiChat, setShowAiChat] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // 从 store 获取节点数据
  const expandedNode = useMemo(() => {
    if (!expandedNodeId) return null;
    return nodes.find(n => n.id === expandedNodeId) || null;
  }, [nodes, expandedNodeId]);
  
  const hasExpandedNode = expandedNodeId && expandedNode;
  
  // 进入动画控制
  useEffect(() => {
    if (hasExpandedNode) {
      setShouldRender(true);
      setIsClosing(false);
    }
  }, [hasExpandedNode]);
  
  const { 
    title = '未命名笔记', 
    excerpts = [], 
    aiOrganized,
    messages = [],
  } = hasExpandedNode ? (expandedNode.data as NoteNodeData) : {};
  
  // 获取笔记上下文
  const { contextContent, hasConnectedNodes } = useNoteContext(expandedNodeId || '');
  
  // 保存标题
  const saveTitle = useCallback(() => {
    if (!expandedNodeId) return;
    const trimmed = editTitleValue.trim();
    if (trimmed && trimmed !== title) {
      updateNodeData(expandedNodeId, { title: trimmed });
    } else {
      setEditTitleValue(title);
    }
    setIsEditingTitle(false);
  }, [expandedNodeId, editTitleValue, title, updateNodeData]);
  
  // 删除摘录
  const handleDeleteExcerpt = useCallback((excerptId: string) => {
    deleteExcerpt(excerptId);
  }, [deleteExcerpt]);
  
  // 跳转到来源
  const handleJumpToSource = useCallback((excerpt: Excerpt) => {
    setSelectedNode(excerpt.sourceNodeId);
    setExpandedNode(excerpt.sourceNodeId);
    
    setTimeout(() => {
      const messageElement = document.querySelector(`[data-message-id="${excerpt.sourceMessageId}"]`);
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        messageElement.classList.add('excerpt-jump-highlight');
        setTimeout(() => {
          messageElement.classList.remove('excerpt-jump-highlight');
        }, 2000);
      }
    }, 300);
  }, [setSelectedNode, setExpandedNode]);
  
  // 关闭（带退出动画）
  const handleClose = useCallback(() => {
    setIsClosing(true);
    // 等待动画完成后再真正关闭
    setTimeout(() => {
      setExpandedNode(null);
      setIsClosing(false);
      setShouldRender(false);
      setIsFullscreen(false); // 重置全屏状态
    }, 300); // 与动画时长匹配
  }, [setExpandedNode]);
  
  // 切换全屏
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  
  // 双击面板主体切换全屏
  const handlePanelDoubleClick = (e: React.MouseEvent) => {
    // 排除输入框、按钮、标题编辑等交互区域
    const target = e.target as HTMLElement;
    if (
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('button') ||
      target.closest('[contenteditable="true"]') ||
      target.closest('[data-title-area]') ||
      target.closest('.code-block-header') ||
      target.closest('pre') ||
      target.closest('code')
    ) {
      return;
    }
    toggleFullscreen();
  };
  
  // 发送消息给 AI（非流式）
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading || !expandedNodeId) return;
    
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: Date.now(),
    };
    
    // 添加用户消息
    addNoteMessage(expandedNodeId, userMessage);
    setInputValue('');
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/ai/note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId: expandedNodeId,
          userMessage: userMessage.content,
          contextNotes: contextContent,
          history: messages.slice(-10),
        }),
      });
      
      if (!response.ok) {
        throw new Error('AI 请求失败');
      }
      
      const data = await response.json();
      
      // 添加 AI 响应消息
      const aiMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: data.content || '抱歉，我无法生成回复。',
        timestamp: Date.now(),
      };
      addNoteMessage(expandedNodeId, aiMessage);
      
    } catch (error) {
      console.error('AI 对话错误:', error);
      const errorMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: '抱歉，发生了错误，请稍后重试。',
        timestamp: Date.now(),
      };
      addNoteMessage(expandedNodeId, errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, expandedNodeId, addNoteMessage, contextContent, messages]);
  
  // 自动滚动到底部
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  // 排序摘录
  const sortedExcerpts = useMemo(() => {
    return [...excerpts].sort((a, b) => {
      if (sortBy === 'time') {
        return b.createdAt - a.createdAt;
      }
      if (sortBy === 'source') {
        return a.sourceNodeTitle.localeCompare(b.sourceNodeTitle);
      }
      return 0;
    });
  }, [excerpts, sortBy]);
  
  if (!hasExpandedNode || !shouldRender) return null;
  
  return (
    <div 
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        isClosing ? 'animate-overlay-fade-out' : 'animate-overlay-fade-in'
      )}
      style={{ background: 'rgba(0, 0, 0, 0.4)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div 
        className={cn(
          'relative flex flex-col',
          isClosing ? 'animate-center-panel-out' : 'animate-center-panel-in',
          // 全屏切换时的过渡动画
          isFullscreen && !isClosing && 'transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)]'
        )}
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-primary)',
          boxShadow: 'var(--shadow-colorful-glow)',
          borderRadius: isFullscreen ? '0' : 'var(--radius-xl)',
          width: isFullscreen ? '100%' : '90vw',
          height: isFullscreen ? '100%' : '85vh',
        }}
        onDoubleClick={handlePanelDoubleClick}
      >
        {/* 头部 */}
        <div 
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--border-primary)' }}
        >
          <div className="flex items-center gap-3">
            {/* 图标 */}
            <div 
              className="p-2 rounded-xl"
              style={{ background: 'rgba(110, 231, 183, 0.15)' }}
            >
              <FileText className="w-5 h-5" style={{ color: 'var(--color-mint)' }} />
            </div>
            
            {/* 标题 */}
            <div className="flex-1">
              {isEditingTitle ? (
                <input
                  type="text"
                  value={editTitleValue}
                  onChange={(e) => setEditTitleValue(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      saveTitle();
                    }
                    if (e.key === 'Escape') {
                      setEditTitleValue(title);
                      setIsEditingTitle(false);
                    }
                  }}
                  className="bg-transparent text-lg font-medium outline-none rounded-sm"
                  style={{
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-noto-sans)',
                    borderBottom: '1px solid var(--accent-primary)',
                  }}
                  placeholder="输入标题..."
                  autoFocus
                />
              ) : (
                <div 
                  className="flex items-center gap-2 cursor-pointer group"
                  onDoubleClick={() => {
                    setEditTitleValue(title);
                    setIsEditingTitle(true);
                  }}
                >
                  <span 
                    className="text-lg font-medium"
                    style={{
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-noto-sans)',
                    }}
                  >
                    {title}
                  </span>
                  <Edit3 
                    className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" 
                    style={{ color: 'var(--text-tertiary)' }}
                  />
                </div>
              )}
              
              <div 
                className="flex items-center gap-3 mt-1 text-sm"
                style={{ color: 'var(--text-tertiary)' }}
              >
                <span>{excerpts.length} 条摘录</span>
                {aiOrganized && (
                  <span style={{ color: 'var(--color-mint)' }}>✓ AI 整理</span>
                )}
              </div>
            </div>
          </div>
          
          {/* 右侧按钮 */}
          <div className="flex items-center gap-1">
            {/* 排序切换 */}
            <div 
              className="flex items-center gap-1 mr-2 px-2 py-1 rounded-lg"
              style={{ background: 'var(--bg-secondary)' }}
            >
              <button
                onClick={() => setSortBy('time')}
                className={cn('px-2 py-1 text-xs rounded transition-all duration-200')}
                style={{
                  background: sortBy === 'time' ? 'var(--accent-light)' : 'transparent',
                  color: sortBy === 'time' ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                }}
              >
                按时间
              </button>
              <button
                onClick={() => setSortBy('source')}
                className={cn('px-2 py-1 text-xs rounded transition-all duration-200')}
                style={{
                  background: sortBy === 'source' ? 'var(--accent-light)' : 'transparent',
                  color: sortBy === 'source' ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                }}
              >
                按来源
              </button>
            </div>
            
            {/* AI 对话按钮 */}
            <button
              onClick={() => {
                setShowAiChat(!showAiChat);
                if (!showAiChat) {
                  setTimeout(() => inputRef.current?.focus(), 100);
                }
              }}
              className={cn('p-2 rounded-lg transition-all duration-200')}
              style={{
                background: showAiChat ? 'var(--accent-light)' : 'transparent',
                color: showAiChat ? 'var(--accent-primary)' : 'var(--text-secondary)',
              }}
              title={showAiChat ? '关闭 AI 对话' : '与 AI 对话'}
            >
              <Sparkles className="w-5 h-5" />
            </button>
            
            {/* 全屏切换 */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-lg transition-all duration-200"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-hover)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
              title={isFullscreen ? '退出全屏' : '全屏'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </button>
            
            {/* 菜单 */}
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-lg transition-all duration-200"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              
              {isMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsMenuOpen(false)}
                  />
                  <div 
                    className="absolute right-0 top-full mt-1 w-48 rounded-xl shadow-xl z-50 overflow-hidden"
                    style={{
                      background: 'var(--node-bg)',
                      border: '1px solid var(--border-primary)',
                    }}
                  >
                    <button
                      onClick={() => { 
                        navigator.clipboard.writeText(title); 
                        setIsMenuOpen(false); 
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm transition-colors"
                      style={{ color: 'var(--text-primary)' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      复制标题
                    </button>
                    <button
                      onClick={() => { 
                        deleteNode(expandedNodeId!); 
                        handleClose();
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm transition-colors"
                      style={{ color: 'var(--color-danger)' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(224, 62, 62, 0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <Trash2 className="w-4 h-4" />
                      删除节点
                    </button>
                  </div>
                </>
              )}
            </div>
            
            {/* 关闭按钮 */}
            <button
              onClick={handleClose}
              className="p-2 rounded-lg transition-all duration-200"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-hover)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* 主内容区域 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 摘录列表区 */}
          <div className={cn(
            'flex-1 overflow-y-auto p-6 transition-all',
            showAiChat && 'w-1/2'
          )}>
            {sortedExcerpts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(110, 231, 183, 0.15)' }}
                >
                  <FileText className="w-8 h-8" style={{ color: 'var(--color-mint)' }} />
                </div>
                <p 
                  className="text-lg mb-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  暂无摘录内容
                </p>
                <p 
                  className="text-sm"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  在对话节点中选中文本，点击"摘录"添加
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedExcerpts.map((excerpt) => (
                  <ExcerptCard
                    key={excerpt.id}
                    excerpt={excerpt}
                    onJumpToSource={() => handleJumpToSource(excerpt)}
                    onDelete={() => handleDeleteExcerpt(excerpt.id)}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* AI 对话区 */}
          {showAiChat && (
            <div 
              className="w-1/2 flex flex-col"
              style={{ borderLeft: '1px solid var(--border-primary)' }}
            >
              {/* 对话消息列表 */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4"
                style={{ background: 'var(--bg-secondary)' }}
              >
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageCircle 
                      className="w-10 h-10 mb-3" 
                      style={{ color: 'var(--accent-primary)' }}
                    />
                    <p 
                      className="text-base"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      开始与 AI 对话
                    </p>
                    <p 
                      className="text-sm mt-1"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      {hasConnectedNodes 
                        ? `上下文包含 ${contextContent.length} 个笔记节点` 
                        : '基于当前笔记内容进行对话'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div 
                        key={msg.id} 
                        className={cn(
                          "flex",
                          msg.role === 'user' ? "justify-end" : "justify-start"
                        )}
                      >
                        <div 
                          className="max-w-[85%] px-4 py-2.5 rounded-xl text-sm"
                          style={{
                            background: msg.role === 'user' 
                              ? 'var(--accent-primary)' 
                              : 'var(--node-bg)',
                            color: msg.role === 'user' 
                              ? 'var(--text-inverse)' 
                              : 'var(--text-primary)',
                            border: msg.role === 'assistant' 
                              ? '1px solid var(--border-primary)' 
                              : 'none',
                          }}
                        >
                          {msg.role === 'assistant' ? (
                            <MarkdownRenderer content={msg.content} />
                          ) : (
                            <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                          )}
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div 
                          className="px-4 py-2.5 rounded-xl"
                          style={{
                            background: 'var(--node-bg)',
                            border: '1px solid var(--border-primary)',
                          }}
                        >
                          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>思考中...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* 输入区域 */}
              <div 
                className="p-4"
                style={{ 
                  borderTop: '1px solid var(--border-primary)',
                  background: 'var(--bg-primary)',
                }}
              >
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="输入你的问题..."
                    disabled={isLoading}
                    className="flex-1 rounded-lg px-4 py-2.5 text-sm outline-none disabled:opacity-50"
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-primary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    className={cn(
                      "p-2.5 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                    style={{
                      background: inputValue.trim() && !isLoading
                        ? 'var(--accent-light)' 
                        : 'var(--bg-secondary)',
                      color: inputValue.trim() && !isLoading
                        ? 'var(--accent-primary)' 
                        : 'var(--text-tertiary)',
                    }}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                {/* 上下文提示 */}
                {hasConnectedNodes && (
                  <div 
                    className="mt-2 text-xs flex items-center gap-1.5"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>上下文包含 {contextContent.length} 个相连的笔记节点</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
