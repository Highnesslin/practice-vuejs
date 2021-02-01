# 编译器

**Vue**的**模板语法**一直是我个人不太喜欢的部分之一，所以**Vue2**的项目我基本都用**jsx**编写，但**Vue3**的一个变化直接啪啪打我脸，也就是**编译器优化**，**Vue3**充分利用了**编译阶段**，为**虚拟 dom 优化**做了充足准备。这也是**Vue3**中我特别喜欢的一部分

## 编译器原理

在**初始化阶段**的`setupComponent`中有这样一个操作，将 `template` 转为 `render` 函数

```typescript
export function setupComponent(instance) {
  const Component = instance.type
  const { setup } = Component
  if (setup) {
    // ...调用 setup
  }
  if (compile && Component.template && !Component.render) {
  	// 如果没有 render 方法
    // 调用 compile 将 template 转为 render 方法
    Component.render = compile(Component.template, {...})
  }
}
```

`compile`传入**web 平台特有参数**调用`baseCompile`，最终真正做编译器工作的`baseCompile`来自**compiler-core**，我们在**webpack**环境中默认使用的**vue**是不携带**编译器**的`runtime`版本，因为**webpack**借助**vue-loader**对我们写的**单文件**进行解析，提前在**开发环境**做好了**编译工作**，以提高**生产环境**的效率。

核心源码如下

```typescript
export function baseCompile(
  template: string | RootNode,
  options: CompilerOptions = {}
): CodegenResult {
  // 1. parse：将模板转换成AST
  const ast = isString(template) ? baseParse(template, options) : template;
  const [nodeTransforms, directiveTransforms] = getBaseTransformPreset(prefixIdentifiers);

  // 2. transform：将AST中特殊的模板指令和语法转换成js可识别的内容
  transform(
    ast,
    extend({}, options, {
      prefixIdentifiers,
      nodeTransforms: [
        ...nodeTransforms,
        ...(options.nodeTransforms || []), // user transforms
      ],
      directiveTransforms: extend(
        {},
        directiveTransforms,
        options.directiveTransforms || {} // user transforms
      ),
    })
  );

  // 3. generate：生成字符串形式的函数体
  return generate(
    ast,
    extend({}, options, {
      prefixIdentifiers,
    })
  );
}
```

编译器分为三个重要的环节

- **parse**：编译模板，将 **模板** 转化成 **AST**
- **transform**：将**特殊**的**模板指令**和**模板语法**转成 **js** 可识别的内容
- **generate**：将 **AST** 转化为**字符串形式**的**函数体**

  到这里和**Vue2**的**编译器**并没有太大区别

## 编译器优化

### block

记录动态的节点，保存到 **Vnode**的`dynamicChildren`属性中，**diff** 时只操作这里的节点

可以多个

### 静态节点提升

将没有**动态绑定属性**和`ref`的节点看作是**不会变化的 dom**，因此通过`createStaticVNode`创建成**静态节点**，将来**渲染时**通过 `innerHTML` 创建真实节点

```javascript
const hoistStatic = createStaticVNode('<ul><li><li><li><li><li><li><li><li></ul>')

render() {
  return (openBlock(), createBlock('div', null, [
    hoistStatic
  ]))
}
```

从**代码层面**看到相比**Vue2**最明显的变化就是 **VNode 对象减少** 从而节省**内存**和**渲染函数体积**

### 补丁标记（PatchFlags）和动态属性记录

- 概念

  ```typescript
  export const enum PatchFlags {
    // 文本：textContent
    TEXT = 1 /*                             */, // 1
    // className：class
    CLASS = 1 << 1, /*                      */, // 2
    // 样式：style
    STYLE = 1 << 2, /*                      */, // 4
    // props：包含class、style
    PROPS = 1 << 3, /*                      */, // 8
    // 包含key的props
    FULL_PROPS = 1 << 4, /*                 */, // 16
    // 具有事件监听
    HYDRATE_EVENTS = 1 << 5, /*             */, // 32
    // children不会改变的Fragment
    STABLE_FRAGMENT = 1 << 6, /*            */, // 64
    // children有key或者部分有key的Fragment
    KEYED_FRAGMENT = 1 << 7, /*             */, // 128
    // children没有key的Fragment
    UNKEYED_FRAGMENT = 1 << 8, /*           */, // 256
    // 除了props以外需要patch的，比如ref
    NEED_PATCH = 1 << 9, /*                 */, // 512
    // 有动态插槽
    DYNAMIC_SLOTS = 1 << 10, /*             */, // 1024

    // SPECIAL FLAGS -------------------------------------------------------------
    // 静态节点
    HOISTED = -1,
    // diff是否应该结束的标志
    BAIL = -2,
  }
  ```

  通过**按位或**运算可以得到复合属性，比如
  通过 `TEXT | CLASS` 得到 `0000000011`，`0000000011`同时有`TEXT`和`CLASS`二者的特性。

  由于最小的值是`TEXT = 1`，将来得到一个值`TEMP`，如果判断是否有`TEXT`的特性，只需要通过**按位或**运算，即`TEMP & TEXT > 0`是否为`true`

  这种形式在**权限系统** 和 **React**的**事件系统**中都有所使用

- 作用

  - 1\. 在调用 `compile`将 `template` 转成 `render` 时，`patchFlags`会被加到 **Vnode** 的**属性**中，

    like this

    ```javascript
    createVNode('p', { foo: ctx }, null, PatchFlags.PROPS, ['foo']);
    ```

  - 2\. 将来 **patch** 时通过这些**标记**可以只对**动态绑定的内容**进行**diff**

### 缓存事件处理程序
