'use client';

/**
 * 模板选择器组件
 * 帮助用户快速选择预置模板开始
 */

import { memo, useState } from 'react';
import { 
  BookOpen, 
  Rocket, 
  Lightbulb, 
  FlaskConical,
  ArrowRight,
  Check,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { templates, getCategoryStyle, type CanvasTemplate } from '@/lib/templates';

interface TemplateSelectorProps {
  onSelect: (template: CanvasTemplate) => void;
  onClose?: () => void;
}

// 分类图标映射
const categoryIcons = {
  learning: BookOpen,
  project: Rocket,
  brainstorm: Lightbulb,
  research: FlaskConical,
};

function TemplateSelectorComponent({ onSelect }: TemplateSelectorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  
  const selectedTemplate = templates.find(t => t.id === selectedId);
  
  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* 标题 */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-[#37352F] mb-2">选择一个模板开始</h2>
        <p className="text-sm text-[#787774]">预置模板帮助你快速构建知识结构</p>
      </div>
      
      {/* 模板网格 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {templates.map((template) => {
          const categoryStyle = getCategoryStyle(template.category);
          const CategoryIcon = categoryIcons[template.category];
          const isSelected = selectedId === template.id;
          const isHovered = hoveredId === template.id;
          
          return (
            <button
              key={template.id}
              onClick={() => setSelectedId(template.id)}
              onMouseEnter={() => setHoveredId(template.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={cn(
                'relative p-5 rounded-lg text-left transition-all duration-300',
                'border overflow-hidden group',
                isSelected
                  ? 'border-indigo-500/50 bg-bg-[#F7F6F3]'
                  : isHovered
                    ? 'border-bg-[#F7F6F3] bg-indigo-500/5'
                    : 'border-slate-700/50 bg-[#E9E9E7]/30 hover:border-slate-600'
              )}
            >
              {/* 背景效果 */}
              <div className={cn(
                'absolute inset-0 transition-opacity duration-300',
                isSelected || isHovered ? 'opacity-100' : 'opacity-0',
                'bg-[#F7F6F3] via-purple-500/5 to-transparent'
              )} />
              
              {/* 选中指示 */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
                  <Check className="w-4 h-4 text-[#37352F]" />
                </div>
              )}
              
              {/* 内容 */}
              <div className="relative">
                {/* 图标和标题 */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn('p-2 rounded-lg text-2xl', categoryStyle.bg)}>
                    {template.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[#37352F]">{template.name}</h3>
                    <span className={cn('text-xs', categoryStyle.color)}>
                      {categoryStyle.label}
                    </span>
                  </div>
                </div>
                
                {/* 描述 */}
                <p className="text-sm text-[#787774] mb-4 line-clamp-2">
                  {template.description}
                </p>
                
                {/* 预览 */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-[#E9E9E7] overflow-hidden">
                    <div 
                      className={cn('h-full rounded-full transition-all duration-500', categoryStyle.bg.replace('/10', '/50'))}
                      style={{ width: `${(template.nodes.length / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-[#9B9A97]">
                    {template.nodes.length} 节点
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      
      {/* 选中模板详情 */}
      {selectedTemplate && (
        <div className={cn(
          'p-4 rounded-lg border border-bg-[#F7F6F3] bg-indigo-500/5 mb-6',
          'animate-in fade-in-0 slide-in-from-bottom-2 duration-200'
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{selectedTemplate.icon}</span>
              <div>
                <h4 className="text-sm font-medium text-[#37352F]">{selectedTemplate.name}</h4>
                <p className="text-xs text-[#787774]">
                  {selectedTemplate.nodes.length} 个节点 · {selectedTemplate.edges.length} 条连线
                </p>
              </div>
            </div>
            <button
              onClick={() => onSelect(selectedTemplate)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg',
                'bg-indigo-500 hover:bg-indigo-600 text-[#37352F]',
                'transition-colors duration-200'
              )}
            >
              <span className="text-sm font-medium">使用此模板</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      {/* 快速开始按钮 */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => onSelect({
            id: 'blank',
            name: '空白画布',
            description: '从零开始创建',
            icon: '✨',
            category: 'brainstorm',
            nodes: [],
            edges: [],
          })}
          className="flex items-center gap-2 px-4 py-2 text-sm text-[#787774] hover:text-[#37352F] transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          从空白画布开始
        </button>
      </div>
    </div>
  );
}

export const TemplateSelector = memo(TemplateSelectorComponent);
