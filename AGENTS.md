# AGENTS.md - LearnCanvas 开发规范

## 项目概述

LearnCanvas 是一个基于 React 的画布式知识管理应用，通过树状结构管理学习路径，支持上下文传递和分支探索。

### 核心功能
- **画布管理** - 无限画布，支持缩放、平移、分支探索
- **节点系统** - 支持对话节点、笔记节点、分组节点
- **上下文连线** - 节点之间支持上下文传递
- **摘录系统** - 选中文本快速创建摘录笔记
- **计划识别** - AI 自动识别学习计划，一键创建学习路径

## 技术栈

| 分类 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| 语言 | TypeScript 5 |
| UI 库 | React 19 + shadcn/ui |
| 样式 | Tailwind CSS v4 |
| 状态管理 | Zustand |
| 画布 | @xyflow/react |
| AI 集成 | coze-coding-dev-sdk |

## 构建和测试命令

```bash
# 安装依赖（必须使用 pnpm）
pnpm install

# 开发模式
pnpm dev
# 访问 http://localhost:5000

# 类型检查
pnpm ts-check

# ESLint 检查
pnpm lint

# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start
```

## 代码风格指南

### TypeScript
- 所有组件和函数必须有类型注解
- 使用 `interface` 定义对象类型
- 使用 `type` 定义联合类型、别名

### React 组件
- 客户端组件使用 `'use client'` 指令
- 优先使用 shadcn/ui 基础组件
- 使用 `cn()` 工具函数合并类名
- 组件文件使用 `.tsx` 扩展名

### 状态管理
- 使用 Zustand 管理全局状态
- Store 定义在 `src/store/` 目录
- Store 文件命名：`{name}Store.ts`

### 样式
- 使用 Tailwind CSS 类名
- 主题变量定义在 `src/app/globals.css`
- 避免使用内联样式

## 项目结构

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API 路由
│   │   ├── chat/                # 流式对话 API
│   │   ├── file/                # 文件上传/解析 API
│   │   ├── plan/                # 计划识别 API
│   │   ├── search/              # 联网搜索 API
│   │   ├── summary/              # 摘要生成 API
│   │   └── suggestions/          # 建议生成 API
│   ├── canvas/[id]/              # 画布页面
│   ├── layout.tsx               # 根布局
│   ├── page.tsx                 # 首页
│   └── globals.css              # 全局样式
├── components/
│   ├── canvas/                   # 画布组件
│   │   ├── Canvas.tsx           # 画布主组件
│   │   ├── Toolbar.tsx          # 工具栏
│   │   ├── ExpandedChat.tsx     # 展开的聊天面板
│   │   ├── ExpandedNote.tsx     # 展开的笔记面板
│   │   └── ...
│   ├── chat/                    # 聊天组件
│   │   ├── MarkdownRenderer.tsx # Markdown 渲染
│   │   └── QuoteBlock.tsx        # 引用块
│   ├── edge/                    # 连线组件
│   │   ├── ContextEdge.tsx      # 上下文连线
│   │   └── EdgeConfigPanel.tsx  # 连线配置面板
│   ├── file/                    # 文件组件
│   │   ├── FileUploader.tsx      # 文件上传器
│   │   ├── FilePreview.tsx      # 文件预览
│   │   └── FileIcon.tsx         # 文件图标
│   ├── node/                    # 节点组件
│   │   ├── ChatNode.tsx         # 对话节点
│   │   ├── NoteNode.tsx         # 笔记节点
│   │   ├── GroupNode.tsx        # 分组节点
│   │   └── NodeReferencePicker.tsx  # 节点引用选择器
│   ├── plan/                    # 计划组件
│   │   └── PlanDetector.tsx     # 计划检测器
│   ├── search/                  # 搜索组件
│   │   └── GlobalSearch.tsx     # 全局搜索
│   ├── excerpt/                 # 摘录组件
│   │   ├── HighlightMenu.tsx    # 高亮菜单
│   │   └── NoteInputDialog.tsx  # 笔记输入对话框
│   ├── sidebar/                 # 侧边栏组件
│   │   └── Sidebar.tsx          # 侧边栏
│   └── ui/                      # shadcn/ui 基础组件
├── hooks/                       # 自定义 Hooks
│   ├── useNoteContext.ts        # 笔记上下文 Hook
│   ├── useTextSelection.ts      # 文本选择 Hook
│   └── use-mobile.ts           # 移动端检测 Hook
├── lib/                        # 工具函数
│   ├── utils.ts                # 通用工具（cn()等）
│   ├── contextUtils.ts         # 上下文工具
│   ├── layout.ts               # 布局工具
│   └── templates.ts            # 模板定义
├── store/                      # Zustand 状态管理
│   ├── canvasStore.ts          # 画布状态
│   ├── canvasListStore.ts      # 画布列表状态
│   └── sidebarStore.ts         # 侧边栏状态
└── types/                      # TypeScript 类型定义
    └── index.ts                # 全局类型定义
```

## API 路由

### `/api/chat` - 流式对话
- 方法：POST
- 功能：流式 AI 对话，支持联网搜索

### `/api/summary` - 摘要生成
- 方法：POST
- 功能：生成对话或节点摘要

### `/api/ai/note` - AI 笔记
- 方法：POST
- 功能：AI 辅助生成笔记

### `/api/search` - 联网搜索
- 方法：POST
- 功能：实时网络搜索

### `/api/suggestions` - 建议生成
- 方法：POST
- 功能：生成下一步行动建议

### `/api/plan/extract` - 计划识别
- 方法：POST
- 功能：识别对话中的学习计划

### `/api/file/upload` - 文件上传
- 方法：POST
- 功能：上传文件到对象存储

### `/api/file/parse` - 文件解析
- 方法：POST
- 功能：解析 PDF/Office 文档内容

## 环境变量

必须配置的环境变量：

```env
# 对象存储（文件上传功能）
COZE_BUCKET_ENDPOINT_URL=your_bucket_endpoint
COZE_BUCKET_NAME=your_bucket_name
```

## 测试说明

### 本地测试
1. 启动开发服务器：`pnpm dev`
2. 访问 http://localhost:5000
3. 创建新画布并测试各项功能

### API 测试
```bash
# 测试聊天 API
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"你好"}]}'

# 测试计划识别
curl -X POST http://localhost:5000/api/plan/extract \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"请制定一个React学习计划"}]}'
```

## 安全注意事项

1. **不要提交敏感信息**
   - 禁止提交 `.env` 文件
   - 使用 `.env.example` 作为模板

2. **API 密钥保护**
   - 所有 API 密钥通过环境变量配置
   - 不要在代码中硬编码密钥

3. **文件上传安全**
   - 限制上传文件大小（50MB）
   - 验证文件 MIME 类型
