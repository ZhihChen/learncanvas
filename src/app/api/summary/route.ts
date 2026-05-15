/**
 * 智能摘要生成 API
 * 分析对话内容，生成结构化摘要
 * 使用火山引擎 ARK API（OpenAI 兼容）
 */

import { NextRequest } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: process.env.ARK_BASE_URL || 'https://ark.cn-beijing.volces.com/api/coding/v3',
  apiKey: process.env.ARK_API_KEY || '',
});

// 摘要生成提示词
const SUMMARY_PROMPT = `你是一个专业的对话摘要助手。请分析以下对话内容，生成一个简洁但信息丰富的摘要。

摘要要求：
1. 提取核心主题和关键信息
2. 列出讨论的主要观点（2-4个要点）
3. 识别任何结论或决定
4. 如果有代码或技术内容，简要说明技术方案

输出格式：
【主题】一句话概括对话主题
【要点】
- 要点1
- 要点2
- 要点3
【结论】对话的结论或下一步行动（如有）

对话内容：
`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, nodeId } = body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: '缺少消息内容' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 格式化对话内容
    const conversationText = messages.map((msg: { role: string; content: string }) => {
      const role = msg.role === 'user' ? '用户' : 'AI助手';
      return `${role}: ${msg.content}`;
    }).join('\n\n');
    
    // 构建消息
    const llmMessages = [
      { role: 'system' as const, content: '你是一个专业的对话摘要助手，擅长提取和总结关键信息。' },
      { role: 'user' as const, content: SUMMARY_PROMPT + conversationText },
    ];
    
    // 创建流式响应
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const llmStream = await openai.chat.completions.create({
            model: process.env.ARK_MODEL || 'doubao-seed-2-0-pro-260215',
            messages: llmMessages,
            stream: true,
            temperature: 0.3,
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
          
          // 发送完成信号，包含完整摘要
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', summary: fullContent })}\n\n`));
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
    console.error('Summary API error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: '摘要生成失败，请稍后重试',
        details: error instanceof Error ? error.message : '未知错误'
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}
