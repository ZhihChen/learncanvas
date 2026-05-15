/**
 * 联网搜索 API
 * 基于 AI 的联网搜索功能
 * 注意：需要配置支持联网搜索的 AI API 或使用第三方搜索服务
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: process.env.ARK_BASE_URL || 'https://ark.cn-beijing.volces.com/api/coding/v3',
  apiKey: process.env.ARK_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, count = 5, needSummary = true } = body;
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: '缺少搜索查询' },
        { status: 400 }
      );
    }
    
    // 使用 AI 模型进行搜索（如果有联网能力）
    // 注意：部分模型支持联网搜索，通过特定参数启用
    try {
      const response = await openai.chat.completions.create({
        model: process.env.ARK_MODEL || 'doubao-seed-2-0-pro-260215',
        messages: [
          {
            role: 'system',
            content: `你是一个专业的网络搜索助手。请根据用户查询搜索相关信息。

请以 JSON 格式返回搜索结果：
{
  "summary": "搜索主题的简要概述",
  "items": [
    {
      "title": "网页标题",
      "url": "网页URL",
      "snippet": "网页摘要内容"
    }
  ]
}

请只返回 JSON，不要添加任何其他内容。`
          },
          {
            role: 'user',
            content: `请搜索以下内容：${query}`
          }
        ],
        temperature: 0.3,
      });
      
      const content = response.choices[0]?.message?.content || '';
      
      // 解析 JSON 响应
      let results;
      try {
        // 尝试提取 JSON
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          results = JSON.parse(jsonMatch[0]);
        } else {
          results = {
            summary: null,
            items: [],
            raw: content
          };
        }
      } catch {
        results = {
          summary: null,
          items: [],
          raw: content
        };
      }
      
      // 确保返回格式正确
      return NextResponse.json({
        summary: results.summary || null,
        items: (results.items || []).slice(0, count).map((item: any, index: number) => ({
          id: `search_${Date.now()}_${index}`,
          title: item.title || '无标题',
          url: item.url || '',
          snippet: item.snippet || '',
        })),
      });
      
    } catch (aiError) {
      console.error('AI search error:', aiError);
      
      // 如果 AI 搜索失败，返回提示
      return NextResponse.json({
        summary: null,
        items: [],
        error: '当前搜索服务不可用，请稍后重试或配置支持联网的 AI API'
      });
    }
    
  } catch (error) {
    console.error('Search API error:', error);
    
    return NextResponse.json(
      { 
        error: '搜索服务暂时不可用',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

// GET 方法用于简单查询
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const count = parseInt(searchParams.get('count') || '5');
  
  if (!query) {
    return NextResponse.json(
      { error: '缺少搜索参数 q' },
      { status: 400 }
    );
  }
  
  // 使用 POST 方法的逻辑
  return POST(request as unknown as NextRequest);
}
