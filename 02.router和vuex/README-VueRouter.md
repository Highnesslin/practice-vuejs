# 写在前面

最近有时间，准备重新学习一下 vue，工作之余整理了一下对原理及源码的收获，在此记录一下，方便以后回来复习

ps:本篇文章以`vue2.6.x`、`vue3.2.x`为例

# 基本使用

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

1. 为什么要先注册插件，注册插件做了哪些事情:`Vue.use(VueRouter)`
2. `new VueRouter(...)`做了哪些事情
3. 全局的`<router-link />`组件和`<router-view />`组件是哪里来的

# 原理探究

## 1.为什么要先注册插件，注册插件做了哪些事情

1. `Vue.use`接收的参数是一个带有**函数 install**的对象，`install`包含参数`Vue`，将此参数保存，用于后续使用

   ```javascript
   VueRouter.install = function(_Vue) {
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
     ```javascript
     Vue.component('router-link', {
       props: {
         to: {
           type: String,
           required: true,
         },
       },
       render(h) {
         return h(
           'a',
           {
             attrs: {
               href: '#' + this.to,
             },
           },
           this.$slots.default // 虚拟dom构成的数组
         );
       },
     });
     ```
   - 3.2. `router-view`组件：url 变化时，展示的组件对应改变，Vue 最大的特点是响应式，而组件每次渲染都是调用了`render`函数，因此我们希望将来某个数据变化时能够触发`render`执行，这部分内容在`new VueRouter(...)`时操作

## 2.new VueRouter(...) 做了哪些事情

`new VueRouter(...)`返回的实例将来要挂载到 `Vue` 的**原型链**上，即组件中用的`this.$router`

1. 定义一个响应式的属性`current`，改变时触发 `<router-view />` 更新

2. Vue 提供了定义响应式数据的方法：`Vue.util.defineReactive`

   这个方法会给我们的属性添加`observer`，
   然后通过 `getter`函数 触发`watcher`的收集机制，将`<router-view />`的 render 方法收集到依赖中，
   这样每次更新时就会执行`render`函数，从而更新视图。

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

3. 监听路由改变

   ```javascript
   window.addEventListener('hashchange', () => {
     this.current = window.location.hash.slice(1);
   });
   ```

   因为此时`current`已经是响应式数据，所以改变时会自动触发`watcher`更新：即`<router-view />`更新

   到这里，**VueRouter**的基本原理就结束了。

# 思考与总结

## 1. 定义响应式数据的方式除了`Vue.util.defineReactive`还有哪些，有何区别？

- 1.1. 创建一个 Vue 对象

  ```javascript
  const state = new Vue({
    data: { count: 0 },
  });
  ```

  `state.count`就是响应式对象，可以直接在视图中使用

- 1.2. Vue.observable

  ```javascript
  const state = Vue.observable({ count: 0 });
  ```

  同样`state.count`是一个响应式对象，直接在视图中使用

- 1.3. 区别：`defineReactive`是`Vue`源码中的内容，并没有在[官方文档](https://cn.vuejs.org/)中出现过，而`observable`是**2.6**版本新出现的一个**API**，在低于 2.6 版本的 **Vue 项目** 中会报<font color="red">is not a function</font>的错误。所以保险起见，使用`defineReactive`或`new Vue(...)`比较好

## 2. `mixins`的妙用：延迟执行

- 2.1. 这里是给**全局**的`Vue`混入**生命周期**，因此每个组件都享用该`mixins`，需要在执行函数中加以判断，只在**根组件**中挂载`$router`

  ```javascript
  Vue.mixin({
    beforeCreate() {
      // 根实例才有该选项
      if (this.$options.router) {
        Vue.prototype.$router = this.$options.router;
      }
    },
  });
  ```

- 2.2. 由于混入组件的内容与当前组件容易出现**命名冲突**、以及**方法变量来源不明**，一直以来都对这个 api 绕着走。今天才发现了原来还有这么妙的使用方式，最开始以为是借助**事件总线**实现延迟执行，直到看了源码的这部分，才有了恍然大悟的感觉

## 3. 嵌套`<router-view/>`如何解决

[源码](https://github.com/vuejs/vue-router/blob/dev/src/components/view.js#L29)是这样处理的：

在 `VueRouter` 中新增一个响应式属性`matched`，每次路由变化时执行一个叫做`match`的函数用来匹配当前路由。

在`<router-view/>`组件中，给虚拟 dom 的`data`中添加一个属性`routerView`，表示当前组件是`<router-view />`

然后在 `render` 函数中，创建一个变量`depth`表示当前路由的**深度**，其计算方式是通过`while`循环向上遍历，遇到`<router-view />`就`+1`

最后，`<router-view/>`组件渲染时从`$router`中取出`matched`，根据`matched[depth]`就可以获取到当前 url 下对应深度的路由组件

核心代码：

VueRouter.js

```javascript
constructor(options) {
  this.$options = options;

  // 表示当前url
  this.current = window.location.hash.slice(1) || '/';
  // 定义一个响应式数组 matched，用来存储当前匹配的路由
  Vue.util.defineReactive(this, 'matched', []);
  this.match();

  // 每次hash改变都重置matched，然后重新匹配
  window.addEventListener('hashchange', () => {
    this.current = window.location.hash.slice(1);
    this.matched = [];
    this.match();
  });
}

match(routes) {
  routes = routes || this.$options.routes;

  for (const route of routes) {
    if (route.path === '/' && this.current === '/') {
      this.matched.push(route.component);
    } else if (route.path !== '/' && this.current.includes(route.path)) {
      this.matched.push(route.component);
    }
    if (route.children) {
      this.match(route.children);
    }
  }
}
```

keep-view (ps:源码中是函数式组件，这里为了简化就直接用非函数组件了)

```javascript
Vue.component('router-view', {
  render(h) {
    // <router-view /> 的标志
    this.$vnode.data.routerView = true;

    // 嵌套路由
    let depth = 0;
    let parent = this.$parent;
    while (parent) {
      const vnodeData = parent.$vnode ? parent.$vnode.data : {};
      if (vnodeData.routerView) {
        depth++;
      }
      parent = parent.$parent;
    }

    const component = this.$router.matched[depth];

    return component ? h(component) : null;
  },
});
```

## 4. 当前`webpack`环境在`Vue.component`中为什么不能用`template`?

在写`router-view`组件时，发现`template`无法使用，虽然不是`VueRouter`的内容，不过遇到了就总结下吧
在`webpack`环境中，默认情况下打包的 `vue` 是 `runtime` 版本，借助`loader`就完成了编译工作，并且`runtime`识别的是**render 函数**，因此没有 `compiler`模块，也就不能解析`template`
