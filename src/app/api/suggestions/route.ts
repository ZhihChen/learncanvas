/**
 * AI 智能建议 API
 * 分析对话内容和画布结构，生成深度学习建议
 * 使用火山引擎 ARK API（OpenAI 兼容）
 */

import { NextRequest } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: process.env.ARK_BASE_URL || 'https://ark.cn-beijing.volces.com/api/coding/v3',
  apiKey: process.env.ARK_API_KEY || '',
});

// 建议生成提示词
const SUGGESTION_PROMPT = `你是一个专业的学习顾问AI。请分析以下对话内容，生成 4 个有价值的下一步学习建议。

建议类型说明：
- new_topic: 开启新的相关话题探索
- deep_dive: 深入挖掘当前话题的某个方面
- related: 探索相关领域或概念
- action: 实践应用，将知识转化为行动

要求：
1. 每条建议必须基于对话内容，具体且有针对性
2. 建议应该有递进关系，从浅到深
3. 标题简洁有力，描述清晰说明学习价值
4. 至少包含 1 个 action 类型的建议

请严格按照以下 JSON 格式返回：
[
  {
    "title": "建议标题（简短有力）",
    "description": "详细描述这个学习方向的价值和预期收获",
    "type": "new_topic|deep_dive|related|action",
    "priority": 1-4,
    "reason": "为什么这个建议对用户有价值"
  }
]

对话内容：
`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, canvasContext } = body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: '缺少消息内容' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 格式化对话内容
    const conversationText = messages.slice(-10).map((msg: { role: string; content: string }) => {
      const role = msg.role === 'user' ? '用户' : 'AI助手';
      return `${role}: ${msg.content}`;
    }).join('\n\n');
    
    // 添加画布上下文（如果有）
    let fullPrompt = SUGGESTION_PROMPT + conversationText;
    if (canvasContext && canvasContext.length > 0) {
      fullPrompt += `\n\n当前画布中已有的相关话题：\n${canvasContext.map((n: { title: string; summary?: string }) => 
        `- ${n.title}${n.summary ? `: ${n.summary.slice(0, 50)}...` : ''}`
      ).join('\n')}`;
    }
    
    // 构建消息
    const llmMessages = [
      { role: 'system' as const, content: '你是一个专业的学习顾问，擅长分析对话内容并提供有针对性的学习建议。请只返回JSON数组，不要添加任何其他内容。' },
      { role: 'user' as const, content: fullPrompt },
    ];
    
    // 创建流式响应
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const llmStream = await openai.chat.completions.create({
            model: process.env.ARK_MODEL || 'doubao-seed-2-0-pro-260215',
            messages: llmMessages as any,
            stream: true,
            temperature: 0.7,
          });
          
          let fullContent = '';
          
          for await (const chunk of llmStream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullContent += content;
              const event = `data: ${JSON.stringify({ type: 'content', content })}\n\n`;
              controller.enqueue(encoder.encode(event));
            }
          }
          
          // 发送完成信号
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', raw: fullContent })}\n\n`));
          controller.close();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '未知错误';
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', message: errorMessage })}\n\n`)
          );
          controller.close();
        }
      },
    });
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
    
  } catch (error) {
    console.error('Suggestions API error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: '建议生成失败，请稍后重试',
        details: error instanceof Error ? error.message : '未知错误'
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}
