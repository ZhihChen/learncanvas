'use client';

/**
 * 连线配置面板
 * 用于配置上下文传递策略
 * 
 * 特性：
 * - 跟随画布缩放和平移
 * - 支持在画布内拖动
 * - 自动调整位置防止超出视口
 */

import { memo, useState, useCallback, useEffect, useRef } from 'react';
import { 
  X, 
  MessageSquare, 
  Sparkles, 
  Clock, 
  Hash,
  Settings,
  ChevronDown,
  Check,
  GripVertical,
} from 'lucide-react';
import { useViewport } from '@xyflow/react';
import { cn } from '@/lib/utils';
import type { ContextTransferStrategy, ContextTransferConfig, Message } from '@/types';

interface EdgeConfigPanelProps {
  edgeId: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourceNodeTitle: string;
  targetNodeTitle: string;
  sourceMessages: Message[];
  sourceSummary?: string;
  currentConfig?: ContextTransferConfig;
  onSave: (edgeId: string, config: ContextTransferConfig) => void;
  onDelete: (edgeId: string) => void;
  onClose: () => void;
  position: { x: number; y: number }; // 画布坐标
}

// 策略选项
const strategyOptions: Array<{
  value: ContextTransferStrategy;
  label: string;
  description: string;
  icon: typeof MessageSquare;
}> = [
  {
    value: 'all',
    label: '全部传递',
    description: '传递所有对话历史',
    icon: MessageSquare,
  },
  {
    value: 'summary',
    label: '智能摘要',
    description: 'AI生成的内容摘要',
    icon: Sparkles,
  },
  {
    value: 'recent',
    label: '最近消息',
    description: '仅传递最近N条消息',
    icon: Clock,
  },
  {
    value: 'custom',
    label: '自定义选择',
    description: '手动选择要传递的消息',
    icon: Hash,
  },
];

function EdgeConfigPanelComponent({
  edgeId,
  sourceNodeId,
  targetNodeId,
  sourceNodeTitle,
  targetNodeTitle,
  sourceMessages,
  sourceSummary,
  currentConfig,
  onSave,
  onDelete,
  onClose,
  position,
}: EdgeConfigPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { x: viewportX, y: viewportY, zoom } = useViewport();
  
  // 拖动状态
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // 面板位置（画布坐标）
  const [panelPosition, setPanelPosition] = useState(position);
  
  // 配置状态
  const [strategy, setStrategy] = useState<ContextTransferStrategy>(currentConfig?.strategy || 'all');
  const [recentCount, setRecentCount] = useState(currentConfig?.recentCount || 3);
  const [enabled, setEnabled] = useState(currentConfig?.enabled ?? true);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>(
    currentConfig?.customMessageIds || []
  );
  const [showStrategyDropdown, setShowStrategyDropdown] = useState(false);
  
  // 将画布坐标转换为屏幕坐标
  const screenPosition = {
    x: panelPosition.x * zoom + viewportX,
    y: panelPosition.y * zoom + viewportY,
  };
  
  // 智能调整位置，确保不超出视口
  const [adjustedScreenPosition, setAdjustedScreenPosition] = useState(screenPosition);
  const [positionReady, setPositionReady] = useState(false);
  
  useEffect(() => {
    requestAnimationFrame(() => {
      if (panelRef.current) {
        const panelRect = panelRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const padding = 16;
        
        let x = screenPosition.x;
        let y = screenPosition.y;
        
        // 确保不超出右边界
        if (x + panelRect.width > viewportWidth - padding) {
          x = viewportWidth - panelRect.width - padding;
        }
        
        // 确保不超出左边界
        if (x < padding) {
          x = padding;
        }
        
        // 确保不超出底部
        if (y + panelRect.height > viewportHeight - padding) {
          y = viewportHeight - panelRect.height - padding;
        }
        
        // 确保不超出顶部
        if (y < padding) {
          y = padding;
        }
        
        setAdjustedScreenPosition({ x, y });
        setPositionReady(true);
      }
    });
  }, [screenPosition.x, screenPosition.y]);
  
  // 拖动处理
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    
    // 计算鼠标相对于面板左上角的偏移
    const rect = panelRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  }, []);
  
  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    // 计算新的屏幕坐标
    const newScreenX = e.clientX - dragOffset.x;
    const newScreenY = e.clientY - dragOffset.y;
    
    // 将屏幕坐标转换为画布坐标
    const newFlowX = (newScreenX - viewportX) / zoom;
    const newFlowY = (newScreenY - viewportY) / zoom;
    
    setPanelPosition({ x: newFlowX, y: newFlowY });
    setAdjustedScreenPosition({ x: newScreenX, y: newScreenY });
  }, [isDragging, dragOffset, viewportX, viewportY, zoom]);
  
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  // 全局鼠标事件
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      return () => {
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);
  
  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    // 延迟添加监听器，避免立即触发
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  
  // ESC 关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);
  
  // 保存配置
  const handleSave = useCallback(() => {
    const config: ContextTransferConfig = {
      strategy,
      recentCount: strategy === 'recent' ? recentCount : undefined,
      customMessageIds: strategy === 'custom' ? selectedMessageIds : undefined,
      enabled,
    };
    onSave(edgeId, config);
    onClose();
  }, [edgeId, strategy, recentCount, selectedMessageIds, enabled, onSave, onClose]);
  
  // 切换消息选择
  const toggleMessageSelection = useCallback((messageId: string) => {
    setSelectedMessageIds(prev => 
      prev.includes(messageId)
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  }, []);
  
  // 预览内容
  const previewContent = useCallback(() => {
    switch (strategy) {
      case 'summary':
        return sourceSummary || '暂无摘要，将使用最近3条消息';
      case 'recent':
        return sourceMessages.slice(-recentCount).map(m => 
          `${m.role === 'user' ? '👤' : '🤖'} ${m.content.slice(0, 40)}...`
        ).join('\n') || '暂无消息';
      case 'custom':
        return selectedMessageIds.length > 0
          ? sourceMessages.filter(m => selectedMessageIds.includes(m.id)).map(m =>
              `${m.role === 'user' ? '👤' : '🤖'} ${m.content.slice(0, 40)}...`
            ).join('\n')
          : '请选择要传递的消息';
      default:
        return `将传递全部 ${sourceMessages.length} 条消息`;
    }
  }, [strategy, recentCount, selectedMessageIds, sourceMessages, sourceSummary]);
  
  const currentStrategy = strategyOptions.find(s => s.value === strategy);
  
  return (
    <div
      ref={panelRef}
      className={cn(
        'fixed z-[9999] w-80 select-none',
        'bg-gradient-to-br from-[var(--node-bg)]/98 to-[var(--bg-secondary)]/98',
        'backdrop-blur-xl border border-[var(--border-light)]',
        'rounded-2xl shadow-2xl shadow-[var(--accent-primary)]/20',
        'overflow-hidden',
        'transition-opacity duration-150',
        positionReady ? 'opacity-100' : 'opacity-0',
        isDragging && 'cursor-grabbing',
      )}
      style={{ 
        left: adjustedScreenPosition.x, 
        top: adjustedScreenPosition.y,
        // 面板内容不随画布缩放，保持可读性
      }}
    >
      {/* 拖动手柄 + 头部 */}
      <div 
        className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-light)] bg-[var(--bg-tertiary)]/30 cursor-grab active:cursor-grabbing"
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-[var(--text-tertiary)]" />
          <Settings className="w-4 h-4 text-[var(--accent-primary)]" />
          <span className="text-sm font-medium text-[var(--text-primary)]">连线配置</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="p-1 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      {/* 内容 */}
      <div className="p-4 space-y-4">
        {/* 连线信息 */}
        <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
          <span className="truncate max-w-[100px]">{sourceNodeTitle}</span>
          <svg className="w-4 h-4 text-[var(--accent-primary)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          <span className="truncate max-w-[100px]">{targetNodeTitle}</span>
        </div>
        
        {/* 启用开关 */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--text-secondary)]">启用上下文传递</span>
          <button
            onClick={() => setEnabled(!enabled)}
            className={cn(
              'relative w-10 h-5 rounded-full transition-colors',
              enabled ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-tertiary)]'
            )}
          >
            <div className={cn(
              'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform',
              enabled ? 'translate-x-5' : 'translate-x-0.5'
            )} />
          </button>
        </div>
        
        {/* 传递策略选择 */}
        <div className="space-y-2">
          <label className="text-sm text-[var(--text-secondary)]">传递策略</label>
          <div className="relative">
            <button
              onClick={() => setShowStrategyDropdown(!showStrategyDropdown)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-[var(--border-light)] bg-[var(--bg-secondary)] hover:border-[var(--accent-primary)]/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                {currentStrategy && (
                  <>
                    <currentStrategy.icon className="w-4 h-4 text-[var(--accent-primary)]" />
                    <span className="text-sm text-[var(--text-primary)]">{currentStrategy.label}</span>
                  </>
                )}
              </div>
              <ChevronDown className={cn(
                'w-4 h-4 text-[var(--text-tertiary)] transition-transform',
                showStrategyDropdown && 'rotate-180'
              )} />
            </button>
            
            {/* 下拉菜单 */}
            {showStrategyDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 py-1 rounded-xl border border-[var(--border-light)] bg-[var(--bg-primary)] shadow-lg z-10">
                {strategyOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setStrategy(option.value);
                      setShowStrategyDropdown(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 hover:bg-[var(--bg-secondary)] transition-colors',
                      strategy === option.value && 'bg-[var(--accent-light)]'
                    )}
                  >
                    <option.icon className="w-4 h-4 text-[var(--accent-primary)]" />
                    <div className="flex-1 text-left">
                      <div className="text-sm text-[var(--text-primary)]">{option.label}</div>
                      <div className="text-xs text-[var(--text-tertiary)]">{option.description}</div>
                    </div>
                    {strategy === option.value && (
                      <Check className="w-4 h-4 text-[var(--accent-primary)]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* 最近消息数量 */}
        {strategy === 'recent' && (
          <div className="space-y-2">
            <label className="text-sm text-[var(--text-secondary)]">传递最近</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={Math.min(10, sourceMessages.length || 10)}
                value={recentCount}
                onChange={(e) => setRecentCount(Number(e.target.value))}
                className="flex-1 h-1.5 rounded-full bg-[var(--bg-tertiary)] appearance-none cursor-pointer"
              />
              <span className="text-sm font-medium text-[var(--text-primary)] min-w-[3rem] text-right">
                {recentCount} 条
              </span>
            </div>
          </div>
        )}
        
        {/* 自定义消息选择 */}
        {strategy === 'custom' && sourceMessages.length > 0 && (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            <label className="text-sm text-[var(--text-secondary)]">选择消息</label>
            <div className="space-y-1">
              {sourceMessages.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => toggleMessageSelection(msg.id)}
                  className={cn(
                    'w-full flex items-start gap-2 px-2 py-1.5 rounded-lg text-left transition-colors',
                    selectedMessageIds.includes(msg.id)
                      ? 'bg-[var(--accent-light)]'
                      : 'hover:bg-[var(--bg-secondary)]'
                  )}
                >
                  <div className={cn(
                    'w-4 h-4 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center',
                    selectedMessageIds.includes(msg.id)
                      ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)]'
                      : 'border-[var(--border-primary)]'
                  )}>
                    {selectedMessageIds.includes(msg.id) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span className="text-xs text-[var(--text-primary)] line-clamp-2">
                    {msg.role === 'user' ? '👤' : '🤖'} {msg.content}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* 预览 */}
        <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-light)]">
          <div className="text-xs text-[var(--text-tertiary)] mb-1">传递内容预览</div>
          <div className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap line-clamp-3">
            {previewContent()}
          </div>
        </div>
        
        {/* 操作按钮 */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => onDelete(edgeId)}
            className="flex-1 px-3 py-2 rounded-xl text-sm font-medium border border-[var(--color-danger)]/30 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-colors"
          >
            删除连线
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-3 py-2 rounded-xl text-sm font-medium bg-[var(--accent-primary)] text-white hover:opacity-90 transition-opacity"
          >
            保存配置
          </button>
        </div>
      </div>
    </div>
  );
}

export const EdgeConfigPanel = memo(EdgeConfigPanelComponent);
