new Vue => createApp
$mount => mount
链式调用

多模块架构

浏览器用的是 umd
node 用的是 cjs/global/iife
自调函数 iife

webpack 使用的 esm

createApp => ensureRenderer => createRenderer

初始化 processComponent

setupComponet 相当于 原来 的 `_init`

setup > data

setRenderEffect 虚拟 dom => 真实 dom

渲染器包含三个方法
render
hydrate
createApp

## 开始

apiCreateApp.ts createAppApI render

ctx 是原对象
proxy 是响应式对象

初始化时 tag 是根组件

依赖注入 控制反转

## 笔记

### createApp

- ensureRenderer
- 扩展$mount

```javascript
const createApp = ((...args) => {
    const app = ensureRenderer().createApp(...args);
    const { mount } = app;
    app.mount = (containerOrSelector: Element | string): any => {
        const container = normalizeContainer(containerOrSelector);
        if (!container) return;
        const component = app._component;
        if (!isFunction(component) && !component.render && !component.template) {
            component.template = container.innerHTML;
        }
        // clear content before mounting
        container.innerHTML = '';
        const proxy = mount(container);
        container.removeAttribute('v-cloak');
        container.setAttribute('data-v-app', '');
        return proxy;
    };

    return app;
}
```

### ensureRenderer => createRenderer => baseCreateRenderer(1800 行源码)

```javascript
return {
  render, // 渲染方法，render(vnode, container)
  hydrate, // 注水，用于服务端渲染
  createApp: createAppAPI(render, hydrate),
};
```

### createAppAPI 工厂函数

- 作用
  1. mount 方法：初始化调用 render 方法
- 核心源码

```javascript
const render: RootRenderFunction = (vnode, container) => {
    if (vnode == null) {
      if (container._vnode) {
        unmount(container._vnode, null, null, true)
      }
    } else {
      // 初始化走这里，这里就类似vue2
      // 参数1不存在则走初始化流程
      // 参数1存在则更新流程
      patch(container._vnode || null, vnode, container)
    }
    flushPostFlushCbs()
    container._vnode = vnode
}
function createAppAPI<HostElement>(
  render: RootRenderFunction,
  hydrate?: RootHydrateFunction
): CreateAppFunction<HostElement> {
  // 外面返回的方法
  return function createApp(rootComponent, rootProps = null) {
    // 应用程序实例
    const app: App = (context.app = {

      use(plugin: Plugin, ...options: any[]) {
        // ...
        return app
      },

      mixin(mixin: ComponentOptions) {
        // ...
        return app
      },

      component(name: string, component?: Component): any {
        // ...
        return app
      },

      directive(name: string, directive?: Directive) {
        // ...
        return app
      },
      // 初始化
      mount(rootContainer: HostElement, isHydrate?: boolean): any {
        if (!isMounted) {
          // 初始化虚拟dom树
          const vnode = createVNode(
            rootComponent as ConcreteComponent,
            rootProps
          )
          // store app context on the root VNode.
          // this will be set on the root instance on initial mount.
          vnode.appContext = context

          // HMR root reload
          if (__DEV__) {
            context.reload = () => {
              render(cloneVNode(vnode), rootContainer)
            }
          }

          if (isHydrate && hydrate) {
            hydrate(vnode as VNode<Node, Element>, rootContainer as any)
          } else {
            // 客户端渲染，默认走这里
            render(vnode, rootContainer)
          }
          isMounted = true
          app._container = rootContainer
          // for devtools and telemetry
          ;(rootContainer as any).__vue_app__ = app

          if (__DEV__ || __FEATURE_PROD_DEVTOOLS__) {
            devtoolsInitApp(app, version)
          }

          return vnode.component!.proxy
        } else if (__DEV__) {
          warn(
            `App has already been mounted.\n` +
              `If you want to remount the same app, move your app creation logic ` +
              `into a factory function and create fresh app instances for each ` +
              `mount - e.g. \`const createMyApp = () => createApp(App)\``
          )
        }
      },

      unmount() {
        if (isMounted) {
          render(null, app._container)
          if (__DEV__ || __FEATURE_PROD_DEVTOOLS__) {
            devtoolsUnmountApp(app)
          }
        } else if (__DEV__) {
          warn(`Cannot unmount an app that is not mounted.`)
        }
      },

      provide(key, value) {
        // ...
        return app
      }
    })

    return app
  }
}
```

ensureRenderer => createRenderer => baseCreateRenderer => 返回{render,hydrate,createApp}
`createApp` 通过 `createAppApI` 创建
app => mount => render => patch => processComponent => mountComponent => setupComponent
