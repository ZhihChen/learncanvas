'use client';

/**
 * 计划识别组件
 * 检测对话中的学习计划，并提供一键创建节点的功能
 */

import { useState, useCallback, useEffect } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  ChevronDown, 
  ChevronUp,
  Layers,
  Clock,
  ArrowRight,
  X,
  Target,
  Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Message } from '@/types';

// 计划步骤接口 - 扩展版本
interface PlanStep {
  id: string;
  title: string;
  description: string;
  estimatedTime?: string;
  keywords?: string[];
  goals?: string[];
}

// 计划接口 - 扩展版本
interface Plan {
  title: string;
  description: string;
  steps: PlanStep[];
  overallGoal?: string;
  prerequisites?: string[];
}

interface PlanDetectorProps {
  nodeId: string;
  messages: Message[];
  onCreateNodes: (plan: Plan) => void;
}

export function PlanDetector({ nodeId, messages, onCreateNodes }: PlanDetectorProps) {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedPlan, setDetectedPlan] = useState<Plan | null>(null);
  const [isExpanded, setIsExpanded] = useState(false); // 默认收起，不打扰用户对话
  const [isCreating, setIsCreating] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  
  // 最后一条消息是否包含助手回复
  const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
  
  // 检测计划
  const detectPlan = useCallback(async () => {
    if (!lastAssistantMessage || isDetecting || detectedPlan) return;
    
    // 只有当消息内容足够长时才检测
    if (lastAssistantMessage.content.length < 100) return;
    
    setIsDetecting(true);
    
    try {
      const response = await fetch('/api/plan/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });
      
      const data = await response.json();
      
      // 双重保险：前端也检查步骤数量 >= 2
      if (data.hasPlan && data.plan && data.plan.steps && data.plan.steps.length >= 2) {
        setDetectedPlan(data.plan);
      }
    } catch (error) {
      console.error('Failed to detect plan:', error);
    } finally {
      setIsDetecting(false);
    }
  }, [messages, lastAssistantMessage, isDetecting, detectedPlan]);
  
  // 当消息变化时检测计划
  useEffect(() => {
    // 延迟检测，避免频繁调用
    const timer = setTimeout(() => {
      if (lastAssistantMessage && lastAssistantMessage.status === 'complete') {
        detectPlan();
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [lastAssistantMessage, detectPlan]);
  
  // 创建节点
  const handleCreateNodes = useCallback(async () => {
    if (!detectedPlan || isCreating) return;
    
    setIsCreating(true);
    
    try {
      onCreateNodes(detectedPlan);
      setDismissed(true); // 创建后隐藏
    } catch (error) {
      console.error('Failed to create nodes:', error);
    } finally {
      setIsCreating(false);
    }
  }, [detectedPlan, isCreating, onCreateNodes]);
  
  // 如果已关闭或没有检测到计划，不显示
  if (dismissed || !detectedPlan) {
    return null;
  }
  
  return (
    <div className="mt-4 border border-indigo-500/20 rounded-xl bg-indigo-500/5 overflow-hidden">
      {/* 头部 - 可点击切换展开/收起 */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between px-4 py-3 bg-indigo-500/10 cursor-pointer hover:bg-indigo-500/15 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/20">
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-indigo-900">
              识别到学习计划
            </div>
            <div className="text-xs text-indigo-700">
              {detectedPlan.steps.length} 个步骤 · {detectedPlan.title}
              {!isExpanded && ' · 点击展开查看'}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="p-1.5 text-indigo-600">
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation(); // 阻止冒泡，避免同时触发展开/收起
              setDismissed(true);
            }}
            className="p-1.5 rounded-lg hover:bg-white/30 text-indigo-600 hover:text-indigo-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* 展开内容 */}
      {isExpanded && (
        <div className="px-4 py-3">
          {/* 整体目标 */}
          {detectedPlan.overallGoal && (
            <div className="flex items-start gap-2 mb-3 p-2 rounded-lg bg-indigo-500/10">
              <Target className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-medium text-indigo-700 mb-0.5">学习目标</div>
                <div className="text-sm text-indigo-900">{detectedPlan.overallGoal}</div>
              </div>
            </div>
          )}
          
          {/* 计划描述 */}
          <p className="text-sm text-indigo-900 mb-4">
            {detectedPlan.description}
          </p>
          
          {/* 前置知识 */}
          {detectedPlan.prerequisites && detectedPlan.prerequisites.length > 0 && (
            <div className="mb-4 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="text-xs font-medium text-amber-700 mb-1">📌 建议前置知识</div>
              <div className="flex flex-wrap gap-1">
                {detectedPlan.prerequisites.map((pre, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-800">
                    {pre}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* 步骤列表 */}
          <div className="space-y-3 mb-4">
            {detectedPlan.steps.map((step, index) => (
              <div
                key={step.id}
                className="p-3 rounded-lg bg-white/40 border border-indigo-500/10"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/30 text-indigo-700 text-xs flex items-center justify-center font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-indigo-900 mb-1">
                      {step.title}
                    </div>
                    <div className="text-xs text-indigo-700 leading-relaxed">
                      {step.description}
                    </div>
                    
                    {/* 关键词标签 */}
                    {step.keywords && step.keywords.length > 0 && (
                      <div className="flex items-center gap-1 mt-2 flex-wrap">
                        <Tag className="w-3 h-3 text-indigo-500" />
                        {step.keywords.map((keyword, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-600">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* 学习目标 */}
                    {step.goals && step.goals.length > 0 && (
                      <div className="mt-2 space-y-0.5">
                        {step.goals.map((goal, i) => (
                          <div key={i} className="flex items-center gap-1 text-xs text-indigo-600">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{goal}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {step.estimatedTime && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-indigo-600">
                        <Clock className="w-3 h-3" />
                        <span>预计 {step.estimatedTime}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* 操作按钮 */}
          <button
            onClick={handleCreateNodes}
            disabled={isCreating}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all",
              isCreating
                ? "bg-indigo-200 text-indigo-400 cursor-not-allowed"
                : "bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
            )}
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>正在创建节点...</span>
              </>
            ) : (
              <>
                <Layers className="w-4 h-4" />
                <span>按计划创建学习节点</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
          
          <p className="text-xs text-indigo-600 mt-2 text-center">
            将为每个步骤创建独立的对话节点，并自动建立上下文连接
          </p>
        </div>
      )}
    </div>
  );
}
