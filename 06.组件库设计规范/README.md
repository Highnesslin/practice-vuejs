# 组件库

## 边界知识

### 1. $parent/$root

```javascript
// brother1
this.$parent.$on('foo', handle);
// brother2
this.$parent.$emit('foo');
```

### 2. $attrs/$listeners

非属性特性

父作用域不作为 prop 识别的属性

`v-bind` 会将 `$attrs` 展开
`v-on` 将 `$listeners`展开

用于高阶组件 属性透传

```javascript
// children
inheritAttrs: false // 特性继承，即子组件身上不出现父组件传递的props

<div>
  <input v-bind="$attrs" />
</div>
```

### 3. provide/inject

类似 react 的 Context

```javascript
// parent
provide() {
  return {
    value: ""
  }
}

// child 01
inject: ["value"]
// child 02
inject: {
  val: {
    from: "value"
  }
}
// child 03
inject: {
  val: "value"
}
```

## 插槽

2.6 的变化

v-slot:default 指令跟的值
自定义组件 model 选项

```javascript
// parent
<slot></slot>
<slot name="content"></slot>

// child
<template v-slot:default>具名插槽</template>
<template v-slot:content>内容。。。</template>
```

作用域插槽：类似于 react 的 **函数作为子组件**

```javascript
<template v-slot:default="active">
  {{active ? "选中" : "默认"}}
</template>
```

## 弹窗组件

### 1. 创建一个组件

1. Vue.extend

```javascript
const Ctor = Vue.extend(Component);
new Ctor({ propsData: prop });
```

2. new Vue

```javascript
// 创建组件
new Vue({
  render: h => h(Component, { props }),
}).$mount(); // 只挂载，不指定宿主，依然可以获得dom

// 手动追加
document.body.appendChild(vm.$el);

// 获取组件实例
const comp = vm.$children[0];

// 添加删除方法
comp.remove = () => {
  document.body.removeChild(vm.$el);
  vm.$destory();
};

// 返回组件实例
return comp;
```

`$root`是 Vue 的实例
`$children`是 VueComponent 实例的数组

Vue3 的静态方法全部取消了，变成实例方法

```javascript
createApp()
.component("comp", {...})
.$mount()
```

### 2. 做成插件
