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

### 问题

- 出现的意义，难道只是为了向 react 靠近吗？
  <br/>balabala

- 为什么模板必须是单根节点？
  <br/>源码中 patch 方法中无法处理多根节点

- 循环时为什么要写 key

### 流程概览

4 个游标分别代表新旧节点的首与尾，

1. 首先进行新旧节点的首与首对比，若满足 sameType 就进行 patchVnode ，然后两个首的游标向后移动，进行下一次操作，
2. 如果遇到不满足 sameType 的情况，则先尝试进行新旧节点的尾尾比较，若同样满足 sameType 就 patchVnode 然后移动游标。
3. 若再次遇到不满足 sameType 的情况，就对游标中间的元素进行 diff（传统 diff）
4. 最后进行扫尾工作，即如果新旧节点数量不同的情况，若剩下的是新节点，则表示要增加的内容，若剩下的是旧节点，则表示要删除的内容

### 细节探究

#### update：首次创建与组件更新

首次创建和组件更新都走都是`__patch__`方法

核心代码：

```javascript
const prevVnode = vm._vnode;
vm._vnode = vnode;
// Vue.prototype.__patch__ is injected in entry points
// based on the rendering backend used.
if (!prevVnode) {
  // initial render
  vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */);
} else {
  // updates
  vm.$el = vm.__patch__(prevVnode, vnode);
}
```

#### patch 做了哪些事情？

位置：`core/vdom/patch.js`
通过`createPatchFunction`这个工厂函数返回一个真正的`patch`

核心代码：

```javascript
return function patch(oldVnode, vnode, hydrating, removeOnly) {
  if (isUndef(oldVnode)) {
  } else {
    const isRealElement = isDef(oldVnode.nodeType);
    if (!isRealElement && sameVnode(oldVnode, vnode)) {
      // patch existing root node
      // 更新逻辑
      patchVnode(oldVnode, vnode, insertedVnodeQueue, null, null, removeOnly);
    } else {
      // 初始化逻辑
      if (isRealElement) {
        // either not server-rendered, or hydration failed.
        // create an empty node and replace it
        oldVnode = emptyNodeAt(oldVnode);
      }

      // 真实dom
      const oldElm = oldVnode.elm;
      const parentElm = nodeOps.parentNode(oldElm);

      // 创建一整棵树
      createElm(
        vnode,
        insertedVnodeQueue,
        // extremely rare edge case: do not insert if old element is in a
        // leaving transition. Only happens when combining transition +
        // keep-alive + HOCs. (#4590)
        oldElm._leaveCb ? null : parentElm,
        nodeOps.nextSibling(oldElm)
      );

      // 此时界面上新旧dom都存在

      // 删除老节点
      if (isDef(parentElm)) {
        removeVnodes([oldVnode], 0, 0);
      } else if (isDef(oldVnode.tag)) {
        invokeDestroyHook(oldVnode);
      }
    }
  }

  invokeInsertHook(vnode, insertedVnodeQueue, isInitialPatch);
  return vnode.elm;
};
```

首先进行树级别的比较

- newVnode 不存在 **删除**
- oldVnode 不存在 **新增**
- newVnode 与 oldVnode 都存在

  - 1.1. oldVnode 是**真实 dom**，也就是`init`阶段

    1. init 阶段：创建新树，销毁旧树
       <br>在`update`中，`oldVnode`以**真实 dom**的形式传进来，因此走了`patch`中的另一个分支，调用 `createElm` 创建一整棵树，在当前节点的 `nextSibling` 添加新节点，此时如果在 `debug`， 会看到页面上出现了两个节点，后续会删除旧节点保留新节点，至此，init 阶段结束

  - 1.2. 都是`vnode` **patchVnode**

#### patchVnode：diff 发生的地方

- 比较策略：同层比较，深度优先

  1. 同层比较，深度优先(类似先序遍历)
  2. 更新顺序：
     - 2.1. 属性
     - 2.2. 文本
     - 2.3. children

- 规则：

  1. 新老节点 都有 children, updateChildren
  2. 新节点 有 children，老节点 没有 children，则先清空 老节点 的文本，然后新增 children
  3. 新节点 没有 children，老节点 有 children，移除所有 children
  4. 新节点 和 老节点 都没有 children，则文本替换

核心代码：

```javascript
function patchVnode(oldVnode, vnode, insertedVnodeQueue, ownerArray, index, removeOnly) {
  if (oldVnode === vnode) {
    return;
  }
  // 获取两节点孩子
  const oldCh = oldVnode.children;
  const ch = vnode.children;

  // 属性更新，没有diff，全部更新   ps：vue3静态标记都优化主要在这部分
  if (isDef(data) && isPatchable(vnode)) {
    for (i = 0; i < cbs.update.length; ++i) cbs.update[i](oldVnode, vnode);
    if (isDef((i = data.hook)) && isDef((i = i.update))) i(oldVnode, vnode);
  }

  // text children
  if (isUndef(vnode.text)) {
    // 新老节点都有孩子
    if (isDef(oldCh) && isDef(ch)) {
      if (oldCh !== ch) updateChildren(elm, oldCh, ch, insertedVnodeQueue, removeOnly);
    } else if (isDef(ch)) {
      // 新节点有孩子，创建
      if (process.env.NODE_ENV !== 'production') {
        checkDuplicateKeys(ch);
      }
      if (isDef(oldVnode.text)) nodeOps.setTextContent(elm, '');
      addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue);
    } else if (isDef(oldCh)) {
      // 删除
      removeVnodes(oldCh, 0, oldCh.length - 1);
    } else if (isDef(oldVnode.text)) {
      // 清空文本
      nodeOps.setTextContent(elm, '');
    }
  } else if (oldVnode.text !== vnode.text) {
    // 文本更新
    nodeOps.setTextContent(elm, vnode.text);
  }
}
```

#### updateChildren

按照 **web 场景** 中常见的数组变化进行 `diff`，
常见的场景有

1. 列表头部添加/删除 dom，列表尾部添加/删除 dom，
2. 列表排序，升序降序的改变，即首尾互换

由上得出 4 中情况，头头，尾尾，头尾，尾头

步骤：

1. 创建 4 个游标，
2. 不移动的操作：新旧节点 头头对比或尾尾对比
   若 sameVnode，则 patchVnode，然后游标运动
3. 有移动的操作：头尾对比，尾头对比
4. 乱序：两个数组对比，找到节点更新，然后移动到新位置
5. 扫尾工作：随着循环，四个游标两两靠近，如果最后没有重叠，说明新旧节点数量有变化，所以需要批量添加或批量删除

核心代码：

```javascript
function updateChildren(parentElm, oldCh, newCh, insertedVnodeQueue, removeOnly) {
  // 4个游标
  let oldStartIdx = 0;
  let newStartIdx = 0;
  let oldEndIdx = oldCh.length - 1;
  let oldStartVnode = oldCh[0];
  let oldEndVnode = oldCh[oldEndIdx];
  let newEndIdx = newCh.length - 1;
  let newStartVnode = newCh[0];
  let newEndVnode = newCh[newEndIdx];
  // 搜索相同节点时使用
  let oldKeyToIdx, idxInOld, vnodeToMove, refElm;

  // removeOnly is a special flag used only by <transition-group>
  // to ensure removed elements stay in correct relative positions
  // during leaving transitions
  const canMove = !removeOnly;

  if (process.env.NODE_ENV !== 'production') {
    checkDuplicateKeys(newCh);
  }

  // 循环条件时游标不重叠
  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    // 调整游标：游标移动可能造成对应节点为空
    if (isUndef(oldStartVnode)) {
      oldStartVnode = oldCh[++oldStartIdx]; // Vnode has been moved left
    } else if (isUndef(oldEndVnode)) {
      oldEndVnode = oldCh[--oldEndIdx];
      // 4个else if 是首尾查找
    } else if (sameVnode(oldStartVnode, newStartVnode)) {
      // 头头
      patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue, newCh, newStartIdx);
      oldStartVnode = oldCh[++oldStartIdx];
      newStartVnode = newCh[++newStartIdx];
    } else if (sameVnode(oldEndVnode, newEndVnode)) {
      // 尾尾
      patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue, newCh, newEndIdx);
      oldEndVnode = oldCh[--oldEndIdx];
      newEndVnode = newCh[--newEndIdx];
    } else if (sameVnode(oldStartVnode, newEndVnode)) {
      // 头尾
      // Vnode moved right
      patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue, newCh, newEndIdx);
      canMove &&
        nodeOps.insertBefore(parentElm, oldStartVnode.elm, nodeOps.nextSibling(oldEndVnode.elm));
      oldStartVnode = oldCh[++oldStartIdx];
      newEndVnode = newCh[--newEndIdx];
    } else if (sameVnode(oldEndVnode, newStartVnode)) {
      // 尾头
      // Vnode moved left
      patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue, newCh, newStartIdx);
      canMove && nodeOps.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
      oldEndVnode = oldCh[--oldEndIdx];
      newStartVnode = newCh[++newStartIdx];
    } else {
      // 乱序diff
      // 核心就是从新数组取第一个，然后从老数组查找，代码太多了先不贴了
    }
  }
  // 循环结束，开始扫尾工作   批量创建或删除
  if (oldStartIdx > oldEndIdx) {
    refElm = isUndef(newCh[newEndIdx + 1]) ? null : newCh[newEndIdx + 1].elm;
    addVnodes(parentElm, refElm, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
  } else if (newStartIdx > newEndIdx) {
    removeVnodes(oldCh, oldStartIdx, oldEndIdx);
  }
}
```

#### sameType 和 key

##### sameType

```javascript
function sameVnode(a, b) {
  return (
    // 必要条件：key
    a.key === b.key &&
    // 相同元素
    ((a.tag === b.tag &&
      a.isComment === b.isComment &&
      // 数据相同
      isDef(a.data) === isDef(b.data) &&
      // 。。。
      sameInputType(a, b)) ||
      (isTrue(a.isAsyncPlaceholder) &&
        a.asyncFactory === b.asyncFactory &&
        isUndef(b.asyncFactory.error)))
  );
}
```

一般前两个条件就可以确定了

##### key

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

### 思考与总结

#### 1. 为什么 `patch` 不是直接使用，而是通过一个**工厂函数**`createPatchFunction`返回

```javascript
// 接收平台特殊操作，返回平台patch
export function createPatchFunction(backend) {
  let i, j;
  const cbs = {};

  const { modules, nodeOps } = backend;

  return function patch(...) {
    // ...
  };
}
```

#### 2. 为什么不推荐用 `index` 作 `key`

列表重排序会报错

比如：
当列表中出现删除场景时，因为 `sameType` 的策略是首先比较 `key`，被删除节点后面的 `dom`，由于 `key(index)` 也发生了改变，就会被判定为 `dom` 发生了改变，首先造成的影响就是 diff 流程变复杂，如果列表并没有太复杂，造成不了太多性能的损耗，但是继续思考，如果那些没有改变的 `dom`，很不幸操作了一些非响应式引起的变化，比如改变 `style`，或通过 `css` 弹出了 `Popover`，那么当前更新时就会覆盖这些非响应式变化，让用户体验不好，或者误以为产生了 bug

#### 3. 不适合的场景

游戏画面需要频繁渲染，此时如果使用虚拟 dom，cpu 会持续占用造成卡顿，因此不适合游戏场景

#### 4. children 中有个 VNode 怎么是 undefined？

空格或换行
