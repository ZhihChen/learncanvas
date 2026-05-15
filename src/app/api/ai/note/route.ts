/**
 * 笔记 AI 对话 API - 非流式响应
 * 基于笔记内容进行智能对话
 * 使用火山引擎 ARK API（OpenAI 兼容）
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: process.env.ARK_BASE_URL || 'https://ark.cn-beijing.volces.com/api/coding/v3',
  apiKey: process.env.ARK_API_KEY || '',
});

// 定义类型
interface NoteContextItem {
  nodeId: string;
  title: string;
  excerpts: Array<{
    id: string;
    content: string;
    htmlContent?: string;
    sourceNodeTitle: string;
  }>;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
}

// 构建系统提示词
function buildSystemPrompt(contextNotes: NoteContextItem[]): string {
  const notesContent = contextNotes
    .map((note) => {
      const excerptsText = note.excerpts
        .map((e) => e.content)
        .filter(Boolean)
        .join('\n');
      
      if (!excerptsText) return null;
      
      return `【${note.title}】\n${excerptsText}`;
    })
    .filter(Boolean)
    .join('\n\n---\n\n');

  return `你是一个专业的知识管理助手，帮助用户理解和整理笔记内容。

## 你的能力
1. 分析和总结笔记中的关键信息
2. 回答与笔记内容相关的问题
3. 发现笔记之间的关联和潜在联系
4. 帮助用户深入理解复杂概念
5. 提供结构化的知识整理建议

## 当前对话的上下文笔记内容

${notesContent || '（暂无笔记内容）'}

## 回答要求
1. 主要基于笔记内容回答问题
2. 如果问题超出笔记范围，可以适当补充相关知识，但要明确说明
3. 回答要简洁、清晰、有条理
4. 使用中文回答
5. 如果笔记内容不足以回答问题，请诚实说明
`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nodeId, userMessage, contextNotes, history = [] } = body;
    
    if (!userMessage || !contextNotes) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }
    
    // 构建系统提示词
    const systemPrompt = buildSystemPrompt(contextNotes);
    
    // 构建消息列表
    const allMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...history.map((msg: Message) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user', content: userMessage },
    ];
    
    // 调用 API
    const response = await openai.chat.completions.create({
      model: process.env.ARK_MODEL || 'doubao-seed-2-0-pro-260215',
      messages: allMessages as any,
      temperature: 0.7,
    });
    
    // 返回完整响应
    return NextResponse.json({ 
      content: response.choices[0]?.message?.content,
      success: true 
    });
    
  } catch (error) {
    console.error('Note AI API error:', error);
    
    return NextResponse.json({ 
      error: '服务暂时不可用，请稍后重试',
      details: error instanceof Error ? error.message : '未知错误',
      success: false
    }, { status: 500 });
  }
}
