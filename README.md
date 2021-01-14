## Vue2

### 初始化流程(new Vue 发生肾摸事了)

初始化属性、全局方法、监听事件等等 => `$mount` => `mountComponent` => `new Watcher` 和 `_update`

### 数据响应式

- `observe` => `new Observer` => `dep` => `setter` 最终触发 `watcher._update`
- 数组：方法变异

### 批量异步更新

- `watcher.update` => `queueWatcher` => `queue.push(watcher)` + `nextTick`(向 `callbacks` 中添加`flushCallbacks`) => `timerFunc` => `promise.resolve().then(flushCallbacks)`

### 虚拟 dom

`_update` => `__patch__` => `createElm` 和 `patchVnode`

- `_update`： 初始化 or 更新
- `__patch__`： 树级别的比较：old 没有/new 没有/都存在：old 是真实 dom/都是虚拟 dom
- `patchVnode`： 同层比较，深度优先 + 属性 文本 children
- `updateChildren`：(头头/尾尾/头尾/尾头/) + 乱序 + 收尾

### 组件化

1. 定义：`Vue.component` => `Vue.extend获取VueComponent` => 添加到`Vue.options.components`中
2. 初始化：`createElement` => `createComponent` => `__patch__` => `createElm` => `createComponent` => 执行钩子
3. 更新：递归到组件的时候执行钩子函数

## Vue3

### 优化：数据响应式

- proxy
- 懒观察

### 优化：虚拟 dom

- 静态标记
- 编译阶段优化

### 新增：composition API

## 思考

### vue 和 react

### 关于虚拟 dom

React 虚拟 dom 的发展史

- 最初的虚拟 dom：自顶向下 一次性 diff，如果组件粒度设计不合理会造成卡顿
- react 16 改用了 Fiber 来描述 dom，协调阶段改用可中断的异步渲染策略

Vue 虚拟 dom 的发展史

- vue1 没有虚拟 dom，每个 key 有一个 watcher，可以精准更新视图，但是 watcher 数量太多造成性能损耗
- vue2 的虚拟 dom 在 diff 时带有一点智能，开发者人为地让 diff 优先处理 web 场景常见的列表变化
- vue3 的虚拟 dom 在编译阶段优化了静态标记，在 diff 阶段可以按需对比

猜想

- react 的异步渲染方案像是做了一个小型的操作系统一样，
- vue 好像是在慢慢智能化，将来的某个版本会不会变成用户对列表进行操作（排序/新增/删除等等）后，在内存中记住这次变化，diff 时直接对变化的内容精准打击
