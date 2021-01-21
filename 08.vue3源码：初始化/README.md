# 初始化流程

vue3 相对 vue2 是一次重构，分为 **compiler**、**reactivity**、**runtime**，将来在做自定义渲染时只需要基于 **compiler** 和 **runtime** 两个 `core` 模块进行扩展即可
于是就引申出了一个概念：**renderer**，意为**渲染器**，是应用的入口，来自 `runtime` 模块

[初始化](http://shymean.com/article/Vue3%E6%BA%90%E7%A0%81%E8%A7%A3%E6%9E%90%E2%80%94%E2%80%94%E6%95%B4%E4%BD%93%E6%B5%81%E7%A8%8B%E5%92%8C%E7%BB%84%E5%90%88%E5%BC%8FAPI)

## createApp

- 作用
  1. 通过`ensureRenderer.createApp`创建 app
  2. 扩展`$mount`方法

## ensureRenderer

`ensureRenderer`是一个工厂函数，返回`renderer`

## createRenderer => baseCreateRenderer

`baseCreateRenderer`是一个长达 1800 多行的方法，只关注最终的**返回**即可

```javascript
function baseCreateRenderer(
  options: RendererOptions,
  createHydrationFns?: typeof createHydrationFunctions
): any {
  const render: RootRenderFunction = (vnode, container) => {
    if (vnode == null) {
      if (container._vnode) {
        unmount(container._vnode, null, null, true);
      }
    } else {
      // 初始化走这里，这里就类似vue2
      // 参数1不存在则走初始化流程
      // 参数1存在则更新流程
      patch(container._vnode || null, vnode, container);
    }
    flushPostFlushCbs();
    container._vnode = vnode;
  };

  const patch: PatchFn = (
    n1, // 老虚拟dom
    n2, // 新虚拟dom
    container,
    anchor = null,
    parentComponent = null,
    parentSuspense = null,
    isSVG = false,
    optimized = false
  ) => {...};

  return {
    render,
    hydrate,
    createApp: createAppAPI(render, hydrate),
  };
}
```

`render`方法类似于**vue2**的`vm._update`，负责初始化和更新，内部调用 `patch` 方法将**虚拟 dom** 转成**真实 dom**，然后将当前**虚拟 dom** 保存，用于下次 **diff** 使用

## createAppAPI

在这里创建了 app 对象，也就是 vue，包括实例上的所有方法（use mixin component directive mount unmount provide）
vue2 的全局方法都变成了实例方法

到这里`createApp`方法中的**app 对象**就创建出来了
因为`createApp`创建完**app**对象接下来就是扩展`mount`方法，所以要特别关注初始化时的`mount`方法

```javascript
function createAppAPI<HostElement>(
  render: RootRenderFunction,
  hydrate?: RootHydrateFunction
): CreateAppFunction<HostElement> {
    return function createApp(rootComponent, rootProps = null) {
        mount(rootContainer: HostElement, isHydrate?: boolean): any {
            if (!isMounted) {
                // 初始化虚拟dom树
                const vnode = createVNode(
                    rootComponent as ConcreteComponent,
                    rootProps
                )

                if (isHydrate && hydrate) {
                    // 服务端渲染
                    hydrate(vnode as VNode<Node, Element>, rootContainer as any)
                } else {
                    // 客户端渲染
                    render(vnode, rootContainer)
                }
                isMounted = true

                return vnode.component!.proxy
            }
        },
    }
}
```

初始化时的`mount`方法：创建**虚拟 dom**，然后执行`render`，刚才已整理，`render`相当于**vue2**的`_update`，最终是调用`patch`将**虚拟 dom**转成**真实 dom**

`patch`和`render`都来自`baseCreateRenderer`

```javascript
const patch: PatchFn = (
    n1, // 老虚拟dom
    n2, // 新虚拟dom
    container,
    anchor = null,
    parentComponent = null,
    parentSuspense = null,
    isSVG = false,
    optimized = false
  ) => {
    // patching & not same type, unmount old tree
    if (n1 && !isSameVNodeType(n1, n2)) {
      anchor = getNextHostNode(n1)
      unmount(n1, parentComponent, parentSuspense, true)
      n1 = null
    }

    if (n2.patchFlag === PatchFlags.BAIL) {
      optimized = false
      n2.dynamicChildren = null
    }

    // 获取新节点类型
    const { type, ref, shapeFlag } = n2
    switch (type) {
      case Text:
        processText(n1, n2, container, anchor)
        break
      case Comment:
        processCommentNode(n1, n2, container, anchor)
        break
      case Static:
        if (n1 == null) {
          mountStaticNode(n2, container, anchor, isSVG)
        } else if (__DEV__) {
          patchStaticNode(n1, n2, container, isSVG)
        }
        break
      case Fragment:
        processFragment(
          n1,
          n2,
          container,
          anchor,
          parentComponent,
          parentSuspense,
          isSVG,
          optimized
        )
        break
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(
            n1,
            n2,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            isSVG,
            optimized
          )
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
          // 初始化走这里
          processComponent(
            n1,
            n2,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            isSVG,
            optimized
          )
        } else if (shapeFlag & ShapeFlags.TELEPORT) {
          ;(type as typeof TeleportImpl).process(
            n1 as TeleportVNode,
            n2 as TeleportVNode,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            isSVG,
            optimized,
            internals
          )
        } else if (__FEATURE_SUSPENSE__ && shapeFlag & ShapeFlags.SUSPENSE) {
          ;(type as typeof SuspenseImpl).process(
            n1,
            n2,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            isSVG,
            optimized,
            internals
          )
        } else if (__DEV__) {
          warn('Invalid VNode type:', type, `(${typeof type})`)
        }
    }

    // set ref
    if (ref != null && parentComponent) {
      setRef(ref, n1 && n1.ref, parentComponent, parentSuspense, n2)
    }
  }
```

## 思考与总结

1. `renderer`包含三部分
   - 1. render
   - 2. hydrate
   - 3. createApp
