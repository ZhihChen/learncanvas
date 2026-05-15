'use client';

/**
 * 上下文连线组件
 * 支持层级连线（实线）和引用连线（虚线）
 * 支持悬停预览、点击配置
 */

import { memo, useState, useCallback, useEffect } from 'react';
import { BaseEdge, EdgeProps, getSmoothStepPath, EdgeLabelRenderer } from '@xyflow/react';
import { cn } from '@/lib/utils';
import type { EdgeRelationType, ContextTransferStrategy, ContextPreview as ContextPreviewType } from '@/types';

// 根据连线类型获取样式 - 缤纷晨光主题
// 使用CSS变量保持与主题的一致性
const getEdgeStyle = (relationType: EdgeRelationType = 'hierarchy', selected: boolean, hovered: boolean) => {
  // 从CSS变量获取颜色
  const edgeColor = 'var(--edge-color)';           // 默认浅蓝灰
  const edgeHover = 'var(--edge-hover)';           // 柔和紫蓝
  const edgeSelected = 'var(--edge-selected)';     // 柔和紫蓝
  
  // 多彩辅助色（用于不同连线类型的区分）
  const lavenderGlow = 'rgba(167, 139, 250, 0.3)'; // 薰衣草光晕
  const skyBlueGlow = 'rgba(96, 165, 250, 0.25)';  // 天蓝光晕
  
  const baseStyles = {
    hierarchy: {
      // 层级连线：使用主强调色（紫蓝）
      stroke: selected ? edgeSelected : hovered ? edgeHover : edgeColor,
      strokeWidth: selected ? 2.5 : hovered ? 2 : 1.5,
      animated: true,
      dasharray: '',
      // 选中时使用薰衣草光晕，更柔和优雅
      glowColor: selected ? lavenderGlow : hovered ? 'rgba(99, 102, 241, 0.2)' : 'rgba(184, 192, 204, 0.1)',
    },
    reference: {
      // 引用连线：使用天蓝色区分
      stroke: selected ? edgeSelected : hovered ? edgeHover : edgeColor,
      strokeWidth: selected ? 2.5 : hovered ? 2 : 1.5,
      animated: false,
      dasharray: '6,4', /* 虚线 */
      // 选中时使用天蓝光晕
      glowColor: selected ? skyBlueGlow : hovered ? 'rgba(96, 165, 250, 0.2)' : 'rgba(184, 192, 204, 0.1)',
    },
  };
  return baseStyles[relationType];
};

type ContextEdgeProps = EdgeProps & {
  data?: {
    relationType?: EdgeRelationType;
    contextConfig?: {
      strategy: ContextTransferStrategy;
      recentCount?: number;
      enabled: boolean;
    };
  };
};

// 预览面板组件
function PreviewPanel({ 
  preview, 
  position, 
  visible 
}: { 
  preview: ContextPreviewType | null; 
  position: { x: number; y: number }; 
  visible: boolean;
}) {
  if (!visible || !preview) return null;
  
  return (
    <div
      className={cn(
        'fixed z-[9999] pointer-events-none',
        'w-72 p-3 border',
        'shadow-lg',
        'transform -translate-x-1/2 -translate-y-full -mt-4',
        'animate-in fade-in-0 zoom-in-95 duration-150',
      )}
      style={{
        left: position.x,
        top: position.y,
        background: 'var(--node-bg)',
        borderColor: 'var(--border-primary)',
        borderRadius: 'var(--radius-lg)'
      }}
    >
      {/* 内容 */}
      <div>
        {/* 头部 */}
        <div
          className="flex items-center gap-2 mb-2 pb-2"
          style={{ borderBottom: '1px solid var(--border-primary)' }}
        >
          <div
            className="p-1 flex-shrink-0"
            style={{
              background: 'var(--accent-light)',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <svg
              className="w-3.5 h-3.5"
              style={{ color: 'var(--accent-primary)' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div
              className="text-[10px] uppercase tracking-wider"
              style={{ color: 'var(--text-tertiary)' }}
            >
              上下文来源
            </div>
            <div
              className="text-sm font-medium truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {preview.sourceNodeTitle}
            </div>
          </div>
        </div>

        {/* 传递信息 */}
        <div className="flex items-center gap-2 mb-2">
          <span
            className={cn(
              'px-2 py-0.5 rounded text-xs font-medium'
            )}
            style={{
              background: preview.strategy === 'summary' ? 'var(--bg-secondary)' :
                         preview.strategy === 'recent' ? 'var(--accent-light)' :
                         'var(--bg-secondary)',
              color: preview.strategy === 'summary' ? 'var(--text-primary)' :
                     preview.strategy === 'recent' ? 'var(--accent-primary)' :
                     'var(--text-secondary)'
            }}
          >
            {preview.strategy === 'all' ? '全部传递' :
             preview.strategy === 'summary' ? '智能摘要' :
             preview.strategy === 'recent' ? '最近消息' : '自定义'}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {preview.messageCount} 条消息
          </span>
        </div>

        {/* 预览内容 */}
        <div
          className="p-2 border"
          style={{
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <p
            className="text-xs leading-relaxed line-clamp-3"
            style={{ color: 'var(--text-secondary)' }}
          >
            {preview.previewContent || '暂无对话内容'}
          </p>
        </div>

        {/* 点击提示 */}
        <div className="mt-2 text-center">
          <span
            className="text-[10px]"
            style={{ color: 'var(--text-tertiary)' }}
          >
            点击连线可配置传递策略
          </span>
        </div>
      </div>
    </div>
  );
}

function ContextEdgeComponent({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected = false,
  data,
}: ContextEdgeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const [preview, setPreview] = useState<ContextPreviewType | null>(null);
  
  // 获取连线类型和上下文配置
  const relationType: EdgeRelationType = data?.relationType || 'hierarchy';
  const contextConfig = data?.contextConfig;
  const edgeStyle = getEdgeStyle(relationType, selected, isHovered);
  
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 16,
  });
  
  // 计算中点位置
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;
  
  // 悬停时获取上下文预览
  useEffect(() => {
    if (isHovered && source) {
      const event = new CustomEvent('requestContextPreview', {
        detail: {
          sourceNodeId: source,
          strategy: contextConfig?.strategy || 'all',
          recentCount: contextConfig?.recentCount || 3,
        }
      });
      window.dispatchEvent(event);
      
      const handleResponse = (e: CustomEvent<ContextPreviewType>) => {
        if (e.detail.sourceNodeId === source) {
          setPreview(e.detail);
        }
      };
      window.addEventListener('contextPreviewData', handleResponse as EventListener);
      
      return () => {
        window.removeEventListener('contextPreviewData', handleResponse as EventListener);
      };
    }
  }, [isHovered, source, contextConfig]);
  
  // 悬停事件处理
  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    setIsHovered(true);
    const rect = (e.target as SVGElement).closest('.react-flow')?.getBoundingClientRect();
    if (rect) {
      setPreviewPosition({
        x: rect.left + midX,
        y: rect.top + midY,
      });
    }
  }, [midX, midY]);
  
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setPreview(null);
  }, []);
  
  // 点击打开配置面板
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    // 计算连线中点的画布坐标（直接使用 midX, midY，它们已经是画布坐标）
    const flowX = midX;
    const flowY = midY;
    
    // 触发配置面板打开事件
    window.dispatchEvent(new CustomEvent('openEdgeConfig', {
      detail: {
        edgeId: id,
        sourceNodeId: source,
        targetNodeId: target,
        position: { x: flowX, y: flowY }, // 传递画布坐标
        currentConfig: contextConfig,
      }
    }));
  }, [id, source, target, midX, midY, contextConfig]);
  
  return (
    <>
      {/* 发光效果层 */}
      <path
        d={edgePath}
        stroke={edgeStyle.glowColor}
        strokeWidth={isHovered ? 12 : 8}
        fill="none"
        strokeLinecap="round"
        className="transition-all duration-300"
      />
      
      {/* 主路径 */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          strokeWidth: edgeStyle.strokeWidth,
          stroke: edgeStyle.stroke,
          strokeDasharray: edgeStyle.dasharray || undefined,
        }}
        markerEnd={markerEnd}
      />
      
      {/* 流动动画 - 天蓝色粒子 */}
      {relationType === 'hierarchy' && (
        <circle r={isHovered ? 5 : 4} fill="#60A5FA" style={{ pointerEvents: 'none' }}>
          <animateMotion
            dur={isHovered ? '1s' : '2s'}
            repeatCount="indefinite"
            path={edgePath}
          />
        </circle>
      )}

      {/* 引用连线脉冲 - 淡蓝色粒子 */}
      {relationType === 'reference' && (
        <circle r={3} fill="#93C5FD" opacity={0.7} style={{ pointerEvents: 'none' }}>
          <animateMotion
            dur="3s"
            repeatCount="indefinite"
            path={edgePath}
          />
          <animate
            attributeName="opacity"
            values="0.4;0.9;0.4"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      )}

      {/* 悬停高亮动画 - 薰衣草色粒子 */}
      {isHovered && (
        <circle r={6} fill="#A78BFA" opacity={0.9} style={{ pointerEvents: 'none' }}>
          <animateMotion
            dur="0.8s"
            repeatCount="indefinite"
            path={edgePath}
          />
          <animate
            attributeName="opacity"
            values="0.5;1;0.5"
            dur="0.4s"
            repeatCount="indefinite"
          />
        </circle>
      )}
      
      {/* 交互层 - 放在最顶层，确保能捕获点击事件 */}
      <path
        d={edgePath}
        stroke="transparent"
        strokeWidth={24}
        fill="none"
        strokeLinecap="round"
        className="cursor-pointer"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      />
      
      {/* 禁用状态指示 */}
      {contextConfig && !contextConfig.enabled && (
        <EdgeLabelRenderer>
          <div
            className={cn(
              'absolute px-1.5 py-0.5 rounded text-[10px] font-medium',
              'bg-[#FEF2F2] text-[#E03E3E] border border-[#E03E3E]/30',
              'transform -translate-x-1/2 -translate-y-1/2',
            )}
            style={{
              position: 'absolute',
              left: labelX,
              top: labelY - 20,
            }}
          >
            已禁用
          </div>
        </EdgeLabelRenderer>
      )}
      
      {/* 标签 */}
      <EdgeLabelRenderer>
        <div
          className={cn(
            'absolute px-2 py-0.5 rounded text-[10px] font-medium',
            'bg-white border transition-all duration-200',
            'transform -translate-x-1/2 -translate-y-1/2 whitespace-nowrap cursor-pointer',
            isHovered ? 'scale-110 shadow-sm' : '',
            relationType === 'hierarchy'
              ? cn(
                  'border-[#D3D1CB]',
                  isHovered ? 'text-[#2383E2] border-[#2383E2]' : 'text-[#787774]'
                )
              : cn(
                  'border-[#E9E9E7]',
                  isHovered ? 'text-[#2383E2] border-[#2383E2]' : 'text-[#9B9A97]'
                )
          )}
          style={{
            position: 'absolute',
            left: labelX,
            top: labelY,
          }}
          onClick={handleClick}
        >
          {relationType === 'hierarchy' ? '层级传递' : '引用关联'}
        </div>
      </EdgeLabelRenderer>
      
      {/* 预览面板 */}
      <PreviewPanel 
        preview={preview} 
        position={previewPosition} 
        visible={isHovered && !!preview} 
      />
    </>
  );
}

export const ContextEdge = memo(ContextEdgeComponent);
