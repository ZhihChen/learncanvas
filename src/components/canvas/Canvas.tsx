'use client';

/**
 * 画布主体组件
 * 支持连线类型区分、框选多选、搜索高亮、上下文配置
 */

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  ConnectionMode,
  Panel,
  useReactFlow,
  ReactFlowProvider,
  SelectionMode,
} from '@xyflow/react';
import type { OnConnect } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useCanvasStore } from '@/store/canvasStore';
import { ChatNode } from '@/components/node/ChatNode';
import { GroupNode } from '@/components/node/GroupNode';
import { NoteNode } from '@/components/node/NoteNode';
import { ContextEdge } from '@/components/edge/ContextEdge';
import { EdgeConfigPanel } from '@/components/edge/EdgeConfigPanel';
import { TemplateSelector } from '@/components/templates/TemplateSelector';
import { LeftToolbar } from './LeftToolbar';
import { OutlinePanel } from '@/components/outline/OutlinePanel';
import GlobalSearch from '@/components/search/GlobalSearch';
import { BackToHome } from './BackToHome';
import { ExpandedChat } from './ExpandedChat';
import { ExpandedNote } from './ExpandedNote';
import { BatchToolbar } from './BatchToolbar';
import type { EdgeRelationType, ContextTransferStrategy, ContextPreview, ContextTransferConfig, ChatNode as ChatNodeType, ChatEdge as ChatEdgeType } from '@/types';
import type { CanvasTemplate } from '@/lib/templates';

// 节点和连线类型注册
const nodeTypes = {
  chatNode: ChatNode,
  groupNode: GroupNode,
  noteNode: NoteNode,
};

const edgeTypes = {
  context: ContextEdge,
};

// 连线配置面板状态
interface EdgeConfigState {
  isOpen: boolean;
  edgeId: string;
  sourceNodeId: string;
  targetNodeId: string;
  position: { x: number; y: number };
  currentConfig?: ContextTransferConfig;
}

// 连接结束时的节点创建菜单状态
interface ConnectEndMenuState {
  isOpen: boolean;
  position: { x: number; y: number };
  screenPosition: { x: number; y: number };
  sourceNodeId: string;
  sourceHandle: string | null;
}

interface CanvasProps {
  canvasId?: string;
}

function CanvasContent({ canvasId }: CanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useReactFlow();
  const { screenToFlowPosition, setCenter, getZoom } = reactFlowInstance;
  const [showOutline, setShowOutline] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [edgeConfig, setEdgeConfig] = useState<EdgeConfigState>({
    isOpen: false,
    edgeId: '',
    sourceNodeId: '',
    targetNodeId: '',
    position: { x: 0, y: 0 },
  });
  
  // 连接结束时的节点创建菜单
  const [connectEndMenu, setConnectEndMenu] = useState<ConnectEndMenuState>({
    isOpen: false,
    position: { x: 0, y: 0 },
    screenPosition: { x: 0, y: 0 },
    sourceNodeId: '',
    sourceHandle: null,
  });
  

  
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    addEdge,
    loadCanvas,
    clearSelection,
    searchQuery,
    updateEdgeConfig,
    deleteEdge,
    expandedNodeId,
    // 撤销/重做
    undo,
    redo,
    canUndo,
    canRedo,
    // 节点操作
    deleteSelectedNodes,
    selectAllNodes,
    selectedNodeIds,
    // 创建节点
    addNode,
    addNoteNode,
  } = useCanvasStore();
  
  // 获取展开的节点类型
  const expandedNode = useMemo(() => {
    if (!expandedNodeId) return null;
    return nodes.find(n => n.id === expandedNodeId) || null;
  }, [nodes, expandedNodeId]);
  
  const expandedNodeType = expandedNode?.type;
  
  // 空格键检测 - 按住空格+左键可拖动画布
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 跳过 IME 组合输入期间
      if (e.isComposing) return;
      
      if (e.code === 'Space' && !e.repeat && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      // 跳过 IME 组合输入期间
      if (e.isComposing) return;
      
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };
    
    // 窗口失焦时重置
    const handleBlur = () => {
      setIsSpacePressed(false);
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);
  
  // 全局快捷键：撤销/重做/删除/全选
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // 如果焦点在输入框或文本域，完全跳过所有快捷键处理
      const activeElement = document.activeElement;
      const isInputFocused = 
        activeElement?.tagName === 'INPUT' || 
        activeElement?.tagName === 'TEXTAREA' ||
        activeElement?.getAttribute('contenteditable') === 'true' ||
        activeElement?.closest('textarea') ||
        activeElement?.closest('input');
      
      if (isInputFocused) return;
      
      // 跳过 IME 组合输入期间
      if (e.isComposing) return;
      
      // 如果展开面板打开，不处理快捷键
      if (expandedNodeId) return;
      
      // Ctrl+Z / Cmd+Z：撤销
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) {
          undo();
        }
        return;
      }
      
      // Ctrl+Y / Cmd+Shift+Z：重做
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (canRedo) {
          redo();
        }
        return;
      }
      
      // Delete / Backspace：删除选中的节点或连线
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelectedNodes();
        return;
      }
      
      // Ctrl+A / Cmd+A：全选节点
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        selectAllNodes();
        return;
      }
    };
    
    document.addEventListener('keydown', handleGlobalKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [undo, redo, canUndo, canRedo, deleteSelectedNodes, selectAllNodes, expandedNodeId]);
  
  // 初始化加载画布
  useEffect(() => {
    loadCanvas();
  }, [loadCanvas]);
  
  // 响应连线悬停请求上下文预览
  useEffect(() => {
    const handleRequestPreview = (e: CustomEvent<{
      sourceNodeId: string;
      strategy: ContextTransferStrategy;
      recentCount: number;
    }>) => {
      const { sourceNodeId, strategy, recentCount } = e.detail;
      const sourceNode = nodes.find(n => n.id === sourceNodeId);
      
      if (!sourceNode) return;
      
      const messages = sourceNode.data.messages || [];
      const summary = sourceNode.data.summary;
      
      // 根据策略生成预览内容
      let previewContent = '';
      switch (strategy) {
        case 'summary':
          previewContent = summary || messages.slice(-3).map(m => 
            `${m.role === 'user' ? '👤' : '🤖'} ${m.content.slice(0, 50)}...`
          ).join('\n');
          break;
        case 'recent':
          previewContent = messages.slice(-recentCount).map(m => 
            `${m.role === 'user' ? '👤' : '🤖'} ${m.content.slice(0, 50)}${m.content.length > 50 ? '...' : ''}`
          ).join('\n');
          break;
        case 'all':
        default:
          previewContent = messages.slice(0, 3).map(m => 
            `${m.role === 'user' ? '👤' : '🤖'} ${m.content.slice(0, 50)}${m.content.length > 50 ? '...' : ''}`
          ).join('\n');
      }
      
      const previewData: ContextPreview = {
        sourceNodeId,
        sourceNodeTitle: sourceNode.data.title || '未命名节点',
        strategy,
        messageCount: messages.length,
        previewContent: previewContent || '暂无对话内容',
        summary,
      };
      
      window.dispatchEvent(new CustomEvent('contextPreviewData', { detail: previewData }));
    };
    
    window.addEventListener('requestContextPreview', handleRequestPreview as EventListener);
    return () => window.removeEventListener('requestContextPreview', handleRequestPreview as EventListener);
  }, [nodes]);
  
  // 监听连线配置面板打开事件
  useEffect(() => {
    const handleOpenConfig = (e: CustomEvent<{
      edgeId: string;
      sourceNodeId: string;
      targetNodeId: string;
      position: { x: number; y: number };
      currentConfig?: ContextTransferConfig;
    }>) => {
      setEdgeConfig({
        isOpen: true,
        edgeId: e.detail.edgeId,
        sourceNodeId: e.detail.sourceNodeId,
        targetNodeId: e.detail.targetNodeId,
        position: e.detail.position,
        currentConfig: e.detail.currentConfig,
      });
    };
    
    window.addEventListener('openEdgeConfig', handleOpenConfig as EventListener);
    return () => window.removeEventListener('openEdgeConfig', handleOpenConfig as EventListener);
  }, []);
  
  // 根据端口判断连线类型
  const getConnectionType = useCallback((sourceHandle: string | null, targetHandle: string | null): EdgeRelationType => {
    if (
      (sourceHandle?.includes('bottom') && targetHandle?.includes('top')) ||
      (sourceHandle?.includes('top') && targetHandle?.includes('bottom'))
    ) {
      return 'hierarchy';
    }
    if (
      (sourceHandle?.includes('right') && targetHandle?.includes('left')) ||
      (sourceHandle?.includes('left') && targetHandle?.includes('right'))
    ) {
      return 'reference';
    }
    return 'hierarchy';
  }, []);
  
  // 自定义连接处理
  const handleConnect: OnConnect = useCallback(
    (connection) => {
      const relationType = getConnectionType(
        connection.sourceHandle || null,
        connection.targetHandle || null
      );
      
      addEdge({
        id: `edge-${connection.source}-${connection.target}-${Date.now()}`,
        source: connection.source!,
        target: connection.target!,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        type: 'context',
        data: { relationType },
      });
    },
    [addEdge, getConnectionType]
  );
  
  // 连接结束时检查是否需要显示创建节点菜单
  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent, connectionState: { 
      isValid: boolean | null; 
      fromNode: { id: string } | null;
      fromHandle: { id?: string | null } | null;
    }) => {
      // 如果连接成功，不显示菜单
      if (connectionState.isValid) return;
      
      // 如果没有源节点信息，不显示菜单
      if (!connectionState.fromNode) return;
      
      // 获取鼠标/触摸位置
      const clientX = 'clientX' in event ? event.clientX : event.touches[0].clientX;
      const clientY = 'clientY' in event ? event.clientY : event.touches[0].clientY;
      
      // 转换为画布坐标
      const flowPosition = screenToFlowPosition({ x: clientX, y: clientY });
      
      setConnectEndMenu({
        isOpen: true,
        position: flowPosition,
        screenPosition: { x: clientX, y: clientY },
        sourceNodeId: connectionState.fromNode.id,
        sourceHandle: connectionState.fromHandle?.id || null,
      });
    },
    [screenToFlowPosition]
  );
  
  // 从连接菜单创建节点
  const handleCreateNodeFromConnect = useCallback(
    (nodeType: 'chat' | 'note') => {
      if (!connectEndMenu.sourceNodeId) return;
      
      const { position, sourceNodeId, sourceHandle } = connectEndMenu;
      
      // 创建节点
      let newNodeId: string;
      if (nodeType === 'chat') {
        newNodeId = addNode(position, '新对话');
      } else {
        newNodeId = addNoteNode(position, '新笔记');
      }
      
      // 自动连接（延迟执行，等待节点创建完成）
      setTimeout(() => {
        if (!sourceHandle) return;
        
        // 判断是左右连接点（引用关联）还是上下连接点（层级传递）
        const isLeftHandle = sourceHandle.includes('left');
        const isRightHandle = sourceHandle.includes('right');
        const isHorizontalHandle = isLeftHandle || isRightHandle;
        
        // 直接根据连接点类型确定 relationType
        const relationType: EdgeRelationType = isHorizontalHandle ? 'reference' : 'hierarchy';
        
        if (isHorizontalHandle) {
          // 左右连接点：引用关联
          const isSourceHandle = sourceHandle.includes('source');
          
          if (isSourceHandle) {
            // 从 source handle 拖出（如 left-source, right-source）
            // 新节点应该在相反方向使用 target handle
            const targetHandle = isLeftHandle ? 'right-target' : 'left-target';
            addEdge({
              id: `edge-${sourceNodeId}-${newNodeId}-${Date.now()}`,
              source: sourceNodeId,
              target: newNodeId,
              sourceHandle,
              targetHandle,
              type: 'context',
              data: { relationType },
            });
          } else {
            // 从 target handle 拖出（如 left-target, right-target）
            // 新节点应该在相反方向使用 source handle
            const newSourceHandle = isLeftHandle ? 'right-source' : 'left-source';
            addEdge({
              id: `edge-${newNodeId}-${sourceNodeId}-${Date.now()}`,
              source: newNodeId,
              target: sourceNodeId,
              sourceHandle: newSourceHandle,
              targetHandle: sourceHandle,
              type: 'context',
              data: { relationType },
            });
          }
        } else {
          // 上下连接点：层级传递
          const isSourceHandle = sourceHandle.includes('source');
          
          if (isSourceHandle) {
            // 从 source handle 拖出，连接到新节点的 target（顶部）
            addEdge({
              id: `edge-${sourceNodeId}-${newNodeId}-${Date.now()}`,
              source: sourceNodeId,
              target: newNodeId,
              sourceHandle,
              targetHandle: 'top-target',
              type: 'context',
              data: { relationType },
            });
          } else {
            // 从 target handle 拖出，新节点作为 source（底部）
            addEdge({
              id: `edge-${newNodeId}-${sourceNodeId}-${Date.now()}`,
              source: newNodeId,
              target: sourceNodeId,
              sourceHandle: 'bottom-source',
              targetHandle: sourceHandle,
              type: 'context',
              data: { relationType },
            });
          }
        }
      }, 50);
      
      // 关闭菜单
      setConnectEndMenu(prev => ({ ...prev, isOpen: false }));
    },
    [connectEndMenu, addNode, addNoteNode, addEdge, getConnectionType]
  );
  
  // 关闭连接菜单
  const closeConnectEndMenu = useCallback(() => {
    setConnectEndMenu(prev => ({ ...prev, isOpen: false }));
  }, []);
  
  // 监听聚焦节点事件
  useEffect(() => {
    const handleFocusNode = (e: CustomEvent<string>) => {
      const nodeId = e.detail;
      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        setCenter(
          node.position.x + 200,
          node.position.y + 150,
          { zoom: 1, duration: 500 }
        );
      }
    };
    
    window.addEventListener('focusNode', handleFocusNode as EventListener);
    return () => window.removeEventListener('focusNode', handleFocusNode as EventListener);
  }, [nodes, setCenter]);
  
  // 双击创建新节点
  const onDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('.react-flow__node')) return;
      
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      useCanvasStore.getState().addNode(position);
    },
    [screenToFlowPosition]
  );
  
  // 点击画布空白处清除选择并关闭菜单
  const onPaneClick = useCallback(() => {
    clearSelection();
    setConnectEndMenu(prev => ({ ...prev, isOpen: false }));
  }, [clearSelection]);
  
  // 搜索高亮节点
  const highlightedNodes = useMemo(() => {
    if (!searchQuery.trim()) return nodes;
    
    const query = searchQuery.toLowerCase();
    return nodes.map(node => ({
      ...node,
      style: {
        ...node.style,
        opacity: node.data.title?.toLowerCase().includes(query) ||
                 node.data.tags?.some(t => t.toLowerCase().includes(query))
          ? 1
          : 0.3,
      },
    }));
  }, [nodes, searchQuery]);
  
  // 连线配置保存
  const handleEdgeConfigSave = useCallback((edgeId: string, config: ContextTransferConfig) => {
    // 更新 edge 的 data
    const edge = edges.find(e => e.id === edgeId);
    if (edge) {
      onEdgesChange([{
        id: edgeId,
        type: 'replace',
        item: {
          ...edge,
          data: {
            ...edge.data,
            contextConfig: config,
          },
        },
      }]);
    }
  }, [edges, onEdgesChange]);
  
  // 连线删除
  const handleEdgeDelete = useCallback((edgeId: string) => {
    deleteEdge(edgeId);
    setEdgeConfig(prev => ({ ...prev, isOpen: false }));
  }, [deleteEdge]);
  
  // 关闭配置面板
  const handleConfigClose = useCallback(() => {
    setEdgeConfig(prev => ({ ...prev, isOpen: false }));
  }, []);
  
  // 处理模板选择
  const handleTemplateSelect = useCallback((template: CanvasTemplate) => {
    if (template.nodes.length === 0) {
      // 空白画布，创建一个初始节点
      const position = screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
      useCanvasStore.getState().addNode(position, '新对话');
      return;
    }
    
    // 应用模板
    const timestamp = Date.now();
    const newNodes = template.nodes.map((node, index) => {
      const nodeData = node.data as Record<string, unknown>;
      const nodeStatus = nodeData.status as 'idle' | 'active' | 'completed' | undefined;
      return {
        ...node,
        id: `${node.id}-${timestamp}`,
        data: {
          title: (nodeData.title as string) || '未命名节点',
          messages: [] as Array<{ id: string; role: 'user' | 'assistant' | 'system'; content: string; timestamp: number }>,
          collapsed: false,
          status: nodeStatus || 'idle',
        },
      };
    }) as ChatNodeType[];
    
    // 创建节点ID映射
    const idMap = new Map<string, string>();
    template.nodes.forEach((node, index) => {
      idMap.set(node.id, newNodes[index].id);
    });
    
    // 重新映射连线
    const newEdges = template.edges.map((edge) => ({
      ...edge,
      id: `${edge.id}-${timestamp}`,
      source: idMap.get(edge.source) || edge.source,
      target: idMap.get(edge.target) || edge.target,
      type: 'context',
    })) as ChatEdgeType[];
    
    // 导入到 store
    useCanvasStore.getState().importCanvas({
      nodes: newNodes,
      edges: newEdges,
    });
  }, [screenToFlowPosition]);
  
  // 空画布引导
  const isEmpty = nodes.length === 0;
  
  // 获取当前连线配置所需的数据
  const edgeConfigSourceNode = nodes.find(n => n.id === edgeConfig.sourceNodeId);
  const edgeConfigTargetNode = nodes.find(n => n.id === edgeConfig.targetNodeId);
  
  return (
    <div className="relative w-full h-full flex">
      {/* 大纲面板 */}
      {showOutline && (
        <div className="w-72 flex-shrink-0 h-full z-10">
          <OutlinePanel onClose={() => setShowOutline(false)} />
        </div>
      )}
      
      {/* 画布区域 */}
      <div 
        ref={reactFlowWrapper} 
        className={`flex-1 h-full ${isSpacePressed ? 'cursor-grab' : ''}`}
        onDoubleClick={onDoubleClick}
        onContextMenu={(e) => e.preventDefault()}
      >
        <ReactFlow
          nodes={highlightedNodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          onConnectEnd={onConnectEnd}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionMode={ConnectionMode.Loose}
          selectionMode={SelectionMode.Partial}
          selectionOnDrag={!isSpacePressed}
          panOnDrag={isSpacePressed ? [0, 2] : [2]}
          panOnScroll={true}
          panOnScrollSpeed={1.2}
          zoomOnScroll={true}
          zoomOnPinch={true}
          zoomOnDoubleClick={false}
          preventScrolling={true}
          selectNodesOnDrag={false}
          deleteKeyCode={null}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.1}
          maxZoom={2}
          defaultEdgeOptions={{
            type: 'context',
            animated: true,
          }}
          proOptions={{ hideAttribution: true }}
          className="canvas-flow"
          onContextMenu={(e) => e.preventDefault()}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1}
            color="var(--canvas-grid)"
          />

          <MiniMap
            nodeColor={(node) => {
              // 选中节点
              if (node.selected) return 'rgba(99, 102, 241, 0.9)';
              
              // 根据节点类型返回不同的颜色
              const nodeType = node.type || node.data.type;
              switch (nodeType) {
                case 'chatNode':
                  return 'rgba(96, 165, 250, 0.7)'; // 天蓝
                case 'noteNode':
                  return 'rgba(167, 139, 250, 0.7)'; // 薰衣草
                case 'groupNode':
                  return 'rgba(251, 191, 36, 0.6)'; // 琥珀
                default:
                  return 'rgba(226, 232, 255, 0.8)'; // 浅蓝灰
              }
            }}
            maskColor="rgba(247, 249, 252, 0.7)"
            className="!bg-transparent !border-none !rounded-lg"
          />
          
          <Panel position="top-left" className="m-4">
            <GlobalSearch />
          </Panel>
          
          {/* 左侧竖排工具栏 */}
          <LeftToolbar 
            showOutline={showOutline} 
            onToggleOutline={() => setShowOutline(!showOutline)} 
          />
          
          {isEmpty && (
            <Panel position="top-center" className="mt-20">
              <TemplateSelector onSelect={handleTemplateSelect} />
            </Panel>
          )}
          
          {!isEmpty && (
            <Panel position="bottom-center" className="mb-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded border border-[#E9E9E7] text-sm text-[#787774] shadow-sm">
                <span>双击空白创建节点</span>
                <span className="mx-2 text-[#D3D1CB]">|</span>
                <span>双指滑动平移画布</span>
                <span className="mx-2 text-[#D3D1CB]">|</span>
                <span>双指捏合/滚轮缩放</span>
                <span className="mx-2 text-[#D3D1CB]">|</span>
                <span className="text-[#2383E2] font-medium">Space</span>
                <span>+拖拽移动</span>
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>
      
      {/* 连接结束时创建节点菜单 */}
      {connectEndMenu.isOpen && (
        <div
          className="fixed z-[9999] min-w-[140px] py-1.5 rounded-lg shadow-soft border bg-white"
          style={{
            left: connectEndMenu.screenPosition.x,
            top: connectEndMenu.screenPosition.y,
            transform: 'translate(-50%, 10px)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1.5 text-xs text-gray-500 border-b">
            创建节点
          </div>
          <button
            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
            onClick={() => handleCreateNodeFromConnect('chat')}
          >
            <span className="w-5 h-5 flex items-center justify-center bg-blue-50 rounded text-blue-600 text-xs">
              💬
            </span>
            对话
          </button>
          <button
            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
            onClick={() => handleCreateNodeFromConnect('note')}
          >
            <span className="w-5 h-5 flex items-center justify-center bg-green-50 rounded text-green-600 text-xs">
              📝
            </span>
            笔记
          </button>
          <button
            className="w-full px-3 py-2 text-left text-xs text-gray-400 hover:bg-gray-50 transition-colors"
            onClick={closeConnectEndMenu}
          >
            取消
          </button>
        </div>
      )}
      
      {/* 连线配置面板 */}
      {edgeConfig.isOpen && edgeConfigSourceNode && edgeConfigTargetNode && (
        <EdgeConfigPanel
          edgeId={edgeConfig.edgeId}
          sourceNodeId={edgeConfig.sourceNodeId}
          targetNodeId={edgeConfig.targetNodeId}
          sourceNodeTitle={edgeConfigSourceNode.data.title || '未命名'}
          targetNodeTitle={edgeConfigTargetNode.data.title || '未命名'}
          sourceMessages={edgeConfigSourceNode.data.messages || []}
          sourceSummary={edgeConfigSourceNode.data.summary}
          currentConfig={edgeConfig.currentConfig}
          onSave={handleEdgeConfigSave}
          onDelete={handleEdgeDelete}
          onClose={handleConfigClose}
          position={edgeConfig.position}
        />
      )}
      
      {/* 批量操作工具栏 */}
      <BatchToolbar selectedCount={selectedNodeIds.size} />
      
      {/* 返回主页按钮 */}
      {canvasId && (
        <BackToHome canvasId={canvasId} />
      )}
      
      {/* 全屏聊天抽屉 */}
      {expandedNodeType === 'chatNode' && <ExpandedChat />}
      
      {/* 全屏笔记抽屉 */}
      {expandedNodeType === 'noteNode' && <ExpandedNote />}
    </div>
  );
}

interface CanvasWrapperProps {
  canvasId?: string;
}

export function Canvas({ canvasId }: CanvasWrapperProps) {
  return (
    <ReactFlowProvider>
      <CanvasContent canvasId={canvasId} />
    </ReactFlowProvider>
  );
}
