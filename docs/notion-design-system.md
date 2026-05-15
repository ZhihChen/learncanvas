# Notion 风格设计规范

## 设计哲学
**极简、克制、内容优先**
- 去除所有不必要的装饰性元素
- 让内容成为视觉焦点
- 交互微妙而清晰
- 大量留白，营造呼吸感

## 配色方案

### 主色调 - 中性灰白
```css
/* 背景色 - Notion 灰白 */
--background: #ffffff;
--background-alt: #f7f6f3;

/* 文本色 - 深灰而非纯黑 */
--foreground: #37352f;
--foreground-muted: #9b9a97;

/* 边框 - 极淡的灰色 */
--border: #e9e9e7;
--border-hover: #d3d1cb;
```

### 交互色 - 蓝灰色
```css
/* 主色 - 低调的蓝灰 */
--primary: #2383e2;
--primary-foreground: #ffffff;

/* 次要色 - 浅灰蓝 */
--secondary: #eef0f1;
--secondary-foreground: #37352f;

/* 强调色 - hover 时的蓝灰 */
--accent: #e1e4e8;
```

### 功能色
```css
/* 成功 */
--success: #0f7b6c;

/* 警告 */
--warning: #d9730d;

/* 危险 */
--danger: #e03e3e;
```

## 排版系统

### 字体
```css
/* 中文字体 - 优先使用系统字体 */
--font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;

/* 英文字体 - 优先 SF Pro / Inter */
--font-serif: "Georgia", serif;
--font-mono: "SFMono-Regular", "Consolas", "Liberation Mono", "Menlo", monospace;
```

### 字号层级
```css
--text-xs: 12px;    /* 辅助信息 */
--text-sm: 13px;    /* 次要内容 */
--text-base: 14px;  /* 正文 */
--text-lg: 16px;    /* 标题 */
--text-xl: 18px;    /* 大标题 */
--text-2xl: 24px;   /* 页面标题 */
```

### 行高
```css
--leading-tight: 1.2;   /* 标题 */
--leading-normal: 1.5;  /* 正文 */
--leading-relaxed: 1.75; /* 长文本 */
```

## 间距系统

```css
--spacing-1: 4px;
--spacing-2: 8px;
--spacing-3: 12px;
--spacing-4: 16px;
--spacing-5: 20px;
--spacing-6: 24px;
--spacing-8: 32px;
--spacing-10: 40px;
```

## 圆角系统

```css
--radius-sm: 4px;   /* 小元素 */
--radius-md: 6px;   /* 默认 */
--radius-lg: 8px;   /* 大元素 */
--radius-xl: 12px;  /* 卡片 */
```

## 阴影系统

**原则：极简，几乎不用阴影**

```css
/* 仅在卡片悬浮时使用极淡阴影 */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
--shadow-md: 0 2px 4px rgba(0, 0, 0, 0.06);
```

## 组件样式规范

### 按钮
```css
/* 默认按钮 - 扁平无背景，文字为主 */
--button-bg: transparent;
--button-color: #37352f;
--button-hover-bg: #f7f6f3;
--button-active-bg: #e9e9e7;

/* 主要按钮 - 蓝灰色填充 */
--button-primary-bg: #2383e2;
--button-primary-color: #ffffff;
--button-primary-hover-bg: #1971c2;
```

### 输入框
```css
/* 极简边框，无背景 */
--input-bg: #ffffff;
--input-border: #e9e9e7;
--input-hover-border: #d3d1cb;
--input-focus-border: #2383e2;
--input-focus-ring: rgba(35, 131, 226, 0.1);
```

### 节点/卡片
```css
/* 极淡边框，白色背景 */
--card-bg: #ffffff;
--card-border: #e9e9e7;
--card-hover-border: #d3d1cb;
--card-shadow: none; /* 不使用阴影 */
```

### 侧边栏
```css
--sidebar-bg: #f7f6f3;
--sidebar-border: #e9e9e7;
--sidebar-item-hover: #e9e9e7;
--sidebar-item-active: #e1e4e8;
```

## 交互规范

### Hover
- 背景色变化：极淡的灰色（#f7f6f3）
- 无阴影变化
- 无边框变化（除非可交互元素）

### Active
- 背景色：更深一点的灰色（#e9e9e7）
- 轻微的尺寸缩小（可选）

### Focus
- 边框：蓝色（#2383e2）
- 光环：极淡的蓝色光环（rgba(35, 131, 226, 0.1)）
- 范围：2px 外扩

### 过渡时间
```css
--transition-fast: 150ms;
--transition-normal: 200ms;
--transition-slow: 300ms;
--transition-easing: ease;
```

## 图标规范

- 大小：14px、16px、20px
- 颜色：#9b9a97（默认） / #37352f（hover）
- 线条：1.5px 描边
- 风格：细线条，填充风格（lucide-react）

## 特殊处理

### 画布背景
```css
/* Notion 风格的点阵网格 */
--canvas-bg: #ffffff;
--canvas-grid: #e9e9e7;
--canvas-grid-size: 24px;
```

### 连线
```css
/* 灰色极细线条 */
--edge-color: #e0e0de;
--edge-width: 1.5px;
--edge-hover-color: #2383e2;
```

### 节点状态指示
```css
/* 不使用颜色块，使用细线指示 */
--status-idle: #9b9a97;
--status-active: #2383e2;
--status-completed: #0f7b6c;
```

## 对比当前设计

| 元素 | 当前设计 | Notion 风格 |
|------|---------|-------------|
| 主题 | 暗色，琥珀色调 | 浅色，中性灰白 |
| 背景 | 深色渐变 | 纯白色/浅灰色 |
| 节点 | 半透明、发光、阴影 | 纯白、极淡边框、无阴影 |
| 边框 | 琥珀色半透明 | 极淡灰色 |
| 圆角 | 12-16px | 4-8px |
| 装饰 | 渐变、光效 | 无装饰 |
| 间距 | 较紧凑 | 宽松，大量留白 |

## 迁移清单

- [ ] 修改全局 CSS 变量
- [ ] 修改 Canvas 背景
- [ ] 重构节点样式（ChatNode、NoteNode、GroupNode）
- [ ] 重构侧边栏样式
- [ ] 重构工具栏样式
- [ ] 重构连线样式
- [ ] 重构对话框样式
- [ ] 重构输入框样式
- [ ] 调整整体间距
- [ ] 移除发光、渐变效果
