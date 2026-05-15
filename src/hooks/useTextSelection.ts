/**
 * 文本选中检测 Hook
 * 用于检测用户在消息内容中的文本选中操作
 */

import { useEffect, useCallback, useRef, useState } from 'react';

/**
 * 文本选中的结果
 */
export interface TextSelection {
  text: string; // 选中的文本
  html: string; // 选中内容的HTML（保留格式）
  range: Range; // DOM Range 对象
  rect: DOMRect; // 选区的位置和大小
  startOffset: number; // 在消息内容中的起始字符偏移
  endOffset: number; // 在消息内容中的结束字符偏移
  messageId: string; // 消息 ID
  fullContent: string; // 完整消息内容（用于获取上下文）
}

/**
 * useTextSelection Hook 参数
 */
interface UseTextSelectionParams {
  /** 容器元素的 ref */
  containerRef: React.RefObject<HTMLElement | null>;
  /** 选中完成时的回调 */
  onSelection: (selection: TextSelection) => void;
  /** 选区清除时的回调 */
  onSelectionClear: () => void;
  /** 最小选中字符数 */
  minChars?: number;
}

/**
 * 文本选中检测 Hook
 */
export function useTextSelection({
  containerRef,
  onSelection,
  onSelectionClear,
  minChars = 1,
}: UseTextSelectionParams) {
  const lastSelectionText = useRef<string>('');
  // 使用 state 跟踪容器元素，确保在 ref 绑定后重新注册事件
  const [containerElement, setContainerElement] = useState<HTMLElement | null>(null);
  
  // 监听 ref 变化
  useEffect(() => {
    if (containerRef.current && containerRef.current !== containerElement) {
      setContainerElement(containerRef.current);
    }
  }); // 每次渲染都检查

  // 处理选中逻辑
  const handleSelection = useCallback(() => {
    const selection = window.getSelection();
    
    // 没有选中内容或选区已折叠
    if (!selection || selection.isCollapsed) {
      return null;
    }
    
    const text = selection.toString().trim();
    
    // 选中文本太短
    if (text.length < minChars) {
      return null;
    }
    
    // 获取选区
    const range = selection.getRangeAt(0);
    
    // 获取选区的容器元素（选区所在的元素）
    let rangeContainerElement: HTMLElement | null = range.commonAncestorContainer as HTMLElement;
    if (rangeContainerElement.nodeType === Node.TEXT_NODE) {
      rangeContainerElement = rangeContainerElement.parentElement;
    }
    
    // 确保选区在容器内
    const container = containerElement; // 使用状态变量
    
    if (!container) {
      return null;
    }
    
    // 检查选区是否在容器内（处理文本节点的情况）
    const rangeContainer = range.commonAncestorContainer;
    const isInRange = container.contains(rangeContainer) || 
      (rangeContainer.nodeType === Node.TEXT_NODE && container.contains(rangeContainer.parentElement));
    
    if (!isInRange) {
      return null;
    }
    
    // 获取消息元素
    const messageElement = rangeContainerElement?.closest('[data-message-id]') as HTMLElement;
    if (!messageElement) {
      return null;
    }
    
    const messageId = messageElement.dataset.messageId;
    if (!messageId) {
      return null;
    }
    
    // 获取选区位置
    const rect = range.getBoundingClientRect();
    
    // 计算字符偏移量
    let startOffset = 0;
    let endOffset = 0;
    let fullContent = '';
    
    // 使用 messageElement 作为遍历范围
    const walkContainer = messageElement;
    
    // 遍历消息内容元素，计算偏移量
    const walker = document.createTreeWalker(
      walkContainer,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    let currentOffset = 0;
    let foundStart = false;
    
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const nodeLength = node.textContent?.length || 0;
      
      // 检查是否是选区起始节点
      if (node === range.startContainer || (node as Node).contains(range.startContainer)) {
        startOffset = currentOffset + range.startOffset;
        foundStart = true;
      }
      
      // 检查是否是选区结束节点
      if (node === range.endContainer || (node as Node).contains(range.endContainer)) {
        endOffset = currentOffset + range.endOffset;
      }
      
      // 累加内容
      fullContent += node.textContent || '';
      currentOffset += nodeLength;
    }
    
    // 如果没有找到选区，使用简单的字符计数方法
    if (!foundStart) {
      const preSelectionRange = range.cloneRange();
      preSelectionRange.selectNodeContents(walkContainer);
      preSelectionRange.setEnd(range.startContainer, range.startOffset);
      startOffset = preSelectionRange.toString().length;
      endOffset = startOffset + text.length;
      fullContent = walkContainer.textContent || '';
    }
    
    // 获取选中内容的HTML（保留格式）
    let html = '';
    try {
      const fragment = range.cloneContents();
      const div = document.createElement('div');
      div.appendChild(fragment);
      html = div.innerHTML;
    } catch (e) {
      // 如果获取HTML失败，使用纯文本
      html = text;
    }
    
    return {
      text,
      html,
      range,
      rect,
      startOffset,
      endOffset,
      messageId,
      fullContent,
    };
  }, [containerElement, minChars]);

  // 鼠标松开事件 - 主要的选中检测时机
  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      // 延迟执行，确保 selection 已更新
      setTimeout(() => {
        const result = handleSelection();
        
        if (result) {
          lastSelectionText.current = result.text;
          onSelection(result);
        }
      }, 10);
    },
    [handleSelection, onSelection]
  );

  // 选择变化事件 - 只用于检测选区被清除，不用于显示菜单
  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection();
    
    // 选区被清除
    if (!selection || selection.isCollapsed) {
      if (lastSelectionText.current) {
        lastSelectionText.current = '';
        // 检查焦点是否在菜单内
        const activeElement = document.activeElement;
        const isMenuFocused = activeElement?.closest('[data-highlight-menu]');
        
        if (!isMenuFocused) {
          onSelectionClear();
        }
      }
      return;
    }
    
    // 注意：不再在这里触发 onSelection
    // 菜单只在 mouseup 后显示，避免选择过程中菜单闪烁
  }, [onSelectionClear]);

  // 点击事件 - 用于关闭菜单
  const handleClick = useCallback(
    (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // 检查是否点击了菜单
      const isMenuClick = target.closest('[data-highlight-menu]');
      
      // 如果点击了菜单外，清除选区
      if (!isMenuClick) {
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed) {
          // 不清除选区，只记录状态
        }
      }
    },
    []
  );

  // 注册事件监听
  useEffect(() => {
    if (!containerElement) {
      return;
    }
    
    // 在容器上监听 mouseup
    containerElement.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('click', handleClick, true);
    
    return () => {
      containerElement.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('click', handleClick, true);
    };
  }, [containerElement, handleMouseUp, handleSelectionChange, handleClick]);

  // 手动清除选区
  const clearSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }
    lastSelectionText.current = '';
    onSelectionClear();
  }, [onSelectionClear]);

  return {
    clearSelection,
  };
}
