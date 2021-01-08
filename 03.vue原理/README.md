# 响应式

## 流程

`Vue`的响应式原理借助了**发布订阅模式**来实现

创建`Vue`时，首先对`data`进行**递归**地**数据劫持**，为每一个`key`添加`Dep`，

这个`Dep`就是发布订阅中心，是一个中间服务者，为当前的`key`提供可以更新**视图**的**Watcher**，

由于每个`key`可能在**视图**上会出现多次，因此`Dep`内部维护了一个数组`deps`，用来存储依赖当前`key`的所有**Watcher**

每当**对象**的`key`被赋值是，当前`key`的`Dep`就会通知其依赖的`Watcher`更新视图，以此达到数据响应式的效果

## 几个核心概念

### 数据响应式的核心：Observer

1. 调用`observe`开始对**对象**进行`数据劫持`，`observe`内部调用`defineReactive`方法，该方法会递归向下**观察**，为每一个 `key` 添加**观察者**。

2. `defineReactive`通过`Object.defineProperty`对**对象**当前的`key`进行`数据劫持`，

   - 2.1. 每一个`key`拥有一个**发布订阅中心**`Dep`，每个`Dep`拥有多个`Watcher`，

   - 2.2. `Watcher`通过`getter`函数添加进`Dep`

   - 2.3. 当触发`setter`时会更新`Dep`下所有的`Watcher`，并且，`set`操作有可能设置一个新对象，因此这里还需要调用一次`observe`进行观察

### 依赖收集：Watcher 和 Dep

1. Watcher

   Watcher 负责**对象**当前`key`的更新函数，并且将自身**注册**到`Dep`中，所以**核心**是**注册**到`Dep`

   这里的工作方式非常巧妙，分为三步

   1. 将当前`Watcher`赋值给`Dep.target`
   2. 调用一次**对象**的`key`的`getter`函数，而`getter`函数中做了判断，如果`Dep.target`不为空则注册进`Dep`实例
   3. 将`Dep.target`赋值为`null`

2. Dep

   `Dep`是一个发布订阅中心，每一个`key`对应一个`Dep`，每个`Dep`拥有多个`Watcher`

### 编译：Compile

1. 根据`new Vue`时传入`options`的`el`属性获取**根 dom**，然后调用`compile`方法递归`dom`的子节点，根据`nodeType`及`textContext`选择`compileElement`或`compileText`

2. `compileElement`或`compileText`最终都会去执行`update`

3. `update`只做了两件事情

   - 3.1. 更新：执行`Updater`，比如`textUpdater`、`htmlUpdater`等等

   - 3.2. 创建当前`key`的`Watcher`

## 思考

### 插值表达式如果是`{{obj.xxx}}`的形式呢

可以借用`reduce`

```javascript
// const ret = this.$vm[exp]
const ret = exp.split('.').reduce((pre, now) => {
  pre = pre[now];
  return pre;
}, this.$vm);
```

### 数组如何监听

const originalProto = Array.prototype

const arrayProto = ... // 对数组进行变异

当 obj 为 Array 时，给实例修改原型，即`__proto__`

因为数组元素可能是对象，因此对数组元素进行 observe
