/**
 * 流式聊天 API - SSE 协议
 * 支持文本和多模态输入（图片）
 * 使用火山引擎 ARK API（OpenAI 兼容）
 */

import { NextRequest } from 'next/server';
import OpenAI from 'openai';

// 初始化 OpenAI 客户端（使用火山引擎 ARK API）
const openai = new OpenAI({
  baseURL: process.env.ARK_BASE_URL || 'https://ark.cn-beijing.volces.com/api/coding/v3',
  apiKey: process.env.ARK_API_KEY || '',
});

// 高质量系统提示词 - 追求专业、详细、有深度的回答
const DEFAULT_SYSTEM_PROMPT = `你是一位专业、博学、耐心的AI助手，致力于为用户提供最优质、最有价值的回答。

## 回答原则

1. **内容完整**：提供详尽、全面的回答，不要刻意省略重要信息。宁可详细也不要过于简略。

2. **结构清晰**：使用标题、列表、代码块等组织内容，让回答易于阅读和理解。

3. **深入分析**：
   - 不仅回答"是什么"，更要解释"为什么"和"怎么做"
   - 提供背景知识、原理解释、实际应用场景
   - 对于复杂概念，拆解成易于理解的部分

4. **代码示例**：
   - 提供完整、可运行的代码示例
   - 添加详细的注释说明
   - 包含边界情况处理和最佳实践

5. **实用建议**：
   - 结合实际经验给出建议
   - 指出常见错误和避坑指南
   - 提供进阶学习方向

6. **语言风格**：
   - 使用中文回答
   - 专业但易懂，避免不必要的术语堆砌
   - 必要时使用类比和例子帮助理解

## 特殊场景

- 如果用户上传了图片，请仔细、详细地分析图片内容
- 如果问题涉及代码，提供完整的代码示例和详细解释
- 如果问题需要步骤指导，提供清晰的分步说明`;

// 判断是否需要启用深度思考模式（复杂推理问题）
function shouldEnableThinking(messages: any[]): boolean {
  const lastUserMessage = [...messages].reverse().find((msg: any) => msg.role === 'user');
  if (!lastUserMessage) return false;
  
  const content = typeof lastUserMessage.content === 'string' 
    ? lastUserMessage.content 
    : lastUserMessage.content.find((p: any) => p.type === 'text')?.text || '';
  
  const thinkingKeywords = [
    '分析', '比较', '对比', '评估', '论证', '证明',
    '为什么', '原因', '原理', '逻辑', '推导', '推理',
    '设计', '架构', '优化', '重构', '实现方案',
    '算法', '复杂度', '证明', '计算', '求解',
    '深入', '详细解释', '底层原理', '本质',
  ];
  
  return thinkingKeywords.some(keyword => content.includes(keyword));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, contextMessages = [], systemPrompt } = body;
    
    const effectiveSystemPrompt = systemPrompt || DEFAULT_SYSTEM_PROMPT;
    
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: '缺少消息内容' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 辅助函数：转换消息格式
    const transformMessage = (msg: any) => {
      if (Array.isArray(msg.content)) {
        return {
          role: msg.role,
          content: msg.content,
        };
      }
      return {
        role: msg.role,
        content: msg.content || '',
      };
    };
    
    // 过滤掉前端传来的 system 消息
    const filterNonSystem = (msgs: any[]) => msgs.filter(msg => msg.role !== 'system');
    
    // 构建消息列表
    const allMessages: any[] = [
      { role: 'system', content: effectiveSystemPrompt },
      ...contextMessages.map(transformMessage),
      ...filterNonSystem(messages).map(transformMessage),
    ];
    
    // 检查是否包含图片
    const hasImage = messages.some((msg: any) =>
      Array.isArray(msg.content) && msg.content.some((part: any) => part.type === 'image_url')
    );
    
    // 模型选择策略
    const model = hasImage 
      ? process.env.ARK_VISION_MODEL || 'doubao-seed-1-6-vision-250815' 
      : process.env.ARK_MODEL || 'doubao-seed-2-0-pro-260215';
    
    // 判断是否需要深度思考模式
    const needsThinking = shouldEnableThinking(messages);
    
    // 创建流式响应
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const stream = await openai.chat.completions.create({
            model,
            messages: allMessages,
            stream: true,
            temperature: 0.7,
            ...(needsThinking && { extra_body: { thinking: { type: 'enabled' } } }),
          });
          
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              const event = `data: ${JSON.stringify({ type: 'content', content })}\n\n`;
              controller.enqueue(encoder.encode(event));
            }
          }
          
          controller.enqueue(encoder.encode('data: {"type":"done"}\n\n'));
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
    console.error('Chat API error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: '服务暂时不可用，请稍后重试',
        details: error instanceof Error ? error.message : '未知错误'
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}
