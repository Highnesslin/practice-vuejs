# 组件化

两种声明方式

## 问题

1. Vue.Component 为什么可以全局使用
   默认选项加入
   `mergeOptions` =>

2. Comp => vnode => ... => dom 如何做的

3. vnode 和 componentInstance 是什么关系
   vnode

## 起点 `/src/core/global-api/index.js`

`initAssetRegisters`

作用：为 Vue.component、Vue.filter、Vue.directive 注册方法

1. 获取实例`Vue.extend(options)` => `VueComponent` Ctor
   `options.component.comp = Ctor`
2. 挂载组件：render => update => patch
   - 顺序：create/destory 自上而下（深度优先），mount（从下向上）

`instance/renderhelpers`
提供了方法别名
renderList：v-for
`_v` 创建文本
`_s` 格式化

initRender
`vm._c = (...) => createElement(...)`

## createElement：获取虚拟 dom

`vdom/createElement`
自定义组件：`createComponent(Ctor...)`

componentVnodPrepatch kepp-alive

区别：组件有钩子和 data

## 整体流程

首次`_render`时得到整棵树的`VNode`结构，其中自定义组件相关的主要是

1. createComponent() - `src/core/vdom/create-component.js`
   将组件变成`VueComponent`最终创建`VNode`
2. createComponent() - src/core/vdom/patch.js
   创建组件实例并挂载，vnode 转换为 dom

## 总结

编译`_c("comp")`
产生 vnode

```javascript
{
    tag: "vue-component-1-comp",
    data: {...},
    children: [...]，
    componentConstructor
}
```

得到 componentInstance 才能挂载

得到 instance 执行 `$mount`，最终得到真实 dom

# vue2 总结

## 1. $mount

执行渲染函数获取虚拟 dom，然后执行 patch

1. 获取宿主
2. updateComponent
3. 创建 Watcher
