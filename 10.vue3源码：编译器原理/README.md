# 编译器

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

编译器分为三个重要的环节

- **parse**：编译模板，将 **模板** 转化成 **AST**
- **transform**：将**特殊**的**模板指令**和**模板语法**转成 **js** 可识别的内容
- **generate**：将 **AST** 转化为可执行的代码；

## compile

- 作用
  - 经过**parse**、**transfer**、**generate**三个环节生成**字符串形式**的**函数体**
- 核心源码

  ```typescript
  export function baseCompile(
    template: string | RootNode,
    options: CompilerOptions = {}
  ): CodegenResult {
    const onError = options.onError || defaultOnError;
    const isModuleMode = options.mode === 'module';
    /* istanbul ignore if */
    if (__BROWSER__) {
      if (options.prefixIdentifiers === true) {
        onError(createCompilerError(ErrorCodes.X_PREFIX_ID_NOT_SUPPORTED));
      } else if (isModuleMode) {
        onError(createCompilerError(ErrorCodes.X_MODULE_MODE_NOT_SUPPORTED));
      }
    }

    const prefixIdentifiers = !__BROWSER__ && (options.prefixIdentifiers === true || isModuleMode);
    if (!prefixIdentifiers && options.cacheHandlers) {
      onError(createCompilerError(ErrorCodes.X_CACHE_HANDLER_NOT_SUPPORTED));
    }
    if (options.scopeId && !isModuleMode) {
      onError(createCompilerError(ErrorCodes.X_SCOPE_ID_NOT_SUPPORTED));
    }

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

  到这里和**Vue2**的**编译器**并没有太大区别

### parse

### transform [packages/compiler-core/src/transform.ts]()

```typescript
export function transform(root: RootNode, options: TransformOptions) {
  const context = createTransformContext(root, options);
  traverseNode(root, context);
  if (options.hoistStatic) {
    hoistStatic(root, context);
  }
  if (!options.ssr) {
    createRootCodegen(root, context);
  }
  // finalize meta information
  root.helpers = [...context.helpers];
  root.components = [...context.components];
  root.directives = [...context.directives];
  root.imports = [...context.imports];
  root.hoists = context.hoists;
  root.temps = context.temps;
  root.cached = context.cached;
}

function createRootCodegen(root: RootNode, context: TransformContext) {
  const { helper } = context;
  const { children } = root;
  if (children.length === 1) {
    const child = children[0];
    // if the single child is an element, turn it into a block.
    if (isSingleElementRoot(root, child) && child.codegenNode) {
      // single element root is never hoisted so codegenNode will never be
      // SimpleExpressionNode
      const codegenNode = child.codegenNode;
      if (codegenNode.type === NodeTypes.VNODE_CALL) {
        codegenNode.isBlock = true;
        helper(OPEN_BLOCK);
        helper(CREATE_BLOCK);
      }
      root.codegenNode = codegenNode;
    } else {
      // - single <slot/>, IfNode, ForNode: already blocks.
      // - single text node: always patched.
      // root codegen falls through via genNode()
      root.codegenNode = child;
    }
  } else if (children.length > 1) {
    // root has multiple nodes - return a fragment block.
    let patchFlag = PatchFlags.STABLE_FRAGMENT;
    let patchFlagText = PatchFlagNames[PatchFlags.STABLE_FRAGMENT];
    // check if the fragment actually contains a single valid child with
    // the rest being comments
    if (__DEV__ && children.filter(c => c.type !== NodeTypes.COMMENT).length === 1) {
      patchFlag |= PatchFlags.DEV_ROOT_FRAGMENT;
      patchFlagText += `, ${PatchFlagNames[PatchFlags.DEV_ROOT_FRAGMENT]}`;
    }
    root.codegenNode = createVNodeCall(
      context,
      helper(FRAGMENT),
      undefined,
      root.children,
      patchFlag + (__DEV__ ? ` /* ${patchFlagText} */` : ``),
      undefined,
      undefined,
      true
    );
  } else {
    // no children = noop. codegen will return null.
  }
}
```
