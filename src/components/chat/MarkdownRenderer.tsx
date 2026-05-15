'use client';

/**
 * Markdown 渲染组件
 * 支持标题、列表、代码块、表格、链接、粗体、斜体等
 */

import { memo, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// 语法高亮规则 - 缤纷晨光主题（浅色背景适配）
const highlightRules: Record<string, Array<{ pattern: RegExp; className: string }>> = {
  javascript: [
    { pattern: /\b(const|let|var|function|return|if|else|for|while|class|import|export|from|default|async|await|try|catch|throw|new|this|null|undefined|true|false)\b/g, className: 'text-[var(--accent-lavender)]' },
    { pattern: /\b(console|document|window|Array|Object|String|Number|Boolean|Math|Date|JSON|Promise)\b/g, className: 'text-[var(--accent-amber)]' },
    { pattern: /(['"`])(?:(?!\1)[^\\]|\\.)*?\1/g, className: 'text-[var(--accent-mint)]' },
    { pattern: /\/\/.*$/gm, className: 'text-[var(--text-tertiary)]' },
  ],
  python: [
    { pattern: /\b(def|class|if|elif|else|for|while|return|import|from|as|try|except|with|lambda|None|True|False|self)\b/g, className: 'text-[var(--accent-lavender)]' },
    { pattern: /\b(print|len|range|str|int|float|list|dict|set)\b/g, className: 'text-[var(--accent-amber)]' },
    { pattern: /#.*$/gm, className: 'text-[var(--text-tertiary)]' },
  ],
  bash: [
    { pattern: /\b(if|then|else|fi|for|while|do|done|echo|cd|ls|cat|grep|mkdir|rm|cp|mv|sudo)\b/g, className: 'text-[var(--accent-lavender)]' },
    { pattern: /#.*$/gm, className: 'text-[var(--text-tertiary)]' },
  ],
  json: [
    { pattern: /"([^"]+)"(?=\s*:)/g, className: 'text-[var(--accent-sky)]' },
    { pattern: /:\s*"([^"]+)"/g, className: 'text-[var(--accent-mint)]' },
  ],
};

// 应用语法高亮 - 返回字符串，让调用者处理
function highlightCode(code: string, language: string): string {
  const rules = highlightRules[language] || [];
  let result = code;
  
  // 简单处理：直接返回代码，不做高亮
  // 高亮逻辑可能导致性能问题
  return result;
}

// 处理行内元素 - 返回带标记的字符串，然后分段渲染
function parseInlineElements(text: string): Array<{ type: string; content: string; url?: string }> {
  const result: Array<{ type: string; content: string; url?: string }> = [];
  
  // 简单处理：直接返回文本
  result.push({ type: 'text', content: text });
  return result;
}

// 渲染行内元素
function renderInlineElements(text: string, keyPrefix: string): React.ReactNode {
  // 预处理：转换 HTML 标签
  let processedText = text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?[^>]+(>|$)/g, ''); // 移除其他 HTML 标签
  
  // 预处理：转换 LaTeX 公式（简单版本）
  // 行内公式 $...$ 转换为数学样式
  processedText = processedText.replace(/\$([^$]+)\$/g, (match: string, formula: string) => {
    // 简单的 LaTeX 到 HTML 转换
    let htmlFormula = formula
      .replace(/\^([0-9]+|{[^}]+})/g, (match: string, power: string) => {
        // 处理上标
        if (power.startsWith('{') && power.endsWith('}')) {
          return `<sup>${power.slice(1, -1)}</sup>`;
        }
        return `<sup>${power}</sup>`;
      })
      .replace(/_([0-9]+|{[^}]+})/g, (match: string, sub: string) => {
        // 处理下标
        if (sub.startsWith('{') && sub.endsWith('}')) {
          return `<sub>${sub.slice(1, -1)}</sub>`;
        }
        return `<sub>${sub}</sub>`;
      });
    return `<span class="font-mono text-[var(--accent-sky)] italic">${htmlFormula}</span>`;
  });
  
  // 处理链接 [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  // 处理粗体 **text**
  const boldRegex = /\*\*([^*]+)\*\*/g;
  // 处理行内代码 `code`
  const codeRegex = /`([^`]+)`/g;
  
  // 简化处理：使用 replace 和数组
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let keyIndex = 0;
  
  // 合并所有需要处理的模式（添加高亮 ==text==）
  const combinedRegex = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`|==([^=]+)==)/g;
  let match;
  
  while ((match = combinedRegex.exec(processedText)) !== null) {
    // 添加匹配前的文本（包含可能已处理的 LaTeX）
    if (match.index > lastIndex) {
      const textBefore = processedText.slice(lastIndex, match.index);
      // 检查是否包含 HTML 标签（来自 LaTeX 转换）
      if (textBefore.includes('<span') || textBefore.includes('<sup') || textBefore.includes('<sub')) {
        // 使用 dangerouslySetInnerHTML 渲染 HTML
        parts.push(
          <span 
            key={`${keyPrefix}-html-${keyIndex++}`} 
            dangerouslySetInnerHTML={{ __html: textBefore }} 
          />
        );
      } else {
        parts.push(textBefore);
      }
    }
    
    const fullMatch = match[1];
    
    if (fullMatch.startsWith('[')) {
      // 链接
      parts.push(
        <a 
          key={`${keyPrefix}-link-${keyIndex++}`} 
          href={match[3]} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[var(--accent-primary)] hover:text-[var(--accent-lavender)] underline underline-offset-2 transition-colors"
        >
          {match[2]}
        </a>
      );
    } else if (fullMatch.startsWith('**')) {
      // 粗体
      parts.push(
        <strong key={`${keyPrefix}-bold-${keyIndex++}`} className="font-semibold text-[var(--text-primary)]">
          {match[4]}
        </strong>
      );
    } else if (fullMatch.startsWith('`')) {
      // 行内代码
      parts.push(
        <code 
          key={`${keyPrefix}-code-${keyIndex++}`} 
          className="px-1.5 py-0.5 bg-[var(--bg-tertiary)] text-[var(--accent-coral)] rounded text-xs font-mono"
        >
          {match[5]}
        </code>
      );
    } else if (fullMatch.startsWith('==')) {
      // 高亮
      parts.push(
        <mark 
          key={`${keyPrefix}-highlight-${keyIndex++}`} 
          className="excerpt-highlight bg-[var(--accent-amber)]/20 text-inherit px-0.5 rounded"
        >
          {match[6]}
        </mark>
      );
    }
    
    lastIndex = match.index + fullMatch.length;
  }
  
  // 添加剩余文本（包含可能已处理的 LaTeX）
  const remainingText = processedText.slice(lastIndex);
  if (remainingText) {
    if (remainingText.includes('<span') || remainingText.includes('<sup') || remainingText.includes('<sub')) {
      parts.push(
        <span 
          key={`${keyPrefix}-html-${keyIndex++}`} 
          dangerouslySetInnerHTML={{ __html: remainingText }} 
        />
      );
    } else {
      parts.push(remainingText);
    }
  }
  
  return parts.length > 0 ? parts : text;
}

// 最大渲染长度限制（字符数）
const MAX_RENDER_LENGTH = 10000;
// 最大代码块显示行数（超过则折叠）
const MAX_CODE_LINES = 50;

function MarkdownRendererComponent({ content, className }: MarkdownRendererProps) {
  // 复制状态管理
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [collapsedCode, setCollapsedCode] = useState<string | null>(null);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  const handleToggleCollapse = (id: string) => {
    setCollapsedCode(prev => prev === id ? null : id);
  };

  const rendered = useMemo(() => {
    if (!content) return null;

    // 性能优化：如果内容过长，截断显示
    let renderContent = content;
    let isTruncated = false;

    if (content.length > MAX_RENDER_LENGTH) {
      renderContent = content.slice(0, MAX_RENDER_LENGTH);
      isTruncated = true;
    }

    const lines = renderContent.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;
    let lineKey = 0;
    
    while (i < lines.length) {
      const line = lines[i];
      
      // 跳过空行
      if (!line.trim()) {
        i++;
        continue;
      }
      
      // 代码块 ```
      if (line.trim().startsWith('```')) {
        const language = line.trim().slice(3) || 'text';
        const codeLines: string[] = [];
        let j = i + 1;
        
        while (j < lines.length && lines[j].trim() !== '```') {
          codeLines.push(lines[j]);
          j++;
        }
        
        const code = codeLines.join('\n');
        const codeBlockId = `code-${lineKey}`;
        const isCollapsed = collapsedCode === codeBlockId;
        const shouldCollapse = codeLines.length > MAX_CODE_LINES;
        
        // 语法高亮处理（普通函数，不在 useMemo 内部使用 Hook）
        const applySyntaxHighlight = (code: string, lang: string): string => {
          if (!code) return code;
          
          const rules = highlightRules[lang.toLowerCase()] || [];
          if (rules.length === 0) return code;
          
          let result = code;
          // 简单的语法高亮（避免性能问题）
          rules.forEach(rule => {
            result = result.replace(rule.pattern, match => {
              return `<span class="${rule.className}">${match}</span>`;
            });
          });
          return result;
        };
        
        const highlightedCode = applySyntaxHighlight(code, language);
        
        const displayCode = isCollapsed ? codeLines.slice(0, MAX_CODE_LINES).join('\n') : code;
        const displayHighlightedCode = isCollapsed ? applySyntaxHighlight(codeLines.slice(0, MAX_CODE_LINES).join('\n'), language) : highlightedCode;
        
        elements.push(
          <div key={`codeblock-${lineKey++}`} className="my-3">
            <div className="bg-[var(--bg-tertiary)]/50 rounded-xl border border-[var(--border-light)] overflow-hidden shadow-sm">
              {/* 代码块头部 */}
              <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-secondary)] border-b border-[var(--border-light)]">
                <div className="flex items-center gap-2">
                  {language && language !== 'text' && (
                    <span className="text-xs font-medium text-[var(--accent-primary)] uppercase tracking-wide">{language}</span>
                  )}
                  {shouldCollapse && (
                    <button
                      onClick={() => handleToggleCollapse(codeBlockId)}
                      className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1"
                    >
                      {isCollapsed ? (
                        <>
                          <ChevronDown className="w-3 h-3" />
                          展开全部 ({codeLines.length} 行)
                        </>
                      ) : (
                        <>
                          <ChevronUp className="w-3 h-3" />
                          收起
                        </>
                      )}
                    </button>
                  )}
                </div>
                <button
                  onClick={() => handleCopyCode(code, codeBlockId)}
                  className="text-xs text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-colors flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[var(--accent-primary)]/10"
                >
                  {copiedCode === codeBlockId ? (
                    <>
                      <Check className="w-3 h-3" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      复制
                    </>
                  )}
                </button>
              </div>
              
              {/* 代码内容 */}
              <div className="p-4 overflow-x-auto max-h-[400px] bg-[var(--node-bg)]">
                <pre className="text-xs font-mono leading-relaxed">
                  <code 
                    className="text-[var(--text-primary)]"
                    dangerouslySetInnerHTML={{ __html: displayHighlightedCode || displayCode }}
                  />
                </pre>
              </div>
            </div>
          </div>
        );
        i = j + 1;
        continue;
      }
      
      // 标题 # ## ###
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        const text = headerMatch[2];
        
        const headingClasses: Record<number, string> = {
          1: 'text-2xl font-bold text-black mb-4 mt-6',
          2: 'text-xl font-semibold text-black mb-3 mt-5',
          3: 'text-lg font-semibold text-black mb-2 mt-4',
          4: 'text-base font-medium text-black mb-2 mt-3',
          5: 'text-sm font-medium text-black mb-1 mt-2',
          6: 'text-sm font-medium text-black mb-1 mt-2',
        };
        
        elements.push(
          <div key={`heading-${lineKey++}`} className={headingClasses[level] || headingClasses[6]}>
            {renderInlineElements(text, `h-${lineKey}`)}
          </div>
        );
        i++;
        continue;
      }

      // 表格 | 列1 | 列2 |
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        const tableRows: string[][] = [];
        let j = i;
        
        // 解析表格行
        while (j < lines.length && lines[j].trim().startsWith('|')) {
          const trimmed = lines[j].trim();
          if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
            // 移除首尾的 | 并按 | 分割
            const cells = trimmed.slice(1, -1).split('|').map(cell => cell.trim());
            tableRows.push(cells);
            j++;
          } else {
            break;
          }
        }
        
        // 检查是否有至少2行（表头 + 数据或分隔线）
        if (tableRows.length >= 2) {
          // 检查第二行是否是分隔线（包含 ---）
          const isSeparator = tableRows[1].every(cell => /^:?-+:?$/.test(cell));
          
          if (isSeparator && tableRows.length >= 3) {
            // 有分隔线，跳过分隔线
            const headers = tableRows[0];
            const dataRows = tableRows.slice(2);
            
            elements.push(
              <div key={`table-${lineKey++}`} className="my-4 overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--accent-amber)]/30">
                      {headers.map((header, idx) => (
                        <th key={`th-${idx}`} className="px-3 py-2 text-left text-xs font-semibold text-[var(--text-primary)]">
                          {renderInlineElements(header, `th-${lineKey}-${idx}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dataRows.map((row, rowIdx) => (
                      <tr key={`tr-${rowIdx}`} className="border-b border-[var(--border-light)] hover:bg-[var(--accent-amber)]/5 transition-colors">
                        {row.map((cell, cellIdx) => (
                          <td key={`td-${rowIdx}-${cellIdx}`} className="px-3 py-2 text-xs text-[var(--text-primary)]">
                            {renderInlineElements(cell, `td-${lineKey}-${rowIdx}-${cellIdx}`)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          } else {
            // 没有分隔线，第一行作为表头
            const headers = tableRows[0];
            const dataRows = tableRows.slice(1);
            
            elements.push(
              <div key={`table-${lineKey++}`} className="my-4 overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--accent-amber)]/30">
                      {headers.map((header, idx) => (
                        <th key={`th-${idx}`} className="px-3 py-2 text-left text-xs font-semibold text-[var(--text-primary)]">
                          {renderInlineElements(header, `th-${lineKey}-${idx}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dataRows.map((row, rowIdx) => (
                      <tr key={`tr-${rowIdx}`} className="border-b border-[var(--border-light)] hover:bg-[var(--accent-amber)]/5 transition-colors">
                        {row.map((cell, cellIdx) => (
                          <td key={`td-${rowIdx}-${cellIdx}`} className="px-3 py-2 text-xs text-[var(--text-primary)]">
                            {renderInlineElements(cell, `td-${lineKey}-${rowIdx}-${cellIdx}`)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
          i = j;
          continue;
        }
      }
      
      // 无序列表
      if (/^[\s]*[-*+]\s+/.test(line)) {
        const items: string[] = [];
        let j = i;
        while (j < lines.length) {
          const listMatch = lines[j].match(/^[\s]*[-*+]\s+(.+)$/);
          if (listMatch) {
            items.push(listMatch[1]);
            j++;
          } else {
            break;
          }
        }
        
        elements.push(
          <ul key={`ulist-${lineKey++}`} className="list-disc list-inside space-y-1 my-2 ml-4 text-[var(--text-primary)]">
            {items.map((item, idx) => (
              <li key={`uli-${lineKey}-${idx}`} className="text-[var(--text-primary)]">
                {renderInlineElements(item, `uli-${lineKey}-${idx}`)}
              </li>
            ))}
          </ul>
        );
        i = j;
        continue;
      }
      
      // 有序列表
      if (/^[\s]*\d+\.\s+/.test(line)) {
        const items: string[] = [];
        let j = i;
        while (j < lines.length) {
          const listMatch = lines[j].match(/^[\s]*(\d+)\.\s+(.+)$/);
          if (listMatch) {
            items.push(listMatch[2]);
            j++;
          } else {
            break;
          }
        }
        
        elements.push(
          <ol key={`olist-${lineKey++}`} className="list-decimal list-inside space-y-1 my-2 ml-4 text-[var(--text-primary)]">
            {items.map((item, idx) => (
              <li key={`oli-${lineKey}-${idx}`} className="text-[var(--text-primary)]">
                {renderInlineElements(item, `oli-${lineKey}-${idx}`)}
              </li>
            ))}
          </ol>
        );
        i = j;
        continue;
      }
      
      // 分隔线
      if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
        elements.push(<hr key={`hr-${lineKey++}`} className="border-[var(--border-light)] my-4" />);
        i++;
        continue;
      }
      
      // 普通段落
      elements.push(
        <p key={`para-${lineKey++}`} className="my-2 text-[var(--text-primary)] leading-relaxed">
          {renderInlineElements(line, `p-${lineKey}`)}
        </p>
      );
      i++;
    }
    
    // 如果内容被截断，添加提示
    if (isTruncated) {
      elements.push(
        <div key="truncated" className="my-3 text-center text-xs text-[var(--text-tertiary)] italic">
          内容过长，仅显示前 {MAX_RENDER_LENGTH} 个字符
        </div>
      );
    }
    
    return elements;
  }, [content]);

  if (!content) return null;

  return (
    <div className={cn('text-sm', className)}>
      {rendered}
    </div>
  );
}

export const MarkdownRenderer = memo(MarkdownRendererComponent);
