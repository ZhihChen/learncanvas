# Notion 真正的设计规范

## 设计哲学
> **"Less, but better" - Dieter Rams**

Notion 的设计不仅仅是"简单"，而是"精炼"。每一个像素都经过精心设计，去除所有多余，只保留必要。

## 色彩系统

### 背景色 - 纯净的白
```css
--bg-primary: #FFFFFF;           /* 纯白 - 主背景 */
--bg-secondary: #F7F6F3;         /* 极淡灰 - 次级背景 */
--bg-tertiary: #EFEFEF;          /* 浅灰 - 三级背景 */
```

### 文本色 - 深灰而非纯黑
```css
--text-primary: #37352F;         /* 深灰 #37352F - 主文字 */
--text-secondary: #787774;       /* 中灰 #787774 - 次要文字 */
--text-tertiary: #9B9A97;        /* 浅灰 #9B9A97 - 辅助文字 */
--text-placeholder: #C4C4C4;     /* 极浅灰 - 占位符 */
```

### 边框色 - 几乎不可见的灰
```css
--border-primary: #E9E9E7;       /* 极淡灰 - 主边框 */
--border-secondary: #D3D1CB;     /* 浅灰 - 次边框 */
--border-hover: #B3B3B3;         /* 中灰 - hover边框 */
```

### 强调色 - 唯一的色彩
```css
--accent-primary: #2383E2;       /* Notion 蓝 - 主要交互 */
--accent-hover: #1A6BAC;         /* 深蓝 - hover状态 */
--accent-light: #E3F2FD;         /* 浅蓝 - 背景高亮 */
```

## 排版系统

### 字体家族
```css
/* 标题 - 衬线字体，增加优雅感 */
--font-display: 'Georgia', 'Times New Roman', serif;

/* 正文 - 无衬线，清晰易读 */
--font-body: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* 代码 - 等宽 */
--font-mono: 'SF Mono', Consolas, 'Liberation Mono', monospace;
```

### 字号层级
```css
--text-xs: 12px;    /* 标签、元数据 */
--text-sm: 13px;    /* 次要内容 */
--text-base: 14px;  /* 正文 */
--text-lg: 16px;    /* 小标题 */
--text-xl: 18px;    /* 中标题 */
--text-2xl: 24px;   /* 大标题 */
--text-3xl: 32px;   /* 页面标题 */
```

### 行高
```css
--leading-tight: 1.2;    /* 标题 */
--leading-normal: 1.5;   /* 正文 */
--leading-relaxed: 1.75; /* 长文本 */
```

### 字重
```css
--font-regular: 400;     /* 正文 */
--font-medium: 500;      /* 强调 */
--font-semibold: 600;    /* 小标题 */
--font-bold: 700;        /* 大标题 */
```

## 间距系统

Notion 的间距系统基于 4px 网格：
```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;    /* 标准间距 */
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
```

## 圆角系统

Notion 使用极小的圆角（几乎不可见）：
```css
--radius-none: 0px;      /* 直角 */
--radius-sm: 2px;        /* 小圆角 */
--radius-md: 3px;        /* 默认圆角 */
--radius-lg: 4px;        /* 大圆角 */
```

**注意**：Notion 几乎不使用圆角，大部分元素是直角。

## 阴影系统

Notion 几乎不使用阴影，如果必须使用，也是极淡的：
```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.02);
--shadow-md: 0 2px 4px rgba(0, 0, 0, 0.04);
```

## 组件设计规范

### 按钮

#### 幽灵按钮（默认）
```css
background: transparent;
color: var(--text-primary);
padding: 4px 8px;
border: none;
hover: background: var(--bg-secondary);
```

#### 主按钮（蓝色）
```css
background: var(--accent-primary);
color: #FFFFFF;
padding: 6px 12px;
border: none;
hover: background: var(--accent-hover);
```

#### 文本按钮
```css
background: transparent;
color: var(--text-secondary);
padding: 0;
border: none;
hover: color: var(--text-primary);
text-decoration: underline;
```

### 输入框
```css
background: #FFFFFF;
border: 1px solid var(--border-primary);
padding: 8px 12px;
font-size: var(--text-base);
color: var(--text-primary);
hover: border: var(--border-hover);
focus: border: var(--accent-primary);
focus-ring: 0 0 0 2px rgba(35, 131, 226, 0.1);
```

### 卡片/节点
```css
background: #FFFFFF;
border: 1px solid var(--border-primary);
border-radius: var(--radius-md);
padding: var(--space-4);
hover: border: var(--border-hover);
```

### 分隔线
```css
border: none;
border-top: 1px solid var(--border-primary);
height: 1px;
```

## 图标规范

### 尺寸
```css
--icon-xs: 12px;
--icon-sm: 14px;
--icon-base: 16px;
--icon-lg: 20px;
--icon-xl: 24px;
```

### 颜色
```css
--icon-default: var(--text-secondary);
--icon-hover: var(--text-primary);
--icon-active: var(--accent-primary);
```

### 风格
- 使用填充风格（solid）
- 1.5px 描边宽度
- 极简线条

## 画布设计

### 背景
```css
background: #FFFFFF;
background-image: radial-gradient(circle, var(--border-primary) 1px, transparent 1px);
background-size: 24px 24px;  /* 24px 间距 */
```

### 连线
```css
stroke: var(--border-secondary);
stroke-width: 1.5px;
hover: stroke: var(--accent-primary);
```

### 连接点（Handle）
```css
width: 8px;
height: 8px;
background: var(--text-tertiary);
border: 2px solid #FFFFFF;
hover: background: var(--accent-primary);
```

## 节点设计

### 对话节点
```css
/* 容器 */
background: #FFFFFF;
border: 1px solid var(--border-primary);
border-radius: var(--radius-md);
box-shadow: none;

/* 头部 */
border-bottom: 1px solid var(--border-primary);
padding: var(--space-3);

/* 消息气泡 */
用户: background: var(--accent-primary); color: #FFFFFF;
AI: background: var(--bg-secondary); color: var(--text-primary);
```

### 笔记节点
```css
/* 容器 */
background: #FFFFFF;
border: 1px solid var(--border-primary);
border-radius: var(--radius-md);

/* 摘录卡片 */
background: var(--bg-secondary);
border: 1px solid var(--border-primary);
```

## 侧边栏设计

```css
background: var(--bg-secondary);
border-right: 1px solid var(--border-primary);

/* 搜索框 */
background: #FFFFFF;
border: 1px solid var(--border-primary);
padding: 8px 12px;
placeholder: var(--text-placeholder);

/* 列表项 */
hover: background: var(--bg-tertiary);
active: background: var(--border-secondary);
selected: background: var(--accent-light); color: var(--accent-primary);
```

## 工具栏设计

```css
background: #FFFFFF;
border: 1px solid var(--border-primary);
border-radius: var(--radius-md);
padding: var(--space-3);

/* 按钮 */
background: transparent;
color: var(--text-secondary);
padding: 8px;
hover: background: var(--bg-secondary);
active: background: var(--bg-tertiary);
```

## 交互状态

### Hover
```css
background: var(--bg-secondary);
border-color: var(--border-hover);
color: var(--text-primary);
```

### Active
```css
background: var(--bg-tertiary);
border-color: var(--border-hover);
```

### Focus
```css
outline: none;
border-color: var(--accent-primary);
box-shadow: 0 0 0 2px rgba(35, 131, 226, 0.1);
```

### Selected
```css
border-color: var(--accent-primary);
box-shadow: 0 0 0 1px var(--accent-primary);
```

## 特殊处理

### Markdown 内容
```css
/* 标题 - 衬线字体 */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-display);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

/* 链接 */
a {
  color: var(--accent-primary);
  text-decoration: none;
  hover: text-decoration: underline;
}

/* 代码 */
code {
  background: var(--bg-secondary);
  padding: 2px 4px;
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 0.9em;
  color: var(--text-primary);
}

/* 引用 */
blockquote {
  border-left: 3px solid var(--border-secondary);
  padding-left: 12px;
  color: var(--text-secondary);
  font-style: italic;
}
```

## 禁止事项

❌ **禁止使用渐变**
❌ **禁止使用发光效果**
❌ **禁止使用厚阴影**
❌ **禁止使用大圆角（超过 4px）**
❌ **禁止使用过多颜色**
❌ **禁止使用装饰性元素**
❌ **禁止使用半透明背景（除了 hover/focus 状态）**
❌ **禁止使用过渡动画（除了必要的状态变化）**

## 设计检查清单

- [ ] 背景是否为纯白（#FFFFFF）？
- [ ] 文字是否为深灰（#37352F）而非纯黑？
- [ ] 边框是否为极淡灰（#E9E9E7）且细（1px）？
- [ ] 是否只有一个强调色（Notion 蓝 #2383E2）？
- [ ] 是否去除了所有渐变、发光、厚阴影？
- [ ] 圆角是否 ≤ 4px？
- [ ] 间距是否基于 4px 网格？
- [ ] 是否有足够的留白？
- [ ] 标题是否使用了衬线字体？
- [ ] 图标是否简约、填充风格？
- [ ] hover/focus 状态是否清晰但不突兀？
- [ ] 整体感觉是否"简洁"、"干净"、"专业"？

## 参考资源

- Notion 官网：https://www.notion.so
- Notion 帮助中心：https://www.notion.so/help
- 设计系统参考：https://www.notion.so/redesign
