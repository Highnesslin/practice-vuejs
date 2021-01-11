- 样式更新
- 比较孩子
  - 孩子增减
  - 头头比较/尾尾比较/头尾比较/尾头比较
  - 循环比较
- 文本更新
- type 变化

# 正课

## 异步更新

### 浏览器环境的事件循环

[https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/?utm_source=html5weekly](事件循环)
在 js 中，所有任务可分两种

1. 同步任务
2. 异步任务
   <br>在事件循环中，每进行一次循环操作成为`tick`，取出任务队列中队尾任务，待执行结束后，循环执行微任务队列
   [!事件循环模型](https://pic3.zhimg.com/80/v2-a38ad24f9109e1a4cb7b49cc1b90cafe_720w.jpg)

### Vue 中的异步更新策略

[!nextTick](https://pic3.zhimg.com/80/v2-a38ad24f9109e1a4cb7b49cc1b90cafe_720w.jpg)

- 异步：只要侦听到数据变化，**Vue** 将开启一个**队列**，并缓冲在同一**事件循环**中发生的所有数据变更。
- 批量：内部维护了一个`set`，保证一个**watcher**只进入队列一次。然后，在下一个事件循环 **"tick"** 中，**Vue** 刷新队列执行实际工作。
- 异步策略：Vue 在内部对异步队列尝试使用原生的 Promise.then 、 MutationObserver 或 setImmediate ，如果执行环境都不支持，则会采用 setTimeout 代替。

### 异步更新流程

1. 当触发了 key 的触发 setter 方法时，经过一系列操作最后执行`dep.notify`

2. `dep.notify`遍历`subs`中的**watcher**并触发`update`

3. 由于是 **render Watcher**，在`Watcher.prototype.update`方法中跳过`lazy`和`sync`的判断直接来到 `queueWatcher`

```javascript
Watcher.prototype.update = function update() {
  /* istanbul ignore else */
  // computed
  if (this.lazy) {
    this.dirty = true;
  } else if (this.sync) {
    // 通知执行更新
    this.run();
  } else {
    // watcher入队
    queueWatcher(this);
  }
};
```

4. `queueWatcher`做了两件事情

   - 4.1. 向队列`queue`中添加`watcher`
   - 4.2. 调用`nextTick`

   ```javascript
   var id = watcher.id;
   // 判断是否已经入队
   if (has[id] == null) {
     has[id] = true;
     if (!flushing) {
       // 入队
       queue.push(watcher);
     } else {
       // if already flushing, splice the watcher based on its id
       // if already past its id, it will be run next immediately.
       var i = queue.length - 1;
       while (i > index && queue[i].id > watcher.id) {
         i--;
       }
       queue.splice(i + 1, 0, watcher);
     }
     // queue the flush
     if (!waiting) {
       waiting = true;

       if (!config.async) {
         flushSchedulerQueue();
         return;
       }
       // 异步方式刷新队列
       // nextTick如何工作的？
       // flushSchedulerQueue如何刷新？
       nextTick(flushSchedulerQueue);
     }
   }
   ```

5. nextTick 与 callbacks

   - nextTick：

     1. 向 `callbacks` 中添加同步任务，
     2. 开启`timerFunc`
        - timerFunc 是初始化阶段向 Vue 安装的平台特有的函数，默认通过`promise.then`执行`flushCallbacks`

   - callbacks:

     callbacks 中存放的是 `flushSchedulerQueue`

```javascript
function nextTick(cb, ctx) {
  var _resolve;
  // 存入callbacks数组
  callbacks.push(function () {
    // 错误处理
    if (cb) {
      try {
        cb.call(ctx);
      } catch (e) {
        handleError(e, ctx, 'nextTick');
      }
    } else if (_resolve) {
      _resolve(ctx);
    }
  });
  if (!pending) {
    pending = true;
    // 启动异步任务
    timerFunc();
  }
  // $flow-disable-line
  if (!cb && typeof Promise !== 'undefined') {
    return new Promise(function (resolve) {
      _resolve = resolve;
    });
  }
}
```

6. 当前同步任务执行完毕，浏览器从微任务队列中取出`flushCallbacks`，`flushCallbacks`遍历执行`callbacks`，到这里异步任务执行完毕

### 异步更新中的一些小细节

#### 区分首次渲染和更新

组件首次渲染因为要快速响应视图，所以使用同步任务，
而组件的更新可能批量，因此采用异步任务

#### watcher.update

- lazy：computed
- sync
- queueWatcher：watcher 入队
  - `queue.push(watcher)`：不重复地添加 watcher 到队头
  - `nextTick(flushSchedulerQueue)`：如果此次操作入队，则执行`nextTick`（`waiting`是 是否正在工作的标志）

#### nextTick：promise

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

#### flushCallbacks：真正的异步任务

`flushCallbacks`方法：刷新 `callbacks` 数组中的回调，当**同步任务**执行结束后，浏览器自动从**微任务队列**中取出`flushCallbacks`及其他**微任务**执行

核心代码：

```javascript
const callbacks = [];
let pending = false;

function flushCallbacks() {
  pending = false;
  const copies = callbacks.slice(0);
  callbacks.length = 0;
  for (let i = 0; i < copies.length; i++) {
    // 实际执行的是flushSchedulerQueue
    copies[i]();
  }
}
```

#### 流程概览

每次执行了`setter`时，`notify`触发`queueWatcher`从而执行`nextTick`，`nextTick`会向微任务队列中添加一个`flushCallbacks`，后续再有`nextTick`执行时，只向`callbacks`添加任务

可以简单理解为，

1. `setter`一旦被触发，微任务队列就会出现`flushCallbacks`，当然只存在一个
2. 在微任务队列被刷新之前，如果再次执行了`nextTick`，只会向`callbacks`中加任务，不会再产生新的`flushCallbacks`

## ------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## 虚拟 dom

- 出现的意义，只是为了向 react 学习吗？

- 不适合的场景
  游戏画面需要频繁渲染，此时如果使用虚拟 dom，cpu 会持续占用造成卡顿，因此不适合游戏场景
- children 中有个 VNode 怎么是 undefined？
  空格或换行

- 为什么模板必须是单根节点？
  源码中 patch 方法中无法处理多根节点

```javascript

```

- 虚拟 dom 不适合的场景

### 流程

4 个游标分别代表新旧节点的头与尾，

1. 首先进行新旧节点的首与首对比，若满足 sameType 就进行 patchVnode ，然后两个首的游标向后移动，进行下一次操作，
2. 如果遇到不满足 sameType 的情况，则先尝试进行新旧节点的尾尾比较，若同样满足 sameType 就 patchVnode 然后移动游标。
3. 若再次遇到不满足 sameType 的情况，就对游标中间的元素进行 diff（传统 diff）
4. 最后进行扫尾工作，即如果新旧节点数量不同的情况，若剩下的是新节点，则表示要增加的内容，若剩下的是旧节点，则表示要删除的内容

### 首次创建与组件更新的区别

prevVnode 不存在，调用 createElm 创建一整棵树，在当前节点的 nextSibling 添加新节点，然后删除旧节点，如果 debug 会看到某一刻页面上出现两个节点，后续会删除旧节点保留新节点

### patch 做了哪些事情？

位置：`core/vdom/patch.js`
通过`createPatchFunction`这个工厂函数返回一个真正的`patch`

- 1. 树级别的比较

  - newVnode 不存在 **删除**
  - oldVnode 不存在 **新增**
  - 都存在
    - 1.1. oldVnode 是**真实 dom**，也就是`init`阶段
    - 1.2. 都是`vnode` patchVnode

### patchVnode：diff 发生的地方

- 比较策略：同层比较，深度优先

  1. 同层比较，深度优先
  2. 顺序：属性 > 文本 > children

- 规则：

  1. 都有 children，updateChildren
  2. newVnode 有 children，oldVnode 没有，则先清空 oldVnode 的文本，然后新增 children
  3. newVnode 没有 children，oldVnode 有 children，移除所有 children
  4. newVnode 和 oldVnode 都没有 children，则文本替换

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

### updateChildren 与 key 的作用

1. 不移动：新旧节点 头头对比或尾尾对比
   创建 4 个游标，
   若 sameVnode，则 patchVnode，然后游标运动
2. 移动：头尾对比，尾头对比
3. 乱序：两个数组对比
4. 扫尾工作：处理新旧游标中间的 dom，批量添加或批量删除

循环的条件是游标不重叠

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

由 `sameType` 的内容想到，如果用 `index` 做 `key`，列表重新排序可能会出现 `bug`

当列表中出现删除场景时，因为 `sameType` 的策略是首先比较 `key`，被删除节点后面的 `dom`，由于 `key(index)` 也发生了改变，就会被判定为 `dom` 发生了改变，首先造成的影响就是 diff 流程变复杂，如果列表并没有太复杂，造成不了太多性能的损耗，但是继续思考，如果那些没有改变的 `dom`，很不幸操作了一些非响应式引起的变化，比如改变 `style`，或通过 `css` 弹出了 `Popover`，那么当前更新时就会覆盖这些非响应式变化，让用户体验不好，或者误以为产生了 bug
