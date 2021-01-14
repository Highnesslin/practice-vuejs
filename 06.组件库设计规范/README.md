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
高阶组件 属性透传

3. provide/inject
   类似 react 的 Context

## 插槽

2.6 的变化

v-slot:default 指令跟的值
自定义组件 model 选项

## 弹窗组件

创建一个组件

```javascript
const Ctor = Vue.extend(Component);
Ctor({ propsData: prop });
```

```javascript
new Vue({
  render: h => h(Component, { props }),
}).$mount(); // 只挂载，不指定宿主，依然可以获得dom

document.body.appendChild(vm.$el);

const comp = vm.$children[0];

comp.remove = () => {
  document.body.removeChild(vm.$el);
  vm.$destory();
};

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
