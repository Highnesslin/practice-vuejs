- 样式更新
- 比较孩子
  - 孩子增减
  - 头头比较/尾尾比较/头尾比较/尾头比较
  - 循环比较
- 文本更新
- type 变化

# 正课

## 异步更新

### watcher.update

- lazy：computed
- sync
- queueWatcher：watcher 入队
  - `queue.push(watcher)`：不重复地添加 watcher 到队头
  - `nextTick(flushSchedulerQueue)`：如果此次操作入队，则执行`nextTick`（`waiting`是 是否正在工作的标志）

### nextTick：promise

1. 向`callbacks`添加任务
   `callbacks`： `[flushSchedulerQueue]`
2. 开启一个异步任务`timerFunc` （`pending`是 是否正在执行任务的标志）
   2.1. Vue 初始化时会判断平台支持什么异步方案：promise > MutationObserver > setImmediate(虽然是宏任务，但优于 setTimeout) > setTimeout
   ```javascript
   if (typeof Promise !== 'undefined' && isNative(promise)) {
     const p = Promise.resolve();
     timerFunc = () => {
       p.then(flushCallbacks);
     };
   }
   ```

`flushSchedulerQueue`：刷新 **Watcher** 队列

watcher.run()是组件真正的更新函数，将 `new Watcher` 传入的第二个参数，`mountComponent` 赋值给 `this.getter`，然后执行 `this.getter`

run 执行了 getter，getter 是传进来的更新函数

### flushCallbacks：真正的异步任务

`flushCallbacks`方法：刷新 `callbacks` 数组中的回调，当**同步任务**执行结束后，浏览器自动从**微任务队列**中取出`flushCallbacks`及其他**微任务**执行

核心代码：

```javascript
const copies = callbacks.slice(0);
callbacks.length = 0;
// 遍历copied执行函数
```

### 流程概览

每次执行了`setter`时，`notify`触发`queueWatcher`从而执行`nextTick`，`nextTick`会向微任务队列中添加一个`flushCallbacks`，后续再有`nextTick`执行时，只向`callbacks`添加任务

可以简单理解为，

1. `setter`一旦被触发，微任务队列就会出现`flushCallbacks`，当然只存在一个
2. 在微任务队列被刷新之前，如果再次执行了`nextTick`，只会向`callbacks`中加任务，不会再产生新的`flushCallbacks`

## 虚拟 dom

children 中有个 VNode 怎么是 undefined？ 空格

为什么模板必须是单根节点 源码中 patch 方法中无法处理多根节点

diff 发生在 patchVnode
同层比较，深度优先
属性更新/文本更新/子节点更新

sameVnode

不设置 key

游戏画面需要频繁渲染，此时如果使用虚拟 dom，cpu 会持续占用造成卡顿，因此不适合游戏场景

### 首次创建

prevVnode 不存在，调用 createElm 创建一整棵树，在当前节点的 nextSibling 添加新节点，然后删除旧节点，如果 debug 会看到某一刻页面上出现两个节点，后续会删除旧节点保留新节点

### 组件更新

prevVnode.children 中有一个 undefined，是节点之间的空格

patch 做了哪些事情？
位置：`core/vdom/patch.js`
通过`createPatchFunction`这个工厂函数返回一个真正的`patch`

- 1. 树级别的比较

  - newVnode 不存在 **删除**
  - oldVnode 不存在 **新增**
  - 都存在
    - 1.1. oldVnode 是**真实 dom**，也就是`init`阶段
    - 1.2. 都是`vnode` patchVnode

- 2. 当前树是单根节点，否则报错

### patchVnode：diff 发生的地方

- 比较策略：同层比较，深度优先

  1. 属性更新
  2. 文本更新
  3. children 更新

- 规则：

  1. 都有 children，updateChildren
  2. newVnode 有 children，oldVnode 没有，则先清空 oldVnode 的文本，然后新增 children
  3. newVnode 没有 children，oldVnode 有 children，移除所有 children
  4. newVnode 和 oldVnode 都没有 children，则文本替换

- updateChildren

  1. 不移动：新旧节点 头头对比或尾尾对比
     创建 4 个游标，
     若 sameVnode，则 patchVnode，然后游标运动
  2. 移动：头尾对比，尾头对比
  3. 乱序：两个数组对比
  4. 扫尾工作：处理新旧游标中间的 dom，批量添加或批量删除

  循环的条件是游标不重叠

### sameVnode

```javascript
function sameVnode(a, b) {
  return (
    a.key === b.key &&
    ((a.tag === b.tag &&
      a.isComment === b.isComment &&
      isDef(a.data) === isDef(b.data) &&
      sameInputType(a, b)) ||
      (isTrue(a.isAsyncPlaceholder) &&
        a.asyncFactory === b.asyncFactory &&
        isUndef(b.asyncFactory.error)))
  );
}
```

由此可见，设置 key 可以更好的判断新旧节点是否相同

举个例子

```javascript
// [a,b,c,d]
// [a,e,b,c,d]

// 有key的diff

// 1.
// [b,c,d]
// [e,b,c,d]

// 2.
// [b,c]
// [e,b,c]

// 3.
// [b]
// [e,b]

// 4.
// []
// [e]

// end
// 添加e
```

```javascript
// [a,b,c,d]
// [a,e,b,c,d]

// 没有key的diff

// 1.认为b和e相同，进行额外更新
// [b,c,d]
// [e,b,c,d]

// 2.额外更新
// [c,d]
// [b,c,d]

// 3.额外更新
// [d]
// [c,d]

// 4.额外更新
// []
// [d]

// 额外更新了4次
```

如果用 index 做 key，列表重新排序会出现 bug
