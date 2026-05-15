# Notion 真正的设计系统 v2.0

> **核心理念**：极简、克制、内容优先、视觉舒适

---

## 1. 色彩系统

### 1.1 背景色（Background）

```css
--bg-primary: #FFFFFF;      /* 纯白 - 画布主背景 */
--bg-secondary: #F7F6F3;    /* 极淡灰 - 选中、hover背景 */
--bg-hover: #F1F1EF;        /* 淡灰 - 按钮hover */
--bg-active: #EDEBEB;       /* 中淡灰 - 按钮active */
```

**使用规则**：
- 画布背景：100%纯白，没有任何渐变
- 卡片/节点背景：纯白 #FFFFFF
- 选中态：#F7F6F3（Notion的选中背景色）
- 按钮状态：#F1F1EF → #EDEBEB

### 1.2 文本色（Text）

```css
--text-primary: #37352F;    /* 深灰 - 主文字（Notion标准） */
--text-secondary: #787774;  /* 中灰 - 次要文字 */
--text-tertiary: #9B9A97;   /* 浅灰 - 辅助文字 */
--text-disabled: #C4C4C4;   /* 极浅灰 - 禁用、占位符 */
```

**使用规则**：
- 绝不使用纯黑 #000000
- 标题、正文：#37352F
- 说明文字、图标：#787774
- 占位符、禁用：#C4C4C4

### 1.3 边框色（Border）

```css
--border-primary: #E9E9E7;  /* 极淡灰 - 主边框 */
--border-secondary: #D3D1CB;/* 浅灰 - 次边框 */
--border-focus: #2383E2;    /* Notion蓝 - focus边框 */
```

**使用规则**：
- 默认边框：#E9E9E7（几乎看不见）
- Hover边框：#D3D1CB
- Focus边框：#2383E2（唯一强调色）
- 避免厚重的边框，1px即可

### 1.4 强调色（Accent）

```css
--accent-primary: #2383E2;  /* Notion蓝 - 主要交互 */
--accent-hover: #1A6BAC;    /* 深蓝 - hover状态 */
--accent-light: #E3F2FD;    /* 浅蓝 - 背景高亮 */
```

**使用规则**：
- 唯一的彩色强调
- 用于：链接、选中状态、主要操作按钮、焦点状态
- 不要在节点背景、边框上使用

### 1.5 功能色（仅用于特殊情况）

```css
--color-success: #0F7B6C;   /* 绿色 - 成功提示 */
--color-warning: #D9730D;   /* 橙色 - 警告提示 */
--color-danger: #E03E3E;    /* 红色 - 删除、错误 */
```

**使用规则**：
- 仅用于：删除确认、错误提示、系统通知
- 不用于：节点背景、装饰元素

---

## 2. 画布系统（Canvas）

### 2.1 背景网格

**Notion标准网格**：
- 颜色：#E9E9E7（极淡灰）
- 透明度：20%（几乎看不见）
- 点大小：1px
- 点间距：24px
- 类型：点阵（dots），不是线条

**视觉效果**：
- 远看：纯白
- 近看：极淡的点阵辅助对齐
- 不干扰内容

### 2.2 画布交互

```css
--canvas-pan: grab;          /* 拖拽时光标 */
--canvas-panning: grabbing;  /* 拖拽中光标 */
--canvas-zoom: default;      /* 缩放时光标 */
```

---

## 3. 节点系统（Node）

### 3.1 节点外观

```css
--node-bg: #FFFFFF;          /* 纯白背景 */
--node-border: #E9E9E7;      /* 极淡边框 */
--node-border-hover: #D3D1CB;/* hover边框 */
--node-border-selected: #2383E2; /* 选中边框 */
--node-shadow: 0 1px 2px rgba(0,0,0,0.02); /* 极淡阴影 */
--node-shadow-hover: 0 2px 8px rgba(0,0,0,0.06); /* hover阴影 */
```

**视觉特征**：
- 背景：纯白，没有任何彩色
- 边框：1px #E9E9E7（几乎看不见）
- 圆角：3px（极小）
- 阴影：几乎无

### 3.2 节点结构

```
┌─────────────────────────────────┐
│ 标题栏（深灰文字 + 极淡边框）      │
├─────────────────────────────────┤
│ 内容区（深灰文字）                │
│                                 │
│ 输入框（浅灰边框 + 占位符）       │
└─────────────────────────────────┘
```

**间距系统**：
- 内边距：12px
- 标题栏高度：36px
- 内容区最小高度：48px

### 3.3 节点类型（通过图标区分，不通过颜色）

所有节点使用相同的纯白背景，通过：
- 左侧边框颜色（1-2px）
- 标题栏图标
- 标签颜色

来区分类型，而不是改变节点背景色。

---

## 4. 连线系统（Edge）

### 4.1 连线样式

```css
--edge-color: #D3D1CB;        /* 浅灰 - 默认连线 */
--edge-hover: #2383E2;        /* Notion蓝 - hover连线 */
--edge-selected: #2383E2;     /* Notion蓝 - 选中连线 */
--edge-width: 1.5px;          /* 细线 */
```

**视觉效果**：
- 默认：浅灰色细线
- Hover：变细、变蓝
- 选中：蓝色，略粗

### 4.2 连线类型

- 直线（推荐）：简洁
- 平滑曲线：优雅
- 阶梯线：结构化

避免使用：
- 虚线
- 粗线
- 彩色渐变

---

## 5. Handle系统（连接点）

### 5.1 Handle样式

```css
--handle-color: #D3D1CB;      /* 浅灰 - 默认 */
--handle-hover: #2383E2;      /* Notion蓝 - hover */
--handle-size: 8px;           /* 小圆点 */
--handle-radius: 50%;         /* 圆形 */
```

**视觉效果**：
- 默认：浅灰色小圆点
- Hover：蓝色小圆点，放大到10px
- 位置：节点边缘中心

---

## 6. 工具栏系统（Toolbar）

### 6.1 悬浮工具栏

```css
--toolbar-bg: #FFFFFF;        /* 纯白背景 */
--toolbar-border: #E9E9E7;    /* 极淡边框 */
--toolbar-shadow: 0 4px 16px rgba(0,0,0,0.08); /* 柔和阴影 */
--toolbar-radius: 6px;        /* 小圆角 */
```

### 6.2 工具栏按钮

```css
--button-bg: transparent;     /* 透明背景 */
--button-hover: #F1F1EF;      /* 淡灰hover */
--button-active: #EDEBEB;     /* 中淡灰active */
--button-radius: 3px;         /* 小圆角 */
```

**视觉效果**：
- 默认：透明背景，深灰图标
- Hover：淡灰背景
- Active：深灰背景

---

## 7. 输入框系统（Input）

### 7.1 标准输入框

```css
--input-bg: transparent;      /* 透明背景 */
--input-border: #E9E9E7;      /* 极淡边框 */
--input-hover: #D3D1CB;       /* hover边框 */
--input-focus: #2383E2;       /* Notion蓝focus */
--input-radius: 3px;          /* 小圆角 */
--input-placeholder: #C4C4C4; /* 浅灰占位符 */
```

**视觉效果**：
- 默认：透明背景，极淡边框
- Focus：蓝色边框
- 占位符：浅灰

### 7.2 文本域输入框

```css
--textarea-bg: transparent;
--textarea-border: #E9E9E7;
--textarea-radius: 3px;
--textarea-min-height: 60px;
```

---

## 8. 圆角系统（Radius）

```css
--radius-none: 0px;           /* 直角 */
--radius-sm: 2px;             /* 极小 */
--radius-md: 3px;             /* 小（推荐） */
--radius-lg: 4px;             /* 中 */
--radius-xl: 6px;             /* 大（仅用于工具栏） */
```

**使用规则**：
- 节点：3px
- 按钮：3px
- 输入框：3px
- 工具栏：6px
- 绝不使用 > 8px 的大圆角

---

## 9. 阴影系统（Shadow）

```css
--shadow-none: none;
--shadow-sm: 0 1px 2px rgba(0,0,0,0.02);    /* 极淡 */
--shadow-md: 0 2px 8px rgba(0,0,0,0.06);    /* 淡 */
--shadow-lg: 0 8px 24px rgba(0,0,0,0.12);   /* 中 */
--shadow-xl: 0 12px 32px rgba(0,0,0,0.16);  /* 深（仅用于弹窗） */
```

**使用规则**：
- 节点默认：shadow-sm 或 none
- 节点hover：shadow-md
- 工具栏：shadow-lg
- 弹窗：shadow-xl
- 避免：厚重的彩色阴影

---

## 10. 间距系统（Spacing）

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;   /* 节点内边距 */
--space-4: 16px;   /* 通用间距 */
--space-6: 24px;   /* 大间距 */
--space-8: 32px;   /* 超大间距 */
```

**使用规则**：
- 节点内边距：12px
- 元素间距：8px
- 区域间距：16px
- 页面边距：24px

---

## 11. 字体系统（Typography）

### 11.1 字体家族

```css
--font-sans:
  -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue',
  'PingFang SC', 'Hiragino Sans GB', sans-serif;

--font-serif:
  'Georgia', 'Times New Roman', Times, serif;

--font-mono:
  'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
```

### 11.2 字号

```css
--text-xs: 12px;    /* 标签、说明 */
--text-sm: 13px;    /* 次要文字 */
--text-base: 14px;  /* 正文（Notion默认） */
--text-lg: 16px;    /* 小标题 */
--text-xl: 18px;    /* 标题 */
--text-2xl: 24px;   /* 大标题 */
```

### 11.3 行高

```css
--leading-tight: 1.2;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

**使用规则**：
- 标题：leading-tight (1.2)
- 正文：leading-normal (1.5)
- 说明：leading-relaxed (1.75)

### 11.4 字重

```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
```

**使用规则**：
- 正文：400
- 小标题：500
- 大标题：600
- 绝不使用 > 600

---

## 12. 过渡系统（Transition）

```css
--transition-fast: 150ms ease;
--transition-normal: 200ms ease;
--transition-slow: 300ms ease;
```

**使用规则**：
- Hover：150ms
- 状态切换：200ms
- 动画：300ms

---

## 13. 设计禁忌（❌ 不要做）

1. ❌ **不使用彩色节点背景**：所有节点都是纯白
2. ❌ **不使用渐变**：纯色即可
3. ❌ **不使用发光效果**：极简克制
4. ❌ **不使用厚阴影**：极淡阴影
5. ❌ **不使用大圆角**：最大6px，推荐3px
6. ❌ **不使用纯黑**：最深是 #37352F
7. ❌ **不使用多彩强调**：只有Notion蓝 #2383E2
8. ❌ **不使用复杂的网格**：点阵，极淡
9. ❌ **不使用装饰性元素**：内容优先
10. ❌ **不使用彩色边框**：只有focus时用蓝色

---

## 14. 设计原则（✅ 要做到）

1. ✅ **极简主义**：移除一切不必要的装饰
2. ✅ **内容优先**：大量留白，内容成为焦点
3. ✅ **视觉舒适**：柔和的对比度，不刺眼
4. ✅ **克制设计**：只用一种彩色强调
5. ✅ **一致性**：所有元素遵循相同的设计语言
6. ✅ **层次分明**：通过微妙的差异建立层次
7. ✅ **呼吸感**：充足的留白和间距
8. ✅ **自然交互**：流畅的过渡和反馈
9. ✅ **可读性**：清晰的字体和对比度
10. ✅ **专业感**：精致的细节和平衡

---

## 15. 视觉检查清单

在完成设计后，检查以下问题：

- [ ] 背景是纯白 #FFFFFF 吗？
- [ ] 网格是极淡的点阵吗？
- [ ] 节点背景是纯白吗？
- [ ] 节点边框是极淡灰吗？
- [ ] 文字是深灰 #37352F 而不是黑吗？
- [ ] 强调色只有Notion蓝吗？
- [ ] 圆角在 2-6px 之间吗？
- [ ] 阴影极淡吗？
- [ ] 有足够的留白吗？
- [ ] 整体感觉舒适不刺眼吗？

---

## 16. 设计对比

### ❌ 错误示例（当前问题）

```
背景：深色 + 白色点阵（星空科技风）
节点：淡粉色、淡紫色（卡通卡片风）
边框：厚重的彩色边框
阴影：厚重的彩色阴影
对比：强对比，刺眼
```

### ✅ 正确示例（Notion风格）

```
背景：纯白 + 极淡点阵（几乎看不见）
节点：纯白（极简风）
边框：极淡灰（几乎看不见）
阴影：极淡（几乎看不见）
对比：柔和对比，舒适
```

---

## 17. 实施优先级

### P0 - 必须立即修复
1. 画布背景改为纯白 + 极淡点阵
2. 所有节点改为纯白背景
3. 移除所有彩色节点背景

### P1 - 高优先级
4. 调整文字颜色为深灰
5. 调整边框为极淡灰
6. 调整圆角为3px

### P2 - 中优先级
7. 优化连线样式
8. 优化Handle样式
9. 优化工具栏样式

### P3 - 低优先级
10. 优化动画和过渡
11. 优化细节和间距
12. 完善响应式

---

## 18. 验收标准

### 视觉验收
- [ ] 远看：纯白画布，清晰的节点
- [ ] 近看：极淡的点阵网格，辅助对齐
- [ ] 交互：流畅的hover和focus状态
- [ ] 对比：柔和舒适，不刺眼

### 功能验收
- [ ] 所有功能正常工作
- [ ] 交互反馈及时
- [ ] 性能流畅
- [ ] 无视觉干扰

### 设计验收
- [ ] 符合Notion设计语言
- [ ] 一致性强
- [ ] 专业感足
- [ ] 用户认可

---

**记住**：Notion的精髓不是"好看"，而是"好用"和"舒适"。极简、克制、内容优先，这才是真正的设计美学。
