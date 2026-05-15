'use client';

/**
 * 全屏聊天抽屉组件
 * 展开单个对话为全屏聊天视图
 * 界面设计完全复制 ChatNode，只是尺寸放大
 * 
 * 缤纷晨光主题优化版
 */

import { useState, useRef, useCallback, useMemo, useEffect, useTransition } from 'react';
import { 
  X, 
  Send, 
  Sparkles,
  MessageSquare,
  Image as ImageIcon,
  Link2,
  Settings,
  Check,
  MoreVertical,
  Trash2,
  Edit3,
  Plus,
  Maximize2,
  Minimize2,
  Paperclip,
} from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';
import { useTextSelection } from '@/hooks/useTextSelection';
import type { TextSelection } from '@/hooks/useTextSelection';
import { HighlightMenu } from '@/components/excerpt/HighlightMenu';
import { TargetNodePicker } from '@/components/excerpt/TargetNodePicker';
import { NoteInputDialog } from '@/components/excerpt/NoteInputDialog';
import { QuoteBlock, type QuoteData } from '@/components/chat/QuoteBlock';
import { FilePreview } from '@/components/file/FilePreview';
import type { Message, Attachment, AttachmentType } from '@/types';
import { cn } from '@/lib/utils';
import { MarkdownRenderer } from '@/components/chat/MarkdownRenderer';

// 消息项组件 - 与 ChatNode 完全一致
const MessageItem = ({ message }: { message: Message }) => {
  const { allExcerpts, setPreviewingFile } = useCanvasStore();
  
  // 应用高亮标记到内容
  const highlightedContent = useMemo(() => {
    if (!message.highlights || message.highlights.length === 0) {
      return message.content;
    }
    
    let content = message.content;
    
    // 按起始位置倒序排列，从后往前替换
    const sortedHighlights = [...message.highlights].sort((a, b) => b.startOffset - a.startOffset);
    
    for (const highlight of sortedHighlights) {
      const excerpt = highlight.excerptId ? allExcerpts.find(e => e.id === highlight.excerptId) : null;
      const highlightText = excerpt?.content;
      
      if (!highlightText) continue;
      
      const index = content.indexOf(highlightText);
      if (index !== -1) {
        content = content.slice(0, index) + `==${highlightText}==` + content.slice(index + highlightText.length);
      }
    }
    
    return content;
  }, [message.content, message.highlights, allExcerpts]);
  
  return (
    <div
      data-message-id={message.id}
      data-message-content={message.content}
      className={cn(
        'flex',
        message.role === 'user' ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[85%] px-4 py-3 rounded-2xl',
          message.role === 'user'
            ? 'rounded-br-md'
            : 'rounded-bl-md'
        )}
        style={{
          background: message.role === 'user' 
            ? 'var(--accent-primary)' 
            : 'var(--bg-secondary)',
          color: message.role === 'user' 
            ? 'var(--text-inverse)' 
            : 'var(--text-primary)',
          border: message.role === 'assistant' 
            ? '1px solid var(--border-primary)' 
            : 'none',
        }}
      >
        {/* 附件卡片 - 显示在消息内容之前 */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {message.attachments.map((attachment) => (
              <div
                key={attachment.id}
                onClick={() => setPreviewingFile(attachment)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all hover:shadow-md"
                style={{
                  background: message.role === 'user' 
                    ? 'rgba(255,255,255,0.2)' 
                    : 'var(--bg-tertiary)',
                  border: `1px solid ${message.role === 'user' ? 'rgba(255,255,255,0.3)' : 'var(--border-primary)'}`,
                }}
              >
                {/* 文件图标 */}
                {attachment.type === 'image' ? (
                  <img 
                    src={attachment.url} 
                    alt={attachment.name}
                    className="w-8 h-8 rounded object-cover"
                  />
                ) : (
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ 
                      background: getAttachmentBgColor(attachment.type, message.role === 'user')
                    }}
                  >
                    <FileIcon type={attachment.type} size={16} />
                  </div>
                )}
                {/* 文件名 */}
                <span 
                  className="text-xs font-medium truncate max-w-[120px]"
                  style={{ 
                    color: message.role === 'user' 
                      ? 'rgba(255,255,255,0.9)' 
                      : 'var(--text-primary)' 
                  }}
                >
                  {attachment.name}
                </span>
              </div>
            ))}
          </div>
        )}
        
        {/* 消息内容 */}
        {message.status === 'streaming' && !message.content ? (
          <span className="inline-flex items-center gap-1.5 text-sm">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--accent-primary)' }} />
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--accent-primary)', animationDelay: '0.1s' }} />
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--accent-primary)', animationDelay: '0.2s' }} />
          </span>
        ) : message.role === 'assistant' ? (
          <MarkdownRenderer content={highlightedContent} />
        ) : (
          <span className="text-sm whitespace-pre-wrap">{highlightedContent}</span>
        )}
      </div>
    </div>
  );
};

// 文件图标组件
const FileIcon = ({ type, size = 24 }: { type: AttachmentType; size?: number }) => {
  const iconStyle = {
    width: size,
    height: size,
  };
  
  const colorMap: Record<string, string> = {
    pdf: '#DC2626',
    word: '#2563EB',
    excel: '#16A34A',
    powerpoint: '#D97706',
    markdown: '#8B5CF6',
    image: '#8B5CF6',
    file: '#6B7280',
  };
  
  return (
    <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke={colorMap[type] || colorMap.file} strokeWidth="1.5">
      <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 2V8H20" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

// 附件卡片背景色
const getAttachmentBgColor = (type: AttachmentType, isUserMessage: boolean) => {
  if (isUserMessage) return 'rgba(255,255,255,0.2)';
  
  const colorMap: Record<string, string> = {
    pdf: '#FEE2E2',
    word: '#DBEAFE',
    excel: '#D1FAE5',
    powerpoint: '#FEF3C7',
    markdown: '#EDE9FE',
    image: '#FCE7F3',
    file: 'var(--bg-secondary)',
  };
  return colorMap[type] || colorMap.file;
};

// 状态颜色映射 - 使用主题色
const statusColors: Record<string, string> = {
  idle: 'var(--text-tertiary)',
  active: 'var(--color-coral)',
  completed: 'var(--color-mint)',
};

export function ExpandedChat() {
  const { 
    nodes, 
    edges, 
    expandedNodeId, 
    setExpandedNode,
    addMessage,
    updateMessage,
    updateNodeData,
    addStreamingNode,
    removeStreamingNode,
    canSendMessage,
    allowConcurrentStreaming,
    deleteNode,
    showHighlightMenu,
    hideHighlightMenu,
    highlightMenuState,
    createNoteNode,
    addExcerpt,
    addHighlight,
    setPreviewingFile,
    previewingFile,
    showFilePreview,
    setShowFilePreview,
  } = useCanvasStore();
  
  // 状态
  const [inputValue, setInputValue] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [showContextPanel, setShowContextPanel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagValue, setNewTagValue] = useState('');
  const [isSummaryCollapsed, setIsSummaryCollapsed] = useState(true);
  
  // 退出动画状态
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  
  // 文件相关状态
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Refs
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>([]);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  
  // 流式更新节流
  const lastStreamUpdateTime = useRef<number>(0);
  const pendingStreamUpdate = useRef<{ content: string; messageId: string } | null>(null);
  const streamUpdateTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // 摘录相关状态
  const [showTargetPicker, setShowTargetPicker] = useState(false);
  const [pendingExcerptType, setPendingExcerptType] = useState<'excerpt' | 'note'>('excerpt');
  const [showNoteInputDialog, setShowNoteInputDialog] = useState(false);
  const [pendingNote, setPendingNote] = useState('');
  
  // 引用块状态（用于提问功能）
  const [activeQuote, setActiveQuote] = useState<QuoteData | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  
  // 使用 React 19 的 useTransition
  const [isPending, startTransition] = useTransition();
  
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
    title = '未命名对话', 
    messages = [], 
    systemPrompt,
    contextEnabled = {},
    tags = [],
    status = 'idle',
    summary,
  } = hasExpandedNode ? expandedNode.data : {};
  
  // 使用 ref 保存最新 messages
  messagesRef.current = messages;
  
  // 处理文本选中
  const handleTextSelection = useCallback((selection: TextSelection) => {
    showHighlightMenu({
      position: { x: selection.rect.left, y: selection.rect.bottom + 5 },
      selectedText: selection.text,
      selectedHtml: selection.html,
      sourceNodeId: expandedNodeId!,
      sourceNodeTitle: title,
      sourceMessageId: selection.messageId,
      sourceRange: {
        startOffset: selection.startOffset,
        endOffset: selection.endOffset,
      },
      sourceFullContent: selection.fullContent,
    });
  }, [expandedNodeId, title, showHighlightMenu]);
  
  // 处理选区清除
  const handleSelectionClear = useCallback(() => {
    hideHighlightMenu();
  }, [hideHighlightMenu]);
  
  // 处理划线菜单操作
  const handleHighlightMenuAction = useCallback((type: 'excerpt' | 'note' | 'question' | 'branch') => {
    if (!highlightMenuState || !expandedNodeId) return;
    
    // 分支操作：创建衍生节点深入讨论
    if (type === 'branch') {
      const { selectedText, sourceFullContent, sourceRange } = highlightMenuState;
      
      // 获取上下文
      let context = selectedText;
      if (sourceRange && sourceFullContent) {
        const contextLength = 150;
        const before = sourceFullContent.slice(
          Math.max(0, sourceRange.startOffset - contextLength),
          sourceRange.startOffset
        );
        const after = sourceFullContent.slice(
          sourceRange.endOffset,
          Math.min(sourceFullContent.length, sourceRange.endOffset + contextLength)
        );
        context = `${before ? '...' + before : ''}${selectedText}${after ? after + '...' : ''}`;
      }
      
      // 创建衍生节点
      const { createDerivedNode } = useCanvasStore.getState();
      createDerivedNode(expandedNodeId, selectedText, context);
      
      hideHighlightMenu();
      return;
    }
    
    // 提问操作：将选中内容以引用块形式虚挂在输入框上方
    if (type === 'question') {
      setActiveQuote({
        text: highlightMenuState.selectedText,
        messageId: highlightMenuState.sourceMessageId,
        sourceNodeTitle: highlightMenuState.sourceNodeTitle,
      });
      inputRef.current?.focus();
      hideHighlightMenu();
      return;
    }
    
    // 笔记操作：先弹出批注输入框
    if (type === 'note') {
      setPendingExcerptType('note');
      setShowNoteInputDialog(true);
      hideHighlightMenu();
      return;
    }
    
    // 摘录操作：检查下游是否有唯一的笔记节点
    const outgoingEdges = edges.filter(edge => edge.source === expandedNodeId);
    const downstreamNoteNodes = outgoingEdges
      .map(edge => nodes.find(n => n.id === edge.target && n.type === 'noteNode'))
      .filter((n): n is NonNullable<typeof n> => n !== undefined);
    
    if (downstreamNoteNodes.length === 1) {
      const targetNode = downstreamNoteNodes[0];
      const { selectedText, selectedHtml, sourceMessageId, sourceRange, sourceFullContent } = highlightMenuState;
      
      let sourceContext: { before: string; after: string } | undefined;
      if (sourceRange && sourceFullContent) {
        const contextLength = 100;
        const before = sourceFullContent.slice(
          Math.max(0, sourceRange.startOffset - contextLength),
          sourceRange.startOffset
        );
        const after = sourceFullContent.slice(
          sourceRange.endOffset,
          Math.min(sourceFullContent.length, sourceRange.endOffset + contextLength)
        );
        sourceContext = { before, after };
      }
      
      const excerptData = {
        type: 'excerpt' as const,
        content: selectedText,
        htmlContent: selectedHtml,
        sourceNodeId: expandedNodeId,
        sourceNodeTitle: title,
        sourceMessageId,
        sourceRange,
        sourceContext,
      };
      
      addExcerpt(excerptData, targetNode.id);
      hideHighlightMenu();
      return;
    }
    
    setPendingExcerptType('excerpt');
    setShowTargetPicker(true);
    hideHighlightMenu();
  }, [highlightMenuState, hideHighlightMenu, edges, nodes, expandedNodeId, title, addExcerpt]);
  
  // 处理批注输入确认
  const handleNoteInputConfirm = useCallback((note: string) => {
    setPendingNote(note);
    setShowNoteInputDialog(false);
    setShowTargetPicker(true);
  }, []);
  
  // 处理批注输入取消
  const handleNoteInputCancel = useCallback(() => {
    setShowNoteInputDialog(false);
  }, []);
  
  // 处理目标节点选择
  const handleTargetNodeSelect = useCallback((nodeId: string | 'new', nodeType: 'note') => {
    if (!highlightMenuState || !expandedNodeId) return;
    
    const { selectedText, selectedHtml, sourceMessageId, sourceRange, sourceFullContent } = highlightMenuState;
    
    let sourceContext: { before: string; after: string } | undefined;
    if (sourceRange && sourceFullContent) {
      const contextLength = 100;
      const before = sourceFullContent.slice(
        Math.max(0, sourceRange.startOffset - contextLength),
        sourceRange.startOffset
      );
      const after = sourceFullContent.slice(
        sourceRange.endOffset,
        Math.min(sourceFullContent.length, sourceRange.endOffset + contextLength)
      );
      sourceContext = { before, after };
    }
    
    const excerptData = {
      type: pendingExcerptType as 'excerpt' | 'note',
      content: selectedText,
      htmlContent: selectedHtml,
      note: pendingNote || undefined,
      sourceNodeId: expandedNodeId,
      sourceNodeTitle: title,
      sourceMessageId,
      sourceRange,
      sourceContext,
    };
    
    if (nodeId === 'new') {
      const newNodePosition = {
        x: (nodes.find(n => n.id === expandedNodeId)?.position?.x || 0) + 450,
        y: (nodes.find(n => n.id === expandedNodeId)?.position?.y || 0),
      };
      
      const newNodeId = createNoteNode(
        newNodePosition,
        pendingNote ? '带批注的笔记' : '新笔记'
      );
      
      setTimeout(() => {
        addExcerpt(excerptData, newNodeId);
      }, 100);
    } else {
      addExcerpt(excerptData, nodeId);
    }
    
    setShowTargetPicker(false);
    setPendingNote('');
  }, [highlightMenuState, pendingExcerptType, pendingNote, expandedNodeId, title, nodes, createNoteNode, addExcerpt]);
  
  // 划线检测
  useTextSelection({
    containerRef: messagesContainerRef,
    onSelection: handleTextSelection,
    onSelectionClear: handleSelectionClear,
    minChars: 1,
  });
  
  // 获取上下文来源
  const contextSources = useMemo(() => {
    if (!expandedNodeId) return [];
    return edges.filter((e) => e.target === expandedNodeId).map((e) => e.source);
  }, [edges, expandedNodeId]);
  
  const contextNodes = useMemo(() => {
    return contextSources.map(sourceId => {
      const node = nodes.find((n) => n.id === sourceId);
      return node ? { id: node.id, title: node.data.title || '未命名', enabled: contextEnabled[sourceId] !== false } : null;
    }).filter(Boolean) as { id: string; title: string; enabled: boolean }[];
  }, [contextSources, nodes, contextEnabled]);
  
  // 处理文件选择
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // 上传文件到对象存储
    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/file/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || '上传失败');
        }
        
        const attachment: Attachment = await response.json();
        
        setAttachments(prev => [...prev, attachment]);
        
      } catch (error) {
        console.error('Failed to upload file:', error);
        alert(error instanceof Error ? error.message : '文件上传失败');
      }
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);
  
  // 移除附件
  const removeAttachment = useCallback((attachmentId: string) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
  }, []);
  
  // 清空附件
  const clearAttachments = useCallback(() => {
    setAttachments([]);
  }, []);
  
  // 获取上下文消息
  const getContextMessages = useCallback((): Message[] => {
    if (!expandedNodeId) return [];
    
    const contextMessages: Message[] = [];
    
    for (const sourceId of contextSources) {
      if (contextEnabled[sourceId] === false) continue;
      
      const sourceNode = nodes.find((n) => n.id === sourceId);
      if (sourceNode && sourceNode.data.messages && sourceNode.data.messages.length > 0) {
        const contextContent = sourceNode.data.summary || 
          sourceNode.data.messages.slice(-6).map((m: Message) => 
            m.role === 'user' ? `用户: ${m.content}` : `AI: ${m.content}`
          ).join('\n');
        
        contextMessages.push({
          id: `context-${sourceId}`,
          role: 'system',
          content: `【来自"${sourceNode.data.title}"的相关信息】\n${contextContent}`,
          timestamp: Date.now(),
        });
      }
    }
    
    return contextMessages;
  }, [contextSources, contextEnabled, nodes, expandedNodeId]);
  
  // 发送消息
  const handleSend = useCallback(async () => {
    if (!expandedNodeId || (!inputValue.trim() && !activeQuote && attachments.length === 0) || isStreaming) return;
    
    let finalInputValue = inputValue.trim();
    if (activeQuote) {
      finalInputValue = `> ${activeQuote.text}\n\n${inputValue.trim()}`;
    }
    
    // 解析附件内容（仅用于发送给AI，不保存到用户消息）
    let attachmentContext = '';
    const imageAttachments = attachments.filter(att => att.type === 'image');
    const fileAttachments = attachments.filter(att => att.type !== 'image');
    
    // 解析非图片文件（PDF、Word、Excel等）
    if (fileAttachments.length > 0) {
      const parsedContents: string[] = [];
      
      for (const file of fileAttachments) {
        try {
          const response = await fetch('/api/file/parse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileUrl: file.url,
              storageKey: file.storageKey,
              fileName: file.name,
            }),
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.textContent) {
              parsedContents.push(`【${file.name} 内容】\n${result.textContent}`);
            }
          }
        } catch (error) {
          console.error('Failed to parse file:', error);
        }
      }
      
      if (parsedContents.length > 0) {
        attachmentContext = `\n\n---\n附件内容：\n${parsedContents.join('\n\n')}\n---\n`;
      }
    }
    
    // 构建发送给AI的消息内容（包含解析后的附件内容）
    let aiMessageContent: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
    
    if (imageAttachments.length > 0) {
      const contentParts: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];
      
      const textContent = finalInputValue + attachmentContext;
      if (textContent) {
        contentParts.push({
          type: 'text',
          text: textContent,
        });
      }
      
      imageAttachments.forEach(att => {
        contentParts.push({
          type: 'image_url',
          image_url: { url: att.url },
        });
      });
      
      aiMessageContent = contentParts;
    } else {
      aiMessageContent = finalInputValue + attachmentContext;
    }
    
    // 用户消息：只保存用户输入和附件信息，不包含解析后的内容
    const userMessage: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      role: 'user',
      content: finalInputValue, // 只保存用户输入，不包含附件解析内容
      timestamp: Date.now(),
      attachments: attachments.length > 0 ? attachments : undefined, // 附件信息单独保存
    };
    
    addMessage(expandedNodeId, userMessage);
    
    setInputValue('');
    setActiveQuote(null);
    setAttachments([]);
    
    addStreamingNode(expandedNodeId);
    setIsStreaming(true);
    
    const aiMessageId = `msg_${Date.now() + 1}_${Math.random().toString(36).slice(2)}`;
    const aiMessage: Message = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now() + 1,
      status: 'streaming',
    };
    addMessage(expandedNodeId, aiMessage);
    
    try {
      const contextMessages = getContextMessages();
      
      // 构建发送给AI的消息（使用包含附件解析内容的版本）
      const aiRequestMessage: Message = {
        ...userMessage,
        content: typeof aiMessageContent === 'string' ? aiMessageContent : finalInputValue + attachmentContext,
      };
      
      const requestMessages: Message[] = [
        ...contextMessages,
        ...messagesRef.current.filter(m => m.role !== 'system'),
        aiRequestMessage,
      ];
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: requestMessages,
          nodeId: expandedNodeId,
          multimodal: imageAttachments.length > 0,
          systemPrompt,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');
      
      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let searchEnhanced = false; // 搜索增强标记
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        
        // 解析 SSE 事件
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const json = JSON.parse(line.slice(6));
              
              // 处理搜索触发事件
              if (json.type === 'search_triggered') {
                searchEnhanced = true;
                continue;
              }
              
              if (json.type === 'content' && json.content) {
                // 如果是搜索增强的消息，在开头添加标记（只添加一次）
                if (searchEnhanced && !accumulatedContent) {
                  accumulatedContent = '🔍 **已联网搜索**\n\n';
                  searchEnhanced = false;
                }
                accumulatedContent += json.content;
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
        
        const now = Date.now();
        if (now - lastStreamUpdateTime.current >= 300) {
          startTransition(() => {
            updateMessage(expandedNodeId!, aiMessageId, accumulatedContent, 'streaming');
          });
          lastStreamUpdateTime.current = now;
        } else {
          pendingStreamUpdate.current = { content: accumulatedContent, messageId: aiMessageId };
          
          if (streamUpdateTimeout.current) {
            clearTimeout(streamUpdateTimeout.current);
          }
          
          streamUpdateTimeout.current = setTimeout(() => {
            if (pendingStreamUpdate.current) {
              startTransition(() => {
                updateMessage(expandedNodeId!, pendingStreamUpdate.current!.messageId, pendingStreamUpdate.current!.content, 'streaming');
              });
              pendingStreamUpdate.current = null;
            }
          }, 300);
        }
      }
      
      startTransition(() => {
        updateMessage(expandedNodeId!, aiMessageId, accumulatedContent, 'complete');
      });
      
    } catch (error) {
      console.error('Failed to send message:', error);
      startTransition(() => {
        updateMessage(expandedNodeId!, aiMessageId, '抱歉，发送消息时出现错误，请稍后重试。', 'error');
      });
    } finally {
      setIsStreaming(false);
      removeStreamingNode(expandedNodeId!);
    }
  }, [expandedNodeId, inputValue, attachments, isStreaming, addMessage, updateMessage, addStreamingNode, removeStreamingNode, getContextMessages, systemPrompt]);
  
  // 键盘事件处理
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);
  
  // 保存标题
  const saveTitle = useCallback(() => {
    const trimmed = editTitleValue.trim();
    if (trimmed && trimmed !== title && expandedNodeId) {
      updateNodeData(expandedNodeId, { title: trimmed });
    } else {
      setEditTitleValue(title);
    }
    setIsEditingTitle(false);
  }, [expandedNodeId, editTitleValue, title, updateNodeData]);
  
  // 添加标签
  const addTag = useCallback(() => {
    const trimmed = newTagValue.trim();
    if (trimmed && !tags.includes(trimmed) && expandedNodeId) {
      updateNodeData(expandedNodeId, { tags: [...tags, trimmed] });
    }
    setNewTagValue('');
    setIsAddingTag(false);
  }, [expandedNodeId, tags, newTagValue, updateNodeData]);
  
  // 删除标签
  const removeTag = useCallback((tagToRemove: string) => {
    if (!expandedNodeId) return;
    updateNodeData(expandedNodeId, { tags: tags.filter(t => t !== tagToRemove) });
  }, [expandedNodeId, tags, updateNodeData]);
  
  // 切换上下文开关
  const toggleContext = useCallback((sourceId: string) => {
    if (!expandedNodeId) return;
    updateNodeData(expandedNodeId, {
      contextEnabled: {
        ...contextEnabled,
        [sourceId]: contextEnabled[sourceId] === false ? true : false,
      },
    });
  }, [expandedNodeId, contextEnabled, updateNodeData]);
  
  // 更新节点状态
  const setStatus = useCallback((newStatus: 'idle' | 'active' | 'completed') => {
    if (!expandedNodeId) return;
    updateNodeData(expandedNodeId, { status: newStatus });
    setIsMenuOpen(false);
  }, [expandedNodeId, updateNodeData]);
  
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
  
  // 条件渲染
  if (!hasExpandedNode || !shouldRender) return null;
  
  return (
    <>
      {/* 遮罩层 - 带淡入淡出动画 */}
      <div 
        className={cn(
          'fixed inset-0 z-40',
          isClosing ? 'animate-overlay-fade-out' : 'animate-overlay-fade-in'
        )}
        style={{ background: 'rgba(0, 0, 0, 0.4)' }}
        onClick={handleClose}
      />
      
      {/* 抽屉主体 - 缤纷晨光主题 */}
      <div 
        className={cn(
          'fixed z-50 flex flex-col',
          isClosing ? 'animate-panel-expand-out' : 'animate-panel-expand-in',
          // 全屏切换时的过渡动画
          isFullscreen && !isClosing && 'transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)]'
        )}
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-primary)',
          borderRadius: isFullscreen ? 'var(--radius-xl)' : 'var(--radius-xl) 0 0 var(--radius-xl)',
          boxShadow: 'var(--shadow-colorful-glow)',
          // 使用 CSS 变量控制位置，支持平滑过渡
          ...(isFullscreen 
            ? { inset: '1rem', width: 'calc(100% - 2rem)', height: 'calc(100% - 2rem)', maxWidth: '800px', margin: '0 auto' }
            : { right: '1rem', top: '1rem', bottom: '1rem', width: '500px' }
          ),
        }}
        onDoubleClick={handlePanelDoubleClick}
      >
        {/* ===== 头部 ===== */}
        <div 
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: '1px solid var(--border-primary)' }}
        >
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {/* 状态指示器 */}
            <div 
              className={cn(
                'w-2.5 h-2.5 rounded-full flex-shrink-0',
                status === 'active' && 'animate-pulse',
              )}
              style={{ background: statusColors[status] }}
            />
            
            {/* 图标 */}
            <div 
              className="p-1.5 rounded-lg flex-shrink-0"
              style={{ background: 'var(--accent-light)' }}
            >
              <MessageSquare className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            </div>
            
            {/* 标题 */}
            <div className="flex-1 min-w-0">
              {isEditingTitle ? (
                <input
                  ref={titleInputRef}
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
                  className="w-full bg-transparent text-sm font-medium outline-none rounded-sm"
                  style={{
                    color: 'var(--text-primary)',
                    borderBottom: '1px solid var(--accent-primary)',
                  }}
                  placeholder="输入标题..."
                />
              ) : (
                <div 
                  className="flex items-center gap-1.5 cursor-pointer group"
                  onDoubleClick={() => { setIsEditingTitle(true); setEditTitleValue(title); }}
                >
                  <span 
                    className="text-sm font-medium truncate"
                    style={{ 
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-noto-sans)',
                    }}
                  >
                    {title}
                  </span>
                  <Edit3 
                    className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" 
                    style={{ color: 'var(--text-tertiary)' }}
                  />
                </div>
              )}
              
              {/* 上下文来源指示 */}
              {contextNodes.length > 0 && (
                <button
                  onClick={() => setShowContextPanel(!showContextPanel)}
                  className="flex items-center gap-1 text-xs transition-colors mt-0.5"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  <Link2 className="w-3 h-3" />
                  <span>{contextNodes.length} 个上下文</span>
                </button>
              )}
            </div>
          </div>
          
          {/* 右侧操作按钮 */}
          <div className="flex items-center gap-0.5">
            {/* 状态选择菜单 */}
            <div className="relative mr-1">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200',
                )}
                style={{
                  background: status === 'idle' ? 'var(--bg-secondary)' 
                    : status === 'active' ? 'var(--accent-light)' 
                    : 'rgba(110, 231, 183, 0.2)',
                  color: status === 'idle' ? 'var(--text-tertiary)' 
                    : status === 'active' ? 'var(--accent-primary)' 
                    : 'var(--color-mint)',
                }}
              >
                {status === 'completed' ? <Check className="w-3.5 h-3.5" /> : <MoreVertical className="w-3.5 h-3.5" />}
              </button>
              
              {isMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsMenuOpen(false)}
                  />
                  <div 
                    className="absolute right-0 top-full mt-1 w-44 rounded-lg shadow-lg z-50 overflow-hidden"
                    style={{
                      background: 'var(--node-bg)',
                      border: '1px solid var(--border-primary)',
                    }}
                  >
                    <div 
                      className="px-3 py-1.5 text-xs"
                      style={{ 
                        color: 'var(--text-tertiary)',
                        borderBottom: '1px solid var(--border-primary)',
                      }}
                    >
                      设置状态
                    </div>
                    <button
                      onClick={() => setStatus('idle')}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors"
                      style={{ color: 'var(--text-primary)' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--text-tertiary)' }} />
                      未开始
                    </button>
                    <button
                      onClick={() => setStatus('active')}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors"
                      style={{ color: 'var(--text-primary)' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--color-coral)' }} />
                      进行中
                    </button>
                    <button
                      onClick={() => setStatus('completed')}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors"
                      style={{ color: 'var(--text-primary)' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--color-mint)' }} />
                      已完成
                    </button>
                    
                    <div style={{ borderTop: '1px solid var(--border-primary)', margin: '4px 0' }} />
                    
                    <button
                      onClick={() => { setShowSettings(true); setIsMenuOpen(false); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors"
                      style={{ color: 'var(--text-primary)' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <Settings className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
                      系统提示词
                    </button>
                    <button
                      onClick={() => { deleteNode(expandedNodeId!); handleClose(); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors"
                      style={{ color: 'var(--color-danger)' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(224, 62, 62, 0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      删除节点
                    </button>
                  </div>
                </>
              )}
            </div>
            
            {/* 全屏切换按钮 */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg transition-all duration-200"
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
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            
            {/* 关闭按钮 */}
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg transition-all duration-200"
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
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* 上下文管理面板 */}
        {showContextPanel && contextNodes.length > 0 && (
          <div 
            className="px-4 py-2"
            style={{ 
              borderBottom: '1px solid var(--border-primary)',
              background: 'var(--accent-subtle)',
            }}
          >
            <div 
              className="text-xs mb-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              上下文来源
            </div>
            <div className="space-y-1.5">
              {contextNodes.map((node) => (
                <div
                  key={node.id}
                  className="flex items-center justify-between py-1 px-2 rounded-lg"
                  style={{ background: 'var(--bg-secondary)' }}
                >
                  <span 
                    className="text-xs truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {node.title}
                  </span>
                  <button
                    onClick={() => toggleContext(node.id)}
                    className={cn(
                      'w-5 h-5 rounded flex items-center justify-center transition-all duration-200'
                    )}
                    style={{
                      background: node.enabled ? 'var(--accent-light)' : 'var(--bg-tertiary)',
                      color: node.enabled ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                    }}
                  >
                    {node.enabled ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 系统提示词设置面板 */}
        {showSettings && (
          <div 
            className="px-4 py-3"
            style={{ 
              borderBottom: '1px solid var(--border-primary)',
              background: 'var(--accent-subtle)',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span 
                className="text-xs"
                style={{ color: 'var(--text-secondary)' }}
              >
                系统提示词
              </span>
              <button
                onClick={() => setShowSettings(false)}
                style={{ color: 'var(--text-tertiary)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              value={systemPrompt || ''}
              onChange={(e) => updateNodeData(expandedNodeId!, { systemPrompt: e.target.value })}
              placeholder="设置该节点的系统提示词..."
              rows={3}
              className="w-full px-3 py-2 text-xs rounded-lg resize-none outline-none"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        )}
        
        {/* 标签区域 */}
        <div 
          className="flex flex-wrap items-center gap-1.5 px-4 py-2"
          style={{ borderBottom: '1px solid var(--border-primary)' }}
        >
          {tags.map((tag, index) => (
            <span
              key={index}
              className="group flex items-center gap-1 px-2 py-0.5 text-xs rounded-full"
              style={{
                background: 'var(--accent-light)',
                color: 'var(--accent-primary)',
              }}
            >
              #{tag}
              <button
                onClick={() => removeTag(tag)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          
          {isAddingTag ? (
            <input
              ref={tagInputRef}
              type="text"
              value={newTagValue}
              onChange={(e) => setNewTagValue(e.target.value)}
              onBlur={addTag}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addTag();
                if (e.key === 'Escape') { setIsAddingTag(false); setNewTagValue(''); }
              }}
              placeholder="标签名..."
              className="w-20 px-2 py-0.5 text-xs rounded-full outline-none"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--accent-primary)',
                color: 'var(--text-primary)',
              }}
            />
          ) : (
            <button
              onClick={() => setIsAddingTag(true)}
              className="flex items-center gap-0.5 px-2 py-0.5 text-xs transition-colors"
              style={{ color: 'var(--text-tertiary)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
            >
              <Plus className="w-3 h-3" />
              标签
            </button>
          )}
        </div>
        
        {/* 摘要区域 */}
        {summary && (
          <div 
            className="overflow-hidden transition-all duration-300"
            style={{ borderBottom: '1px solid var(--border-primary)' }}
          >
            <button
              onClick={() => setIsSummaryCollapsed(!isSummaryCollapsed)}
              className="w-full px-4 py-2.5 flex items-center justify-between transition-colors group"
              style={{ background: 'var(--accent-subtle)' }}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--color-lavender)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--color-lavender)' }}>知识摘要</span>
              </div>
              <div className="flex items-center gap-2">
                {!isSummaryCollapsed && (
                  <span 
                    className="text-[10px] transition-colors"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {summary.slice(0, 50)}{summary.length > 50 ? '...' : ''}
                  </span>
                )}
                <X className={cn(
                  'w-3.5 h-3.5 transition-transform duration-300',
                  !isSummaryCollapsed && 'rotate-180'
                )} 
                style={{ color: 'var(--text-tertiary)' }}
                />
              </div>
            </button>
            
            <div 
              className={cn(
                'px-4 pb-3 overflow-hidden transition-all duration-300 ease-in-out',
                isSummaryCollapsed ? 'max-h-0 opacity-0' : 'max-h-[300px] opacity-100'
              )}
            >
              <div className="pt-2">
                <p 
                  className="text-xs leading-relaxed whitespace-pre-wrap"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {summary}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* 消息列表 */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-3 relative">
          {/* 划线菜单 */}
          <HighlightMenu onAction={handleHighlightMenuAction} />
          
          {/* 目标节点选择器 */}
          {showTargetPicker && highlightMenuState && (
            <TargetNodePicker
              position={{
                x: highlightMenuState.position.x,
                y: highlightMenuState.position.y,
              }}
              actionType={pendingExcerptType}
              onSelect={handleTargetNodeSelect}
              onClose={() => setShowTargetPicker(false)}
            />
          )}
          
          {/* 批注输入弹窗 */}
          {showNoteInputDialog && highlightMenuState && (
            <NoteInputDialog
              selectedText={highlightMenuState.selectedText}
              position={{
                x: highlightMenuState.position.x,
                y: highlightMenuState.position.y,
              }}
              onConfirm={handleNoteInputConfirm}
              onCancel={handleNoteInputCancel}
            />
          )}
          
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: 'var(--accent-light)' }}
              >
                <Sparkles className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
              </div>
              <p 
                className="text-sm mb-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                开始你的对话
              </p>
              <p 
                className="text-xs"
                style={{ color: 'var(--text-tertiary)' }}
              >
                输入问题，AI 将为你解答
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => (
                <MessageItem key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        
        {/* 输入区域 */}
        <div className="px-4 pb-4">
          {/* 引用块 - 显示在输入框上方 */}
          {activeQuote && (
            <QuoteBlock
              quote={activeQuote}
              onRemove={() => setActiveQuote(null)}
              isFocused={inputFocused}
            />
          )}
          
          {/* 附件预览区域 */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="relative group cursor-pointer"
                  onClick={() => {
                    // 点击预览文件
                    setPreviewingFile(attachment);
                  }}
                >
                  {attachment.type === 'image' ? (
                    <div 
                      className="relative w-16 h-16 rounded-lg overflow-hidden"
                      style={{ 
                        border: '1px solid var(--border-primary)',
                        background: 'var(--bg-secondary)',
                      }}
                    >
                      <img
                        src={attachment.url}
                        alt={attachment.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAttachment(attachment.id);
                        }}
                        className="absolute top-1 right-1 p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: 'var(--color-danger)' }}
                      >
                        <X className="w-3 h-3" style={{ color: 'white' }} />
                      </button>
                    </div>
                  ) : (
                    <div 
                      className="w-16 h-16 rounded-lg flex flex-col items-center justify-center p-2 gap-1"
                      style={{ 
                        border: '1px solid var(--border-primary)',
                        background: 'var(--bg-secondary)',
                      }}
                    >
                      {attachment.type === 'pdf' && (
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="1.5">
                          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M14 2V8H20" strokeLinecap="round" strokeLinejoin="round"/>
                          <text x="8" y="16" fontSize="6" fill="var(--color-danger)" fontWeight="bold">PDF</text>
                        </svg>
                      )}
                      {attachment.type === 'word' && (
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="var(--color-info)" strokeWidth="1.5">
                          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M14 2V8H20" strokeLinecap="round" strokeLinejoin="round"/>
                          <text x="7" y="16" fontSize="6" fill="var(--color-info)" fontWeight="bold">W</text>
                        </svg>
                      )}
                      {(attachment.type === 'excel') && (
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="1.5">
                          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M14 2V8H20" strokeLinecap="round" strokeLinejoin="round"/>
                          <text x="7" y="16" fontSize="6" fill="var(--color-success)" fontWeight="bold">X</text>
                        </svg>
                      )}
                      {attachment.type === 'powerpoint' && (
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)" strokeWidth="1.5">
                          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M14 2V8H20" strokeLinecap="round" strokeLinejoin="round"/>
                          <text x="7" y="16" fontSize="6" fill="var(--color-warning)" fontWeight="bold">P</text>
                        </svg>
                      )}
                      {attachment.type === 'file' && (
                        <ImageIcon className="w-6 h-6" style={{ color: 'var(--text-tertiary)' }} />
                      )}
                      <span className="text-[10px] truncate max-w-[60px]" style={{ color: 'var(--text-tertiary)' }}>
                        {attachment.name}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAttachment(attachment.id);
                        }}
                        className="absolute top-1 right-1 p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: 'var(--color-danger)' }}
                      >
                        <X className="w-3 h-3" style={{ color: 'white' }} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {attachments.length > 0 && (
                <button
                  onClick={clearAttachments}
                  className="px-2 py-1 text-xs transition-colors"
                  style={{ color: 'var(--text-tertiary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-danger)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
                >
                  清空
                </button>
              )}
            </div>
          )}
          
          <div className="relative">
            {/* 文件上传按钮 */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.png,.jpg,.jpeg,.gif,.webp,image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isStreaming}
              className="absolute left-3 bottom-3 p-2 rounded-lg transition-all duration-200 disabled:opacity-50"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-hover)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
              title="上传文件 (PDF/Office/图片)"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="输入消息... (Enter 发送，@ 引用节点，支持上传PDF/Office/图片)"
              disabled={isStreaming || (!allowConcurrentStreaming && !canSendMessage())}
              rows={2}
              className="w-full pl-12 pr-12 py-3 text-sm resize-none rounded-xl outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)',
                color: 'var(--text-primary)',
              }}
            />
            <button
              onClick={handleSend}
              disabled={(!inputValue.trim() && !activeQuote && attachments.length === 0) || isStreaming || (!allowConcurrentStreaming && !canSendMessage())}
              className="absolute right-3 bottom-3 p-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: (inputValue.trim() || activeQuote || attachments.length > 0) && !isStreaming
                  ? 'var(--accent-primary)' 
                  : 'var(--bg-tertiary)',
                color: (inputValue.trim() || activeQuote || attachments.length > 0) && !isStreaming
                  ? 'var(--text-inverse)' 
                  : 'var(--text-tertiary)',
              }}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* 文件预览面板 */}
      <FilePreview />
    </>
  );
}
