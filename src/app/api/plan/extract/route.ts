/**
 * 计划识别 API
 * 从对话历史中提取结构化的学习计划或任务列表
 * 使用火山引擎 ARK API（OpenAI 兼容）
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: process.env.ARK_BASE_URL || 'https://ark.cn-beijing.volces.com/api/coding/v3',
  apiKey: process.env.ARK_API_KEY || '',
});

// 消息类型
type MessageRole = 'system' | 'user' | 'assistant';

interface Message {
  role: MessageRole;
  content: string;
}

// 计划步骤接口
interface PlanStep {
  id: string;
  title: string;
  description: string;
  estimatedTime?: string;
  keywords?: string[];
  goals?: string[];
}

// 计划接口
interface Plan {
  title: string;
  description: string;
  steps: PlanStep[];
  overallGoal?: string;
  prerequisites?: string[];
}

// API 响应接口
interface ExtractResponse {
  hasPlan: boolean;
  plan: Plan | null;
}

// 生成唯一ID
const generateStepId = () => `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// 计划识别 Prompt
const PLAN_EXTRACTION_PROMPT = `你是一个专业的学习计划分析助手。你的任务是从对话中识别并提取结构化的学习计划。

## 核心要求

1. **识别标准**：只有当计划包含 **至少2个步骤** 时才返回 hasPlan: true
2. **提取原则**：尽可能详细地提取每个步骤的信息，不要简化或遗漏

## 识别规则

### 必须满足：
- 明确的多步骤计划（2-8个步骤）
- 步骤之间有逻辑顺序或依赖关系
- 每个步骤是独立可执行的任务
- 计划是为了实现某个明确的学习目标

### 常见计划形式：
- 编号列表：1. 2. 3. 或 一、二、三
- 步骤标记：第一步、第二步、接下来、然后
- 时间安排：第一周、第二周、今天、明天
- 阶段划分：入门阶段、进阶阶段、实战阶段
- 标题+内容：每个部分有明确的主题和详细说明

## 输出格式

请严格按照以下 JSON 格式返回（不要添加任何其他文本）：

### 识别到有效计划时：

\`\`\`json
{
  "hasPlan": true,
  "plan": {
    "title": "计划的精简标题（10字以内）",
    "description": "计划的整体描述（一句话说明这个计划要达成什么目标）",
    "overallGoal": "完成这个计划后能获得什么能力或成果",
    "prerequisites": ["前置知识或技能1", "前置知识或技能2"],
    "steps": [
      {
        "title": "步骤标题（简洁有力，5-10字）",
        "description": "详细说明这一步要做什么，包括具体的学习内容、方法、注意事项等。尽可能保留原文的详细信息。",
        "estimatedTime": "预估时间（如'2小时'、'1天'、'1周'）",
        "keywords": ["关键词1", "关键词2", "关键词3"],
        "goals": ["这个步骤要达成的具体目标"]
      }
    ]
  }
}
\`\`\`

### 没有识别到计划时：

\`\`\`json
{
  "hasPlan": false,
  "plan": null
}
\`\`\`

## 重要提示

1. **description 字段**要尽可能详细，保留原文的关键信息
2. **keywords** 提取3-5个核心概念或技能点
3. **goals** 说明完成这一步能达到什么效果
4. 如果原文没有明确的时间预估，estimatedTime 可以省略
5. 不要过度简化内容，保持信息的完整性`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({
        hasPlan: false,
        plan: null,
      });
    }

    // 构建消息 - 只发送最近几条消息避免内容过长
    const recentMessages = messages.slice(-6);
    const messagesText = recentMessages.map((m: Message) => 
      `${m.role === 'user' ? '用户' : 'AI'}: ${m.content}`
    ).join('\n\n---\n\n');

    const allMessages: Message[] = [
      { role: 'system', content: PLAN_EXTRACTION_PROMPT },
      { 
        role: 'user', 
        content: `请分析以下对话内容，识别是否包含学习计划或任务列表：\n\n${messagesText}` 
      },
    ];

    // 调用 LLM - 使用旗舰模型提升质量
    const response = await openai.chat.completions.create({
      model: process.env.ARK_MODEL || 'doubao-seed-2-0-pro-260215',
      messages: allMessages as any,
      temperature: 0.3,
    });
    
    const fullContent = response.choices[0]?.message?.content || '';
    
    // 解析响应
    let result: ExtractResponse;
    
    try {
      // 清理可能的 markdown 代码块标记
      let content = fullContent.trim();
      if (content.startsWith('```json')) {
        content = content.slice(7);
      }
      if (content.startsWith('```')) {
        content = content.slice(3);
      }
      if (content.endsWith('```')) {
        content = content.slice(0, -3);
      }
      
      const parsed = JSON.parse(content.trim());
      
      // 验证格式和步骤数量
      if (parsed.hasPlan && parsed.plan && Array.isArray(parsed.plan.steps)) {
        // 关键检查：步骤数量必须 >= 2
        if (parsed.plan.steps.length < 2) {
          result = { hasPlan: false, plan: null };
        } else {
          // 为每个步骤添加 ID，并确保字段完整
          parsed.plan.steps = parsed.plan.steps.map((step: any, index: number) => ({
            id: generateStepId(),
            title: step.title || `第${index + 1}步`,
            description: step.description || '',
            estimatedTime: step.estimatedTime || undefined,
            keywords: step.keywords || [],
            goals: step.goals || [],
          }));
          
          result = parsed;
        }
      } else {
        result = { hasPlan: false, plan: null };
      }
    } catch (parseError) {
      console.error('Failed to parse plan response:', parseError);
      result = { hasPlan: false, plan: null };
    }

    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Plan extraction error:', error);
    
    return NextResponse.json(
      { 
        hasPlan: false, 
        plan: null,
        error: '计划识别失败，请稍后重试'
      },
      { status: 500 }
    );
  }
}
