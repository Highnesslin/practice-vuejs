# 编译器

[预习](https://zhuanlan.zhihu.com/p/181505806)

- 编译发生在哪个阶段
  - 如果是**webpack**环境，则在开发环境下通过**vue-loader**完成编译工作。到了生产环境只保留**vue**的**runtime**文件
  - 如果携带了**compiler**，则组件初始化执行到`setupComponent`时完成编译
- 编译做了哪些事情
  - parse：**获取 AST**，将`template`转成 **AST**
  - transform：**完善 AST** ，将模板中的**特殊指令**和**特殊语法**转成 balabala
  - generate：**生成渲染方法**，将**AST**转成**字符串形式**的**函数**

## 1. parse

### AST

```javascript
export interface BaseElementNode extends Node {
  type: NodeTypes.ELEMENT // 类型，AST的根节点type是0
  ns: Namespace // 命名空间 默认为 HTML，即 0
  tag: string // 标签名
  tagType: ElementTypes // 元素类型
  isSelfClosing: boolean // 是否是自闭合标签 例如 <br/> <hr/>
  props: Array<AttributeNode | DirectiveNode> // props 属性，包含 HTML 属性和指令
  children: TemplateChildNode[] // 子节点
}
```

## 2. transform

经过**transform**的**AST**， `codegenNode`、`helpers` 和 `hoists` 已经被填充上了相应的值。

`codegenNode` 是生成代码要用到的数据，
`hoists` 存储的是静态节点，
`helpers` 存储的是创建 `VNode` 的函数名称（其实是 Symbol）。

### cacheHandlers

### hoistStatic

```javascript
/*#__PURE__*/ _createVNode('div', null, 'good job!', -1 /* HOISTED */);
```

前面的`/*#__PURE__*/`的作用是表明**当前函数**是**纯函数**，用于**tree-shaking**，如果没有使用会被删除掉

### PatchFlags

每个`PatchFlags`有对应的`patch`算法

## 3. generate

代码生成模式有两种，由**标识符**`prefixIdentifiers`决定

1. module
2. function

<!-- -------------------------------------------------------------------------------------------------------- -->

`helpers`是在代码生成时从 **Vue** 引入的一些**函数**，通过 **映射表** `helperNameMap` 在`generate`阶段**取出**

核心源码如下：

```javascript
// 这是 module 模式
`import { ${ast.helpers
  .map(s => `${helperNameMap[s]} as _${helperNameMap[s]}`)
  .join(', ')} } from ${JSON.stringify(runtimeModuleName)}\n`;
```
