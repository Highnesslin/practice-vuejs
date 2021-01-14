# 整理流程一览

## 初始化

初始化时首先对`data`进行**响应式处理**，并通过`proxy`方法将`data`代理到`this`身上，
然后调用`$mount`方法触发`mountComponent`，`mountComponent`做了两件重要的事情

1. 给`updateComponent`赋值更新方法
   ```javascript
   updateComponent = () => {
     vm._update(vm.render());
   };
   ```
2. 创建**Watcher**，将`updateComponent`作为参数传入，在内部先保存到`this.getter`身上，由`get`方法和`update`方法调用。然后把自己赋值给`Dep.target`，执行`get`方法（也就是调用`updateComponent`），最终调用`render`，从而触发`render`函数中 N 多对象的`getter`函数，在`getter`函数中，把当前的**Watcher 实例**添加到对象的**dep**中，待`updateComponent`执行完毕后`Dep.target`重新赋值为`null`，结束依赖收集的过程

   `render`中的`h`是`createElement`，因此最终返回完整的**虚拟 dom**，

   `update`负责将**虚拟 dom**转成**真实 dom**，方法内部调用了`__patch__`，
   此时传入的`oldVnode`是**真实 dom**，`__patch__`根据这个**条件**执行`createElm`，在**真实 dom**的**兄弟节点**位置创建一棵新的树，然后再删除**旧的 dom 树**，至此初始化流程完毕

## 更新

1. 由于初始化阶段已经获得了**响应式对象**，此时给对象设置新的值会触发`setter`方法，执行对象身上的`dep`调用`notify`通知`watcher`执行更新函数，
2. 这里的更新函数就是上个阶段的`updateComponent`，与**初始化**不同的一点是，`update`根据`sync`字段区分`render Watcher` 和 `user Watcher`
   在这里是`render Watcher`，所以调用`queueWatcher`，从这里开始**Vue**的**异步更新流程**
3. `queueWatcher`会不重复地向`queue`中添加`watcher`，然后尝试（一次更新只能走一次）调用`nextTick`，向`callbacks`中添加更新函数（`flushSchedulerQueue`），接着再尝试（一次更新只能走一次）触发`timerFunc`，`timerFunc`是初始化时注入的平台特有的**异步方法**，用于开启一个异步任务，默认是 `promise`（向下分别是 `MutationObserver`、`setImmediate`、`setTimeout`）。至此异步更新步骤结束，如果此时同步代码没有结束，则继续执行同步代码（主要是赋值、nextTick 等操作），等同步代码结束后，浏览器刷新整个**微任务队列**，取出`flushSchedulerQueue`和用户触发的其他微任务，一次性全部执行

# 数据响应式

## 数组

1. 方法覆盖<br>
   7 个方法执行时加入如下操作：
   1. 对新加入的内容执行`observe`
   2. 拿到当前对象的 **ob 实例**，执行其**dep**的`notify`方法
2. 执行数组的`getter`时给**数组**每一项的**dep**添加**watcher**

# $nextTick、$set

# 虚拟 dom

# 异步更新

# 一些小细节

```javascript
// data.__ob__ = this; // 注意上下两种写法意义不一样
def(data, '__ob__', this);
```
