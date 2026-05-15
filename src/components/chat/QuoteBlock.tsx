'use client';

/**
 * 引用块组件
 * 显示在输入框上方，用于引用消息内容进行提问
 */

import { memo } from 'react';
import { X, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface QuoteData {
  /** 引用的文本内容 */
  text: string;
  /** 来源消息 ID */
  messageId: string;
  /** 来源节点标题 */
  sourceNodeTitle?: string;
}

interface QuoteBlockProps {
  /** 引用数据 */
  quote: QuoteData;
  /** 移除引用回调 */
  onRemove: () => void;
  /** 是否在输入框聚焦时显示 */
  isFocused?: boolean;
}

function QuoteBlockComponent({ quote, onRemove, isFocused }: QuoteBlockProps) {
  // 截断显示的文本
  const displayText = quote.text.length > 100 
    ? quote.text.slice(0, 100) + '...' 
    : quote.text;
  
  return (
    <div 
      className={cn(
        'flex items-start gap-2 px-3 py-2 mb-2',
        'bg-amber-500/10 border border-amber-500/20 rounded-lg',
        'transition-all duration-200',
        isFocused && 'ring-1 ring-amber-500/30'
      )}
    >
      {/* 左侧引用线 */}
      <div className="w-1 h-full min-h-[40px] bg-amber-500/50 rounded-full flex-shrink-0" />
      
      {/* 内容区 */}
      <div className="flex-1 min-w-0">
        {/* 来源信息 */}
        <div className="flex items-center gap-1.5 text-xs text-amber-400/70 mb-1">
          <MessageSquare className="w-3 h-3" />
          <span>引用{quote.sourceNodeTitle ? `「${quote.sourceNodeTitle}」` : ''}</span>
        </div>
        
        {/* 引用文本 */}
        <div className="text-sm text-stone-300 whitespace-pre-wrap leading-relaxed">
          {displayText}
        </div>
      </div>
      
      {/* 移除按钮 */}
      <button
        onClick={onRemove}
        className="p-1 text-stone-500 hover:text-stone-300 hover:bg-white/5 rounded transition-colors flex-shrink-0"
        title="移除引用"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export const QuoteBlock = memo(QuoteBlockComponent);
QuoteBlock.displayName = 'QuoteBlock';
