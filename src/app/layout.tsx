import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import './globals.css';
import '../styles/animations.css';

export const metadata: Metadata = {
  title: {
    default: 'Canvas Chat - 结构化AI对话画布',
    template: '%s | Canvas Chat',
  },
  description:
    '将碎片化的AI对话转化为结构化的知识画布。每个对话节点可独立交互，通过连线实现上下文传递，形成清晰的知识图谱。',
  keywords: [
    'AI对话',
    '知识画布',
    '结构化对话',
    '知识图谱',
    'AI助手',
    '对话管理',
    '学习笔记',
  ],
  authors: [{ name: 'Canvas Chat Team' }],
  generator: 'Canvas Chat',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <html lang="zh-CN">
      <body className="antialiased" suppressHydrationWarning>
        {isDev && <Inspector />}
        {children}
      </body>
    </html>
  );
}
