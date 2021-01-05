# 使用

```javascript
import Vue from 'vue';
import VueRouter from 'vue-router';

// 1.使用VueRouter插件
Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/about',
    name: 'About',
    component: () => import(/* webpackChunkName: "about" */ '../views/About.vue'),
  },
];

// 2.创建实例
const router = new VueRouter({
  routes,
});

// 3.配置到选项中
new Vue({
  // ...其他options
  router,
  render: h => h(App),
}).$mount('#app');

// 4.在组件中使用
<router-link to="/home">home</router-link>
<router-view></router-view>
```

# 问题

1. 为什么要先注册插件:`Vue.use(VueRouter)`
2. `new VueRouter(...)`做了哪些事情
3. 全局的`<router-link />`组件和`<router-view />`组件是哪里来的

# 原理

## 1.为什么先注册插件

1. `Vue.use`接收的参数是一个带有**函数 install**的对象，`install`包含参数`Vue`，将此参数保存，用于后续使用

```javascript
VueRouter.install = function (_Vue) {
  Vue = _Vue;
};
```

2. 通过`mixins`延迟执行，取出根实例中的`router`，挂载到`Vue`的**原型链**上

```javascript
Vue.mixin({
  beforeCreate() {
    // 这个钩子函数在每个组件创建实例时都会调用，但只有根组件被加入了router
    if (this.$options.router) {
      Vue.prototype.$router = this.$options.router;
    }
  },
});
```

3. 全局声明`router-link`组件和`router-view`组件
   - 3.1. `router-link`组件：只做展示，点击时更新 url
     `this.$slots.default`是一个`虚拟dom`构成的`数组`
   - 3.2. `router-view`组件：url 变化时，展示的组件对应改变，Vue 最大的特点是响应式，而组件每次渲染都是调用了`render`函数，因此我们希望将来某个数据变化时能够触发`render`执行，这部分内容在`new VueRouter(...)`时操作

## 2.new VueRouter(...) 做了哪些事情

`new VueRouter(...)`返回的实例将来要挂载到 Vue 的原型链上，即组件中用的`this.$router`

1. 定义一个响应式的数据`current`，改变时触发 `observer`身上的的`watcher`执行，而`watcher`的收集机制是借助了`getter`函数的执行
2. Vue 提供了定义响应式的方法：`Vue.util.defineReactive`

   核心代码如下：

```javascript
// 定义响应式数据
Vue.util.defineReactive(this, 'current', initial);

Vue.component('router-view', {
  render(h) {
    let component = null;
    // 调用一次getter，观察者会将render函数收集
    const route = this.$router.$options.routes[this.$router.current];
    if (route) {
      component = route.component;
    }

    return h(component);
  },
});
```

2. 监听路由改变

因为此时`current`已经是响应式数据，所以改变时会自动触发`watcher`更新：即`<router-view />`更新

```javascript
window.addEventListener('hashchange', () => {
  this.current = window.location.hash.slice(1);
});
```

# 思考与总结

1. 定义响应式数据的方式除了`Vue.util.defineReactive`还有哪些？`Vue.util.defineReactive`如何用？

- 1.1. 创建一个 Vue 对象

```javascript
const state = new Vue({
  data: { count: 0 },
});
```

- 1.2. Vue.observable

```javascript
const state = Vue.observable({ count: 0 });
```

- 1.2. 首先给**对象**添加一个 **key** 及 **初始值**，当某个函数调用 `getter` 时会被`Observer`收集到`依赖`中，后续属性变化时会自动执行`依赖函数`

2. `mixins`的妙用：延迟执行
   由于混入组件的内容与当前组件容易出现**命名冲突**、以及**方法变量来源不明**，一直以来都对这个 api 绕着走。今天才发现了原来还有这么妙的使用方式，最开始以为是借助**事件总线**做的延迟执行，直到看了源码的这部分，恍然大悟的感觉

3. 嵌套`<router-view/>`如何处理
   [点这里](https://github.com/vuejs/vue-router/blob/dev/src/components/view.js#L29)

每一个`<router-view/>`组件在`data`中都会多一个属性`routerView`，存在即表示当前组件是<router-view />
创建变量`depth`，通过`while`循环向上遍历，计算当前匹配成功的`深度`，同时也表示当前路由匹配的索引
`$router.matched`是一个数组，表示当前匹配成功的组件，`$router.matched[depth]`就是当前深度的匹配组件，也就是要渲染的内容

4. 当前`webpack`环境为什么在`Vue.component`中不能用`template`?
   当前执行环境基于 `webpack`，默认情况下，`webpack` 打包的 `vue` 版本是 `runtime` 版本，不携带 `compiler`
