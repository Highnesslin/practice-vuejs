# 副作用函数：effect

## activeEffect

- 定义

```typescript
let activeEffect: ReactiveEffect | undefined;
```

是一个**全局变量**，用于临时保存**副作用函数**，本质还是一个**副作用函数**，该变量在**数据响应式**模块也会使用

## effectStack

- 定义

```typescript
const effectStack: ReactiveEffect[] = [];
```

该**栈（其实是数组）**存储的是多个`activeEffect`，

## effect [/packages/reactivity/src/effect.ts](https://github.com/vuejs/vue-next/blob/master/packages/reactivity/src/effect.ts#L55)

- 作用
  - 创建副作用函数，执行时完成**依赖收集**
- 核心源码

  ```typescript
  export function effect<T = any>(
    fn: () => T,
    options: ReactiveEffectOptions = EMPTY_OBJ
  ): ReactiveEffect<T> {
    if (isEffect(fn)) {
      fn = fn.raw;
    }
    const effect = createReactiveEffect(fn, options);
    if (!options.lazy) {
      effect();
    }
    return effect;
  }

  function createReactiveEffect<T = any>(
    fn: () => T,
    options: ReactiveEffectOptions
  ): ReactiveEffect<T> {
    const effect = function reactiveEffect(): unknown {
      if (!effect.active) {
        return options.scheduler ? undefined : fn();
      }
      if (!effectStack.includes(effect)) {
        cleanup(effect);
        try {
          enableTracking();
          effectStack.push(effect);
          activeEffect = effect;
          return fn();
        } finally {
          effectStack.pop();
          resetTracking();
          activeEffect = effectStack[effectStack.length - 1];
        }
      }
    } as ReactiveEffect;
    effect.id = uid++;
    effect.allowRecurse = !!options.allowRecurse;
    effect._isEffect = true;
    effect.active = true;
    effect.raw = fn;
    effect.deps = [];
    effect.options = options;
    return effect;
  }
  ```

真正的**effect 函数**来自`createReactiveEffect`，执行**effect 函数**时，首先将自己添加给`effectStack`，然后赋值给`activeEffect`，接着执行**副作用函数**`fn`，一般这里面都会调用**响应式数据**，从而触发`key`的`getter`方法调用`track`将**effect 函数**加到 `targetMap` **对应对象** 的 `key` 的 **依赖数组** 中

或许你也会疑惑，`activeEffect`用于临时存储当前**effect 函数**我明白，但是为什么还要保存到`effectStack`这个栈结构中呢？

栈的特点是先进后出，也就是后进入的**effect 函数**先执行，
