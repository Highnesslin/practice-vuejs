# 初始化流程

## createApp

- 作用
  1. 通过`ensureRenderer.createApp`创建 app
  2. 扩展`mount`方法

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

<!-- ------------------------------------------------------------------- -->

createApp => ensureRenderer => (renderer = createRenderer) => baseCreateRenderer:初始化各种渲染函数 => createAppAPI:创建 app 对象
||
扩展 mount

`createAppAPI` 中对 app 对象定义的`mount`方法
创建**虚拟 dom**，然后调用`baseCreateRenderer`中定义的`render`方法
其中创建**虚拟 dom**这一步，初始化时传入的是`options`，所以初始化时**虚拟 dom**的 `type` 是一个对象

然后调用`mount`方法时进行挂载，`mount`首先创建虚拟 dom，然后调用`render`
`render`是渲染相关的方法，所以在`baseCreateRenderer`中定义，负责首次渲染与更新，相当于 vue2 的`vm._update`，所以一共做了两件事情，1.调用`patch`，2.保存**虚拟 dom**用于 `diff` 时使用
`patch`也在`baseCreateRenderer`中定义，

由于传入`patch`的**旧虚拟 dom**为`null`，因此走初始化流程
**新的虚拟 dom**为一个对象，按照**与运算**执行`processComponent`

`patch`内部根据 swtich 直接执行了方法，每个方法自己负责初始化与更新

这里进到`processComponent`中执行`mountComponent`，
中间有个方法`setupComponent(instance)`，这相当于**Vue2**的`this._init`
`setupRenderEffect`

## effect

effect 包括的函数在执行时会触发**getter**，将当前函数收集到依赖中（ps：effect 相当于原来的 Watcher）

## 思考与总结

1. 流程梳理

- 修改响应式的值，触发 `effect` 的回调函数（触发依赖）；
- 再次调用 `render` 函数，获取最新的 `vnode` 值；
- 把新的 vnode 和旧的 vnode ，交给 `patch`；
- `patch` 来基于 vnode 的 **类型** 进行处理具体的 **update** 逻辑；
- 如果是 **component** 类型的话，会做一个 updateComponent() 的处理，检测是否可更新（`shouldUpdateComponent`），如果可以更新的话会再次调用 update；
- 如果是 **element** 类型的话，会调用 `patchElement` 来检测更新；
- 接着就是递归的调用当前组件的 `render`，获取到最新的 **subTree（vnode）**；
- 重复上面的过程。

- 我们稍微隐喻一下，如果是 `component` 类型的话，我们就需要检测要不要开箱，
- 当需要开箱的话，再处理箱子里面的 `element` 或者 `component`，
- 如果是 `component` 那么就重复上面的过程。应该是递归的向下查，截止点就是当前的 `component` 能不能开箱。
- 好，这个流程整理完了，怎么对比细节，我们先不管，先把整个流程在 mini-vue 里面实现一遍，看看有没有逻辑落下。
