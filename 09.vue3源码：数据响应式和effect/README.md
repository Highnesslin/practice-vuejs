# 数据响应式

[预习](https://www.mk2048.com/blog/blog_hjabaiii1aaaa.html)
在**Vue2**中，**数据响应式**存在以下几个小缺陷：

1. 对于**动态添加或删除**的 key 需要额外的**api（Vue.set/Vue.delete）**解决
2. **数组**响应式需要单独一套逻辑处理
3. 初始化时**深层递归**，效率相对低一些
4. 无法监听新的数据结构 `Map`、`Set`

**Vue3** 重写 **响应式原理**，解决了这些问题，速度提升一倍，内存占以前的 1/2

主要改动如下：

1. 用 `proxy` 代替 `Object.defineProperty`
2. 优化了原本的发布订阅模型，去除 `Observer`、`Watcher`、`Dep`，改用简洁的 `reactive`、`effect`、`targetMap`

   - `track`: 用于追踪依赖
   - `trigger`: 用于触发依赖
   - `targetMap`: 相当于发布订阅中心，以**树结构**管理对象、key 与依赖之间的关系

## 从源码探究过程

回顾**初始化**阶段，我们发现**Vue3**并没有像**Vue2**那样直接进行**初始化**，而是在**组件挂载**时完成这件事，**初始化时**在方法`setupStatefulComponent`中完成**数据响应式**
，追根溯源后发现都是调用了`reactive`方法，

### reactive [/packages/reactivity/src/reactive.ts](https://github.com/vuejs/vue-next/blob/master/packages/reactivity/src/reactive.ts#L85)

- 作用
  - 创建响应式对象
- 核心源码
  ```typescript
  function reactive(target: object) {
    // if trying to observe a readonly proxy, return the readonly version.
    if (target && (target as Target)[ReactiveFlags.IS_READONLY]) {
      return target;
    }
    return createReactiveObject(target, false, mutableHandlers, mutableCollectionHandlers);
  }
  ```
  除了具有**只读属性**的对象，其他对象都会执行**响应式处理**

### createReactiveObject [/packages/reactivity/src/reactive.ts](https://github.com/vuejs/vue-next/blob/master/packages/reactivity/src/reactive.ts#L166)

- 作用
- 核心源码

  ```typescript
  function createReactiveObject(
    target: Target,
    isReadonly: boolean,
    baseHandlers: ProxyHandler<any>,
    collectionHandlers: ProxyHandler<any>
  ) {
    // 1. 如果是 只读属性或者代理，则直接返回
    if (target[ReactiveFlags.RAW] && !(isReadonly && target[ReactiveFlags.IS_REACTIVE])) {
      return target;
    }
    // 2. 如果已经是响应式对象了，则直接返回
    const proxyMap = isReadonly ? readonlyMap : reactiveMap;
    const existingProxy = proxyMap.get(target);
    if (existingProxy) {
      return existingProxy;
    }
    // 3. 创建响应式对象
    const proxy = new Proxy(
      target,
      targetType === TargetType.COLLECTION ? collectionHandlers : baseHandlers
    );
    proxyMap.set(target, proxy);
    return proxy;
  }
  ```

  根据`target`是 `Set、Map` 还是 **普通对象** 来决定使用哪一种 `handler`

  如果是**普通对象（包括数组）**则使用`baseHandlers`，也就是`mutableHandlers`

### mutableHandlers [/packages/reactivity/src/baseHandlers.ts](https://github.com/vuejs/vue-next/blob/master/packages/reactivity/src/baseHandlers.ts#L187)

- 作用
  - 定义响应式的拦截方法
    - `getter`触发依赖收集和定义子元素的响应式
    - `setter`触发依赖更新
- 简化后的核心源码如下

  ```typescript
    const get = function get(target: Target, key: string | symbol, receiver: object) {
    // 已经是响应式对象、只读等边缘情况的处理
    ...
    // 1. 数组
    const targetIsArray = isArray(target);

    if (!isReadonly && targetIsArray && hasOwn(arrayInstrumentations, key)) {
      return Reflect.get(arrayInstrumentations, key, receiver);
    }

    // 2. 对象
    const res = Reflect.get(target, key, receiver);

    // 3. 依赖追踪
    track(target, TrackOpTypes.GET, key);

    // 4. 如果是对象，则继续观察
    if (isObject(res)) {
      // Convert returned value into a proxy as well. we do the isObject check
      // here to avoid invalid value warning. Also need to lazy access readonly
      // and reactive here to avoid circular dependency.
      return reactive(res);
    }

    // 5. 返回
    return res;
  };

  const set = function set(
    target: object,
    key: string | symbol,
    value: unknown,
    receiver: object
  ): boolean {
    const oldValue = (target as any)[key];
    // 边缘情况的判断
    ...

    const hadKey =
      isArray(target) && isIntegerKey(key) ? Number(key) < target.length : hasOwn(target, key);

    const result = Reflect.set(target, key, value, receiver);

    // 如果目标是原型链中的内容则不要触发依赖更新
    if (target === toRaw(receiver)) {
      // 依赖更新
      if (!hadKey) {
        trigger(target, TriggerOpTypes.ADD, key, value);
      } else if (hasChanged(value, oldValue)) {
        trigger(target, TriggerOpTypes.SET, key, value, oldValue);
      }
    }
    return result;
  };

  function deleteProperty(target: object, key: string | symbol): boolean {
    const hadKey = hasOwn(target, key);
    const oldValue = (target as any)[key];
    const result = Reflect.deleteProperty(target, key);
    if (result && hadKey) {
      trigger(target, TriggerOpTypes.DELETE, key, undefined, oldValue);
    }
    return result;
  }

  // in 操作符的捕捉器。
  function has(target: object, key: string | symbol): boolean {
    const result = Reflect.has(target, key);
    if (!isSymbol(key) || !builtInSymbols.has(key)) {
      track(target, TrackOpTypes.HAS, key);
    }
    return result;
  }

  // Object.getOwnPropertyNames 方法和 Object.getOwnPropertySymbols 方法的捕捉器。
  function ownKeys(target: object): (string | number | symbol)[] {
    track(target, TrackOpTypes.ITERATE, isArray(target) ? 'length' : ITERATE_KEY);
    return Reflect.ownKeys(target);
  }

  export const mutableHandlers: ProxyHandler<object> = {
    get,
    set,
    deleteProperty,
    has,
    ownKeys,
  };
  ```

  `track`负责**依赖收集**，`trigger`负责**触发依赖**。
  在**proxy**中有三种方法可以拦截**getter**，分别是`get`、`has`和`ownKeys`，有两种方法可以拦截**setter**，分别是`set`和`deleteProperty`。
  与**Vue2**不同的是，**Vue3**的**数据侦听**改用**懒执行**方式，即只有调用了`getter`方法才会继续**侦听**，有效降低了**首次**执行的**时间**。

### targetMap

- 定义

```typescript
const targetMap = new WeakMap<any, KeyToDepMap>();
```

发布订阅中心，是一个**Map 结构**，以**树结构**管理 **各个对象**、**对象的 key**、**key 对应的 effect**的关系
// todo 画一个图表示三者关系

### activeEffect

- 定义

```typescript
let activeEffect: ReactiveEffect | undefined;
```

是一个**全局变量**，用于临时保存**副作用函数**，本质还是一个**副作用函数**，还记得吗，该变量在**effect**模块也专门整理过

### track [/packages/reactivity/src/effect.ts](https://github.com/vuejs/vue-next/blob/master/packages/reactivity/src/effect.ts#L141)

- 作用
  - 收集依赖
- 核心源码

  ```typescript
  export function track(target: object, type: TrackOpTypes, key: unknown) {
    // 源码中有暂停收集和继续收集的两个方法，这里是没有暂停的标志
    // 全局变量activeEffect是在instance.update或用户手动设置的副作用函数
    if (!shouldTrack || activeEffect === undefined) {
      return;
    }
    // 从发布订阅中心取出对象所有的key
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()));
    }
    // 去除对象key的所有依赖effect
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, (dep = new Set()));
    }
    if (!dep.has(activeEffect)) {
      dep.add(activeEffect);
      activeEffect.deps.push(dep);
    }
  }
  ```

  **收集依赖**是同样是**双向操作**，

  **发布订阅中心** **targetMap**收集**effect 函数**，**effect 函数**也需要引用当前`key`依赖的所有**effect 函数**，用于将来触发`deleteProperty`时解除引用。

### trigger [/packages/reactivity/src/effect.ts](https://github.com/vuejs/vue-next/blob/master/packages/reactivity/src/effect.ts#L167)

- 作用
  - 触发依赖
- 核心源码

  ```typescript
  export function trigger(
    target: object,
    type: TriggerOpTypes,
    key?: unknown,
    newValue?: unknown,
    oldValue?: unknown
  ) {
    const depsMap = targetMap.get(target);
    if (!depsMap) {
      // never been tracked
      return;
    }

    const effects = new Set<ReactiveEffect>();
    // 添加副作用函数
    const add = (effectsToAdd: Set<ReactiveEffect> | undefined) => {
      if (effectsToAdd) {
        effectsToAdd.forEach(effect => {
          if (effect !== activeEffect || effect.allowRecurse) {
            effects.add(effect);
          }
        });
      }
    };


    // 根据type和key找到需要处理的depsMap，这里处理边缘情况，最终执行ADD、DELETE、SET将depsMap中的内容添加到effects中
    ...

    // 首次渲染和异步更新
    const run = (effect: ReactiveEffect) => {
      if (effect.options.scheduler) {
        effect.options.scheduler(effect);
      } else {
        effect();
      }
    };

    // 遍历副作用函数并执行
    effects.forEach(run);
  }
  ```

  原本这里的代码有很多，但取出**核心逻辑**立刻就轻量了许多。

  核心内容就是根据**触发依赖**的**类型（`ADD`、`DELETE`或`SET`）**和`key`执行`add`方法，将依赖的**副作用函数**放到`effects`中，然后根据**首次渲染**或**异步更新**选择不同的处理方式。

## 流程概述

1. 初始化时创建**响应式对象**，建立 `getter`、`setter` 拦截，`getter`负责收集依赖，`setter`负责触发依赖
2. **渲染时**调用**组件级**的`effect`方法，将组件的**render 函数**赋值给**全局变量**`activeEffect`并执行，**render 函数**触发对应`key`的`getter`函数，完成**依赖收集**
3. 当用户再次触发了`key`的**setter**方法，从`targetMap`中取出对应的**依赖函数**，然后执行`trigger`方法**触发依赖** 完成更新

## 思考与总结

1. **Vue3**的数据响应式那么多优点，有缺点吗？<br>
   **新的数据响应式**方案不仅效率高，还可以完成**13 个 api 的拦截**，但缺点是不兼容低版本浏览器`proxy`，尤其是**IE**，不过都**1202**年了，还有人用**IE**嘛。。。
   哈哈哈开玩笑~

2. 为什么要用`Reflect`？<br>
   我的理解是，`Reflect`和`Proxy`相辅相成，只要`proxy`对象上有的方法`reflect`也拥有。而使用`Reflect`其实是一种是安全措施，保证操作的是**原对象**

3. 为什么需要互相引用？<br>
   这一点和**Vue2**很像，**Vue2**的**dep**和**Watcher**也是互相引用，当**删除 key**时会**解除**二者的**引用关系**。

   **Vue3**同样考虑到这一点，**删除 key**时需要解除**effect 函数**与**targetMap 中 key 的依赖函数**的 关系
