web 平台 entry-runtime-with-compiler
$mount 为了解析模板
render 优先级最高

为什么 vue-cli3 要写 render $mount： 因为是runtim.esm版本，不包含compiler，$mount 是和 render 一起使用的

patch 平台特有操作

initGlobalAPI 安装全局 api

unshift 向前插入

new vue 发生肾摸事 合并 options 初始化属性（事件，监听等等） 状态响应式
`_init` 哪来的

合并选项 $options 变化

initLife: 出生后绑定关系的一系列事情

父子组件通信
本质都是子组件在监听

`_c` 和`$createElement` 一样的 VueRouter 源码 router-view 就用到了`$createElement`

initState

initInject 和 initProvide 隔代传参

设置了 el 不用执行$mount

mountComponent

一个组件一个 watcher

render 是获取虚拟 dom

patch：虚拟 dom =》 真实 dom

webpack 环境下 vue-loader 替代了编译器

优先级 props method data computed watch

一个对象一个 Dep 一个组件一个 Watcher

一个 key 对应一个 dep

创建 Observer 时 先创建一个 Dep，用来通知对象增减属性

子 ob 也要依赖收集

组件 Watcher
所以 dep 和 watcher 变成了多对一

user Watcher
dep 对 watcher 时一对多

dep 与 watcher 相互引用

watcher 取消时通知 dep
dep 更新时通知 watcher

set 时也是通知 dep 去增加 key

render 时调用 h，h 调用属性触发 getter，增加 dep

observer/array。js 数组更新

7 个能改变原数组的方法

子 ob 去通知数组更新

notify 是下节课 的起点

# 文件有好多版本，有什么区别，我们看源码看哪个

runtime.esm 版本

# new Vue 发生肾摸事了

1. 初始化属性

2. 合并 `options`

3. 初始化属性（指令，mixins，事件，监听等等）
   父子组件的事件通信，事件的绑定和触发都发生在子组件身上

4. 状态响应式

。。。

# el、$mount、render 和 template 的关系

`el`和`render`一起使用，
`el`和`$mount`互斥
在实际执行时，render 是必须的，如果我们只写了 template，在某个阶段会被转程 render 函数，render 函数最终产生了虚拟 dom，

vue-cli3 及以上的版本采用了 vue 的 runtime 文件，不包含 compiler，所以低版本转过来的项目一定要把 template 改成 render

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
