# 数据响应式

[预习](https://www.mk2048.com/blog/blog_hjabaiii1aaaa.html)
在**Vue2**中，**数据响应式**存在以下几个小缺陷：

1. 对于**动态添加或删除**的 key 需要额外的**api（Vue.set/Vue.delete）**解决
2. **数组**响应式需要单独一套逻辑处理
3. 初始化时**深层递归**，效率相对低一些
4. 无法监听新的数据结构 `Map`、`Set`

**Vue3** 重写 **响应式原理**，解决了这些问题，速度提升一倍，内存占以前的 1/2，但缺点是兼容性不太好

主要改动如下：

1. 用 `proxy` 代替 `Object.defineProperty`
2. 优化了原本的发布订阅模型，去除 `Observer`、`Watcher`、`Dep`，改用简洁的 `reactive`、`effect`、`targetMap`

   - `track`: 用于追踪依赖
   - `trigger`: 用于触发依赖
   - `targetMap`: 相当于发布订阅中心，以**树结构**管理对象、key 与依赖之间的关系

## 从源码探究过程

回顾**初始化**阶段发现并没有像**Vue2**那样直接调用执行**数据响应式**的方法，而是在**组件挂载**时做这些事，即在`mountComponent`方法中

通过`setupComponent`进行**实例的初始化**，其中包括**数据响应式**，核心源码如下：

```javascript
function setupComponent(instance: ComponentInternalInstance, isSSR = false) {
  isInSSRComponentSetup = isSSR;

  const { props, children, shapeFlag } = instance.vnode;
  const isStateful = shapeFlag & ShapeFlags.STATEFUL_COMPONENT;
  // 初始化props
  initProps(instance, props, isStateful, isSSR);
  // 初始化插槽
  initSlots(instance, children);

  // 数据响应式
  const setupResult = isStateful ? setupStatefulComponent(instance, isSSR) : undefined;

  isInSSRComponentSetup = false;
  return setupResult;
}
```

**实例**的初始化就类似**Vue2**的`_init`方法，首先`mergeOptions`、然后定义实例属性、事件、处理插槽，最后通过`setupStatefulComponent`方法完成**数据响应式**

### setupStatefulComponent [/packages/runtime-core/src/component.ts](https://github.com/vuejs/vue-next/blob/master/packages/runtime-core/src/component.ts#L538)

finishComponentSetup applyOptions dataOptions resolveData reactive

- 核心源码

```typescript
function setupStatefulComponent(instance: ComponentInternalInstance, isSSR: boolean) {
   // createApp的配置对象
  const Component = instance.type as ComponentOptions;

  // 0. create render proxy property access cache
  instance.accessCache = Object.create(null);

  // 1. render函数的上下文，这里完成数据响应式
  instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers);

  // 2. 处理setup函数
  const { setup } = Component;
  if (setup) {
    const setupContext = (instance.setupContext =
      setup.length > 1 ? createSetupContext(instance) : null);

    currentInstance = instance;
    pauseTracking();
    const setupResult = callWithErrorHandling(setup, instance, ErrorCodes.SETUP_FUNCTION, [
      __DEV__ ? shallowReadonly(instance.props) : instance.props,
      setupContext,
    ]);
    resetTracking();
    currentInstance = null;

    if (isPromise(setupResult)) {
      if (isSSR) {
        ...
      } else if (__FEATURE_SUSPENSE__) {
        // async setup returned Promise.
        // bail here and wait for re-entry.
        instance.asyncDep = setupResult;
      }
    } else {
       // 最终也会执行finishComponentSetup
      handleSetupResult(instance, setupResult, isSSR);
    }
  } else {
    finishComponentSetup(instance, isSSR);
  }
}
```

`handleSetupResult` 是没有设置`setup`的情况，最终也会执行`finishComponentSetup`

## 流程概述

1. 初始化时创建**响应式对象**，建立 `getter`、`setter` 拦截，`getter`负责收集依赖，`setter`负责触发依赖
2. **渲染时**调用**组件级**的`effect`方法，

##

缺点

1. 动态添加
2. 数组
3. 初始化时深层递归，速度慢
4. 无法监听 Map、Set

新的响应式原理
13 个 api 的拦截
速度提升一倍，内存占以前的 1/2

缺点：兼容性

- set
- get
- deleteProperty

`Reflect`是安全措施，保证操作的是原对象

vue2 的更新策略使得存在大量闭包关系
