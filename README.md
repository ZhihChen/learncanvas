# LearnCanvas

**基于 React 的画布式知识管理应用** — 像画画一样管理你的学习路径。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

---

## 功能特性

### 核心功能

- **无限画布** — 无限大的画布空间，支持缩放、平移，自由探索思维
- **智能节点** — 支持对话节点、笔记节点、分组节点，多种内容形式
- **上下文连线** — 节点之间支持上下文传递，建立知识关联
- **摘录系统** — 选中文本快速创建摘录笔记，保留知识碎片
- **AI 对话** — 内置 AI 助手，支持多轮对话和文件理解
- **计划识别** — AI 自动识别学习计划，一键创建结构化学习路径

### 特色能力

- 🔗 **上下文传递** — 连线自动携带上下文信息，让 AI 理解知识关联
- 📊 **层级结构** — 分组节点支持嵌套组织复杂内容
- 📁 **文件支持** — 支持上传 PDF、Word、Excel、PPT、图片等文件
- 🔍 **全局搜索** — 快速搜索所有画布和节点内容
- 📝 **摘录笔记** — 选中文本即创建摘录，保留来源和上下文
- 🎯 **智能计划** — 对话中识别学习计划，自动生成学习路径

---

## 技术栈

| 分类 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| 语言 | TypeScript 5 |
| UI 库 | React 19 + shadcn/ui |
| 样式 | Tailwind CSS 4 |
| 状态管理 | Zustand |
| 画布 | @xyflow/react |
| AI | 火山引擎 ARK API (OpenAI 兼容) |

---

## 快速开始

### 前置要求

- Node.js 18+
- pnpm 8+

### 安装步骤

```bash
# 1. 克隆项目
git clone https://github.com/ZhihChen/learncanvas.git
cd learncanvas

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入你的 API Key

# 4. 启动开发服务器
pnpm dev
```

访问 http://localhost:5000 查看应用。

### 构建生产版本

```bash
pnpm build
pnpm start
```

---

## 环境变量配置

### 必需配置

```env
# 火山引擎 ARK API（AI 对话功能）
ARK_BASE_URL=https://ark.cn-beijing.volces.com/api/coding/v3
ARK_API_KEY=your_api_key_here
ARK_MODEL=doubao-seed-2-0-pro-260215
```

### 可选配置

```env
# S3 兼容对象存储（文件上传功能）
S3_ENDPOINT=https://your-s3-endpoint.com
S3_REGION=cn-beijing
S3_ACCESS_KEY_ID=your_access_key
S3_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=your-bucket
```

### 获取 API Key

#### 火山引擎 ARK API

1. 访问 [火山引擎控制台](https://console.volcengine.com)
2. 登录或注册账号
3. 找到 **ARK** 服务
4. 创建 API Key
5. 选择合适的模型（推荐：`doubao-seed-2-0-pro-260215`）

> **注意**：不同模型有不同的能力和定价，请根据需求选择。

#### S3 兼容存储

如果需要文件上传功能，可以选择：

- **火山引擎 TOS**：[官方文档](https://www.volcengine.com/docs/tos)
- **AWS S3**：[官方文档](https://docs.aws.amazon.com/s3/)
- **MinIO**（自建）：[官方文档](https://min.io/docs/minio/linux/)

---

## 项目结构

```
learncanvas/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API 路由
│   │   │   ├── chat/            # 流式对话
│   │   │   ├── search/          # 联网搜索
│   │   │   ├── summary/         # 摘要生成
│   │   │   ├── plan/             # 计划识别
│   │   │   ├── ai/              # AI 笔记
│   │   │   ├── suggestions/      # 建议生成
│   │   │   └── file/            # 文件处理
│   │   ├── canvas/[id]/         # 画布页面
│   │   ├── layout.tsx           # 根布局
│   │   ├── page.tsx             # 首页
│   │   └── globals.css          # 全局样式
│   │
│   ├── components/              # React 组件
│   │   ├── canvas/              # 画布组件
│   │   ├── chat/                # 聊天组件
│   │   ├── edge/                # 连线组件
│   │   ├── node/                # 节点组件
│   │   ├── file/                # 文件组件
│   │   ├── plan/                # 计划组件
│   │   ├── search/              # 搜索组件
│   │   ├── excerpt/             # 摘录组件
│   │   └── sidebar/             # 侧边栏
│   │
│   ├── hooks/                   # 自定义 Hooks
│   ├── lib/                     # 工具函数
│   ├── store/                   # Zustand 状态管理
│   └── types/                   # TypeScript 类型
│
├── public/                      # 静态资源
├── .env.example                 # 环境变量模板
├── package.json
├── tsconfig.json
└── README.md
```

---

## API 文档

### 聊天接口

```
POST /api/chat
Content-Type: application/json

{
  "messages": [
    { "role": "user", "content": "你好" }
  ],
  "contextMessages": [],      // 可选，上下文消息
  "systemPrompt": ""          // 可选，自定义系统提示词
}
```

### 文件上传

```
POST /api/file/upload
Content-Type: multipart/form-data

file: <File>
```

### 计划识别

```
POST /api/plan/extract
Content-Type: application/json

{
  "messages": [
    { "role": "user", "content": "请帮我制定一个React学习计划" },
    { "role": "assistant", "content": "好的，这是一个学习计划..." }
  ]
}
```

---

## 常见问题

### Q: 为什么 AI 对话没有反应？

检查环境变量是否正确配置：
```bash
cat .env.local
```

确保 `ARK_API_KEY` 已填入有效值。

### Q: 文件上传功能不工作？

1. 确认配置了 S3 环境变量
2. 检查存储桶权限设置
3. 查看浏览器控制台错误信息

### Q: 画布加载很慢？

尝试：
- 减少画布中的节点数量
- 关闭不需要的上下文连线
- 检查网络连接

---

## 开发指南

### 代码规范

```bash
# 类型检查
pnpm ts-check

# ESLint 检查
pnpm lint

# 格式化代码
pnpm format
```

### 添加新组件

1. 在 `src/components/` 下创建组件文件夹
2. 使用 shadcn/ui 基础组件
3. 遵循项目命名规范

---

## 部署

### Vercel（推荐）

1. Fork 本项目
2. 在 Vercel 中导入
3. 配置环境变量
4. 部署

### Docker

```bash
# 构建镜像
docker build -t learncanvas .

# 运行容器
docker run -p 5000:5000 --env-file .env.local learncanvas
```

### 手动部署

```bash
pnpm build
pnpm start
```

---

## License

MIT License © 2024 ZhihChen

---

## 致谢

- [Next.js](https://nextjs.org/) - React 框架
- [shadcn/ui](https://ui.shadcn.com/) - UI 组件库
- [Tailwind CSS](https://tailwindcss.com/) - 样式框架
- [@xyflow/react](https://reactflow.dev/) - 画布组件
- [火山引擎 ARK](https://www.volcengine.com/) - AI 能力
