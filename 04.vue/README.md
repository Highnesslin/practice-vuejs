# 文件有好多版本，有什么区别，我们看源码看哪个

runtime：运行时，不包含编译器
common：cjs 规范，用于**webpack1**环境
esm：ES 模块，用于**webpack2+**环境
umd：兼容 cjs 和 amd，用于浏览器

由于这里是**webpack**环境，**webpack**借助**vue-loader**就提前完成了编译工作，因此不需要 `vue` 的编译器模块，
而且 vue 需要支持 webpack 环境，因此我们查看源码时需要的是 `runtime.esm` 版本

# 源码结构

- src
  - compiler 编译器相关
  - core 核心代码
    - components 通用组件，如 `keep-alive`
    - global-api 全局 **api**，如`$set`、`$delete`
    - instance 构造函数等
    - observer 响应式相关
    - util
    - vdom **虚拟 dom**

# 初始化流程

## debug 过程

### 入口

说到初始化，就要从`new Vue`入手，让我们看一看，new Vue 到底发生肾摸事了

1. 首先进入`src/core/instance/index.js`

   主要作用：定义**Vue**构造器，**Vue**实例`API`

   核心代码：

   ```javascript
   initMixin(Vue); // 初始化 this._init 方法
   // 我们熟悉的其他实例属性和方法由下面这些混入
   stateMixin(Vue);
   eventsMixin(Vue);
   lifecycleMixin(Vue);
   renderMixin(Vue);
   ```

2. 然后来到`core/instance/init.js`中
   主要作用：执行 `this._init`

   到这里是 `new Vue` 代码层面的主要部分，那么重点自然而然都在`this._init`里面咯

## 执行 `this._init` 主要做了哪些事情？

主要作用：

1. 挂载一些属性、事件、执行生命周期
2. 调用`$mount`最终完成**渲染组件**

核心代码：

```javascript
vm.$options = mergeOptions(resolveConstructorOptions(vm.constructor), options || {}, vm);
initLifecycle(vm); // 实例属性：$parent,$root,$children,$refs
initEvents(vm); // 自定义事件处理
initRender(vm); // 插槽解析，$slots,$scopeSlots,  $createElement()
callHook(vm, 'beforeCreate');
// 接下来都是和组件状态相关的数据操作
// inject/provide
initInjections(vm); // 注入祖辈传递下来的数据
initState(vm); // 数据响应式：props,methods,data,computed,watch
initProvide(vm); // 提供给后代，用来隔代传递参数
callHook(vm, 'created');

// 如果设置了 el，则自动执行$mount()
if (vm.$options.el) {
  vm.$mount(vm.$options.el);
}
```

### `$mount`(`/src/platforms/web/entry-runtime-with-compiler.js`)

既然是`compiler`模块的内容，想到应该和**编译**有关
继续向里看，发现该方法将`template`转换成`render`函数，这里 template 有两种情况，字符串或 dom，然后继续向下调用

接下来的操作差点直接把我劝退了，函数最后又调用了另外一个`$mount`

### `$mount`(`/src/platforms/web/runtime/index.js`)

看路径发现，原来刚才是**编译器**的`$mount`，而这里是**运行时**的`$mount`

这个`$mount`只做了一件很重要的事情，调用`mountComponent`，听名字看来是要**挂载组件**，果不其然，该方法的核心做了两件事情，赋值更新函数和创建观察者，至此，组件的挂载工作结束，层次如此清晰，看来是有 bear 来

继续深入

1. 给`updateComponent`赋值`_update`函数

   ```javascript
   updateComponent = () => {
     vm._update(vm._render(), hydrating);
   };
   ```

   `_update`函数是何物？
   其作用是 将 **虚拟 dom** 转换为 **真实 dom**
   也就是执行初始化或更新，初始化时执行的是 dom 创建操作

2. 创建 render Watcher

   前面只是赋值，只有这里是实际操作，那么更新流程应该就在这里了，`new Watcher` 做了哪些事情呢？

   ```javascript
   new Watcher(
     vm,
     updateComponent,
     noop,
     {
       before() {
         if (vm._isMounted && !vm._isDestroyed) {
           callHook(vm, 'beforeUpdate');
         }
       },
     },
     true /* isRenderWatcher */
   );
   ```

   `updateComponent`作为第二个参数传入

   深入 Watcher 发现，其构造过程执行了`updateComponent`函数，`updateComponent`函数在上面已经有赋值

   ```javascript
   updateComponent = () => {
     vm._update(vm._render(), hydrating);
   };
   ```

   到这里执行了`_update`函数，

   `_update`的作用上面已讲，将`虚拟dom`转成`真实dom`

   那么**虚拟 dom**从何而来呢？这里看到`_update`接收 `_render`函数作为参数，`_render`函数 将`template`转成`虚拟dom`，

3. 神奇的`_update`函数

   ```javascript
   if (!prevVnode) {
     // initial render
     vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */);
   } else {
     // updates
     vm.$el = vm.__patch__(prevVnode, vnode);
   }
   ```

   可以看到，最终都执行了`__patch__`函数，这个函数的下次再讨论吧，

## 流程概览

```
new Vue() => this._init() => this.$mount() => 最终执行mountComponent() => 给updateComponent赋值_update和_render函数 => new Watcher() => 执行updateComponent
                      compiler+runtime两个版本的$mount

```

```
new Vue() => _init() => $mount() (这里分为 compiler 和 runtime 两个$mount) 最终 => mountComponent() =>

new Watcher() => updateComponent() => render() => _update()
```

## 思考与总结

1. 在`mergeOptions`中发现，事件的绑定和触发都是在当前组件完成的，其通信机制是怎样的？

   当前组件在`mergeOptions`时有一个属性`parentListener`用来存放父组件通过 props 绑定的事件，组件会通过`$on`将注册到自身，在使用时直接`$emit`触发即可

2. `mergeOptions`的优先级

   props methods data computed watch
   如果有重复会提示错误

3. 关于`$mount`

   刚开始`debug`经常在这里卡住，因为可能涉及到多个`$mount`，每次都获取当前`$mount`，然后重新赋值一个`$mount`，在`$mount`最后再调用上一个`$mount`

4. el、$mount、render 和 template 的关系

`el`和`render`一起使用，
`el`和`$mount`互斥
在实际执行时，render 是必须的，如果我们只写了 template，在某个阶段会被转程 render 函数，render 函数最终产生了虚拟 dom，

vue-cli3 及以上的版本采用了 vue 的 runtime 文件，不包含 compiler，所以低版本转过来的项目一定要把 template 改成 render

# ------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# 数据响应式流程

## debug 过程

### 入口

首先进入`/src/core/instance/init.js`

初始化执行`_init`时有一个函数叫做`initState`，这便是数据响应式的入口

核心代码：

```javascript
vm._watchers = [];
const opts = vm.$options;
// 1.props
if (opts.props) initProps(vm, opts.props);
// 2.methods
if (opts.methods) initMethods(vm, opts.methods);
// 3.data
if (opts.data) {
  initData(vm);
} else {
  observe((vm._data = {}), true /* asRootData */);
}
if (opts.computed) initComputed(vm, opts.computed);
if (opts.watch && opts.watch !== nativeWatch) {
  initWatch(vm, opts.watch);
}
```

其中`initData`是对`data`的响应式处理，这里先主要关注一下`initData`方法

### `initData`

核心代码：

```javascript
const keys = Object.keys(data);
let i = keys.length;
while (i--) {
  const key = keys[i];

  proxy(vm, `_data`, key);
}
observe(data, true /* asRootData */);
```

(ps:开发环境下会对`props`，`methods`校验，避免命名冲突)
然后在 while 循环中执行`proxy(vm, `\_data`, key)`将 data 的 key 代理到`_data`
紧接着迎来了最重要的部分`observe`

### `observe`与`Observer`

核心代码：

```javascript
function observe(value: any, asRootData: ?boolean): Observer | void {
  if (!isObject(value) || value instanceof VNode) {
    return;
  }
  // 1.获取ob实例 __ob__
  let ob: Observer | void;
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    // 如果有，直接用
    ob = value.__ob__;
  } else if (
    shouldObserve &&
    !isServerRendering() &&
    (Array.isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value) &&
    !value._isVue
  ) {
    // 初始化创建一次
    ob = new Observer(value);
  }
  if (asRootData && ob) {
    ob.vmCount++;
  }
  return ob;
}
```

这里会判断对象身上有没有`__ob__`，如果有则直接返回，这也是有时候我们调试程序会看到有的对象身上有个`__ob__`的原因

### `Observer`

进入 new Observer 的流程
其构造函数核心代码如下

```javascript
  constructor (value: any) {
    this.dep = new Dep()
    this.vmCount = 0
    // 指定ob实例
    def(value, '__ob__', this)
    if (Array.isArray(value)) {
      // 数组...
    } else {
      this.walk(value)
    }
  }
```

1. 添加 Dep

创建一个 dep 实例：这里的`dep`是给`Vue.$set`使用，当对象动态增减属性时可以及时作出相应，dep 用来做变更通知

2. 给响应式对象添加一个`__ob__`

3. 处理`Object`或`Array`

### Object:defineReactive

观察对象的核心方法是`defineReactive`

# ------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# 一些笔记

1. 合并 `options`

1. 初始化属性（指令，mixins，事件，监听等等）
   父子组件的事件通信，事件的绑定和触发都发生在子组件身上

1. 状态响应式

。。。

# patch

虚拟 dom 转真实 dom

# 数据响应式模块的变化

首先，一个组件一个 watcher
Watcher 分为 render Watcher 和 customer Watcher

dep 和 Watcher 有了双向绑定的关系
dep 通知 watcher 更新虚拟 dom
watcher 被删除时更新 dep 不再监听

dep 和 watcher 的关系变成了多对多
dep 分成了两部分，
一个是 new Observe 的时候创建，这个 dep 是为了监听对象增减 key
另一个是 defineReactive 时创建的，用于监听 key 的变化

render 时调用 createElement，间接执行了 obj key 的 getter 函数，从而将 render 注册进 Watcher

```

```
