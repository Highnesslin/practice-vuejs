# 模块

- compiler
- core
- platform

# 初始化流程

## `platforms/web/entry-runtime-with-compiler.js`

- 入口
- 解析模板相关选项

## `platforms/web/runtime/index.js`

- 安装平台特有函数，实现跨平台

  更新初始化都走`__patch__` 平台特有操作

- 实现$mount mountComponent

  初始化必须调用一次

  `render`：生成 vdom
  `_patch`：vdom =》 dom

## `core/index.js`

- 初始化全局 API

  initGlobalApi 初始化 Vue.Component,Vue.use,Vue.get/set,use

## `core/instance/index.js`

- Vue 构造函数
- 声明实例属性
  (ps:真正创建实例的 Vue，即构造函数)

问题：`new Vue`都发生肾摸事了

```javascript
initMixin(Vue); // 初始化_init
// 剩下我们熟悉的其他实例属性和方法由下面这些混入
stateMixin(Vue);
eventsMixin(Vue);
lifecycleMixin(Vue);
renderMixin(Vue);
```

## `core/instance/init.js` `_init` 方法在此定义, new Vue 的过程都在这里

- mergeOptions
- 初始化组件实例：**声明**属性方法生命周期等，注意不是执行，只是**声明**
- 对内部状态进行响应式处理
- 调用`$mount`挂载组件

```javascript
initLifecycle(vm); // 实例属性：$parent,$root,$children,$refs
initEvents(vm); // 自定义事件处理，父子组件的通信都交给子组件处理
initRender(vm); // 插槽解析，$slots,$scopeSlots,  _c, $createElement()
callHook(vm, 'beforeCreate');
// 接下来都是和组件状态相关的数据操作
// inject/provide
initInjections(vm); // 注入祖辈传递下来的数据
initState(vm); // 数据响应式：props,methods,data,computed,watch
initProvide(vm); // 提供给后代，用来隔代传递参数
callHook(vm, 'created');
if (vm.$options.el) {
  vm.$mount(vm.$options.el);
}
```

# `core/instance/lifeCycle.js`

`$mount`方法

# debug 调试过程

## 断点 1: new Vue => `vm._init`

- mergeOptions
  结束后添加了全局组件 keep-alivetransitiontrnasitiongroup
- initLifeCycle
  结束后多了$children,$parent,$refs,$root
- initState
  结束后多了代理到 this 上的 data 中的值，$data（没有`__ob__`）, \_data(有`__ob__`)等

## 断点 2: $mount

- 给 `updateComponent` 赋值

```javascript
updateComponent = () => {
  vm._update(vm._render(), hydrating);
};
```

- new Watcher
  最终执行了 `updateComponent`

- `_render`得到虚拟 dom

- `_update`完成更新
  根据`prevVnode`有没有值决定初次渲染还是更新流程
  但最终都是调用`_patch`，到这里初始化就结束了

# 响应式流程

## initState 方法

入口`core/instance/state.js`的`initState`方法
来自`core/instance/init.js` 中 `_init` 方法的调用

顺序: props method data computed watch

```javascript
vm._watchers = [];
const opts = vm.$options;
// 1.props
if (opts.props) initProps(vm, opts.props);
// 2.methods
if (opts.methods) initMethods(vm, opts.methods);
// 3.data
if (opts.data) {
  // 如果设置data走这里
  initData(vm);
} else {
  observe((vm._data = {}), true /* asRootData */);
}
if (opts.computed) initComputed(vm, opts.computed);
if (opts.watch && opts.watch !== nativeWatch) {
  initWatch(vm, opts.watch);
}
```

## initData 方法

核心代码：

```javascript
function initData(vm: Component) {
  let data = vm.$options.data;
  data = vm._data = typeof data === 'function' ? getData(data, vm) : data || {};
  // proxy data on instance
  const keys = Object.keys(data);
  const props = vm.$options.props;
  const methods = vm.$options.methods;
  let i = keys.length;
  while (i--) {
    const key = keys[i];
    // ...处理命名 冲突问题
    proxy(vm, `_data`, key);
  }
  // observe data
  observe(data, true /* asRootData */);
}
```

- 避免命名冲突
- observe(data, true)
  根据`__ob__`有无来按需创建**Observer**

## Observer

- 创建`dep`，用来监管对象动态的增减 key，这个`dep`在`$set`时会去通知动态变更

- 代理`__ob__`到`this`

- walk：循环调用`defineReactive`创建响应式对象

- observeArray

## defineReactive

核心代码：

```javascript
let childOb = !shallow && observe(val);
Object.defineProperty(obj, key, {
  enumerable: true,
  configurable: true,
  get: function reactiveGetter() {
    const value = getter ? getter.call(obj) : val;
    if (Dep.target) {
      // 依赖收集：vue2中一个组件一个Watcher
      // dep n:1  watcher
      // 如果用户手动创建watcher，比如 使用watch选项或者this.$watch(key,cb)
      // dep 1:n  watcher
      dep.depend();
      if (childOb) {
        // 子ob也要做依赖收集
        childOb.dep.depend();
        if (Array.isArray(value)) {
          dependArray(value);
        }
      }
    }
    return value;
  },
  set: function reactiveSetter(newVal) {
    const value = getter ? getter.call(obj) : val;
    /* eslint-disable no-self-compare */
    if (newVal === value || (newVal !== newVal && value !== value)) {
      return;
    }
    /* eslint-enable no-self-compare */
    if (process.env.NODE_ENV !== 'production' && customSetter) {
      customSetter();
    }
    // #7981: for accessor properties without setter
    if (getter && !setter) return;
    if (setter) {
      setter.call(obj, newVal);
    } else {
      val = newVal;
    }
    childOb = !shallow && observe(newVal);
    dep.notify();
  },
});
```

- 创建 dep，这个 dep 用来通知 key 对应的 value 变化时通知 Watcher 更新组件
- 观察子对象时产生`childOb`，也会做依赖收集，数据变化时，当前 key 和子对象所依赖的 Watcher 都执行更新

## Dep

核心代码：

```javascript
export default class Dep {
  static target: ?Watcher;
  id: number;
  subs: Array<Watcher>;

  constructor() {
    this.id = uid++;
    this.subs = [];
  }

  addSub(sub: Watcher) {
    this.subs.push(sub);
  }

  removeSub(sub: Watcher) {
    remove(this.subs, sub);
  }

  depend() {
    if (Dep.target) {
      // watcher.addDep()
      Dep.target.addDep(this);
    }
  }

  notify() {
    // stabilize the subscriber list first
    const subs = this.subs.slice();
    if (process.env.NODE_ENV !== 'production' && !config.async) {
      // subs aren't sorted in scheduler if not running async
      // we need to sort them now to make sure they fire in correct
      // order
      subs.sort((a, b) => a.id - b.id);
    }
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update();
    }
  }
}
```

- dep 和 Watcher 的关系：
  - N 对 N
  - Watcher 分为 render Watcher 和 用户 Watcher
  - 当 Watcher 不再需要时通知 dep 删除自己，dep 更新时通知 Watcher 进行 diff

## 对数组的处理

原理：覆盖方法
源码：

```javascript
// 获取数组原型
const arrayProto = Array.prototype;
// 克隆一份
export const arrayMethods = Object.create(arrayProto);

// 7个变更方法需要覆盖
const methodsToPatch = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'];

/**
 * Intercept mutating methods and emit events
 */
methodsToPatch.forEach(function (method) {
  // cache original method
  // 保存原始方法
  const original = arrayProto[method];
  // 覆盖之
  def(arrayMethods, method, function mutator(...args) {
    // 1.执行默认方法
    const result = original.apply(this, args);
    // 2.变更通知
    const ob = this.__ob__;
    // 可能会有新元素加入
    let inserted;
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args;
        break;
      case 'splice':
        inserted = args.slice(2);
        break;
    }
    // 对新加入的元素做响应式
    if (inserted) ob.observeArray(inserted);
    // notify change
    // ob内部有一个dep，让它去通知更新
    ob.dep.notify();
    return result;
  });
});
```

ob 内部有一个 dep，每当变化时通知更新
