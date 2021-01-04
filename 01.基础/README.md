# 生命周期

## 初始化 + 更新 + 销毁

初始化： beforeCreate，create，beforeMount，mounted

- beforeCreate 实例未创建，通常用于 **插件开发** 中执行一些初始化任务
- create 实例已创建，各种数据可获取，通常用于 **异步数据调用**
- beforeMount 未执行渲染，此时 **dom 还未创建**
- mounted 初始化结束，**可以获取到 dom**

更新：beforeUpdate + updated

- beforeUpdate 更新执行前的 **旧数据**
- updated 更新完毕

销毁：beforeDestory + destoryed

- beforeDestory 销毁前，此时**dom 还存在**，**可用于销毁定时任务、取消订阅**
- destoryed 销毁后，**此时 dom 不存在**

# 组件化

软件工程中一个原则：高内聚，低耦合。

1. 定义：可复用的 Vue 实例，准确讲是 VueComponent 的实例，继承自 Vue
2. 优点
3. 场景
4. 如何用
   4.1. 定义
   4.2 分类
   4.3 通信
   4.4. 内容分发
   4.5. 使用及优化
5. 本质
   组件配置=》VueComponent 实例=》render()=》Virtual Dom =》Dom
   所以组件的本质是产生虚拟 Dom

## 双向绑定

v-model 会被解析如下

```javascript
    <input :value="value" @input="value = $event"/>
```

实现双向绑定

```javascript
<customer-component v-model="val" />
```

```javascript
Vue.component('customer-component', {
  props: ['value'],
  methods: {
    emitChange() {
      this.$emit('input', this.value + 'change');
    },
  },
});
```

## 事件总线

## 节点引用

ref 作为渲染结果创建，在初始渲染时不能访问

$ref 不是响应式，不要试图在模板中数据绑定

v-for 中使用时是组件实例的数组

# 指令

```javascript
const role = "admin"
Vue.directive("permission", {
    bind() {
        // 第一次绑定到元素时调用
    },
    inserted(el, binding) {
        console.log("参数", binding.value);
        if(binding.value !== role) {
           el.parentElement.removeChild(e);
        }
        el.focus();
    }，
    update() {
        // VNode更新前调用
    }，
    componentUpdated() {
        // VNode更新完成后调用
    },
    unbind() {
        // 解绑时调用
    }
})

<input v-permission="admin">
```

# 渲染函数

h：虚拟 dom 在底层的算法是 snabbdom，源码中就是命名为 h

```javascript
Vue.component('header', {
  redner(createElement) {
    return createElement(
      tag, // 标签名称
      data, // 传递数据
      children // 子节点数组
    );
  },
});
```

# 函数组件

无状态，无监听，无生命周期

```javascript
Vue.component('heading', {
  functional: true,
  props: {},
  render(h, context) {
    const { title } = context.props;
    return h('h1', { class: 'head' }, [h('p', { class: 'head-title' }, title)]);
  },
});
```

# 插件

vuex、vue-router

## 插件声明：install

```
MyPlugin.install = function (Vue,options) {
  Vue.myGlobalMethod = function () {};
  Vue.directive("", });
  Vue.mixin({});
  Vue.prototype.myMethod = function () {};
}
```

# vue-cli

## 相对路径

- 相对路径时 webpack 处理资源路径
- 绝对路径不处理
- ～开头会作为一个模块解析
- @别名依然会作为相对路径处理

## publicPath

- html 中
  <%= BASE_URL %>
- 组件或 js 中
  process.env.BASE_URL

## css 预处理器

在 loader 中瑜伽在 imports.scss，内部包含所有 css 变量

```javascript
const path = require('path');
function addStyleResource(rule) {
  rule
    .use('style-resource')
    .loader('style-resources-loader')
    .options({
      patterns: [path.resolve(__dirname, './src/styles/imports.scss')],
    });
}
module.exports = {
  chainWebpack: config => {
    const types = ['vue-modules', 'vue', 'normal-modules', 'normal'];
    types.forEach(type => addStyleResource(config.module.rule('scss').oneOf(type)));
  },
};
```

## scoped css

### 原理：利用 postcss 在 css 中加入选择器，

```css
.header[data-v-efbmnvbs] {
  //...
}
```

### 深度作用选择器

```css
<style scoped>
  #app >>> p {
    // ...
  }
</style>
```

## CSS Module

```css
<style module lang="scss">
  .red {
    // ...
  }
</style>
```

模板通过 `$style` 访问

```html
<template>
  <div :class="['container', $style.red]"></div>
</template>
```

# 路由

## 嵌套路由

layout.vue

```javascript
<div>
  <menu />
  <router-view />
</div>
```

## 数据获取时机

1. 路由导航前
   1.2. beforeRouteEnter 组件未渲染
   1.3. beforeRouteUpdate 组件已渲染
2. 路由导航后
   2.1. created
   2.2. watch

## 动态路由

运行时动态添加路由

### 场景：根据权限动态添加

```javascript
login() {
  this.$router.addRoutes({
    // ...
  })
}
```

## 组件缓存

- includes 对应 组件的 **name**
- max 当数量到达最大时，路由会把第一个删除

```javascript
<keep-alive includes="admin,detail,login" max="10">
  <router-view />
</keep-alive>
```

# vuex

## 映射方法

```javascript
computed: {
  ...mapActions(["user/login"])
}

created() {
  this["user/login"]({
    username: ""
  }).then(res => {
    // ...
  })
}
```

## 派生状态：getters

模块化时可能会出现重复，因此每个`module`下的`getters`不能重复命名

## 配合表单

```javascript
<input v-model="message" />
```

```javascript
computed: {
  get() {
    return this.$store.state.form.message
  },
  set(value) {
    this.$store.dispatch("updateMessage", value)
  }
}
```

```javascript
// ...
mutations: {
  updateMessage (state, message) {
    state.obj.message = message
  }
}
```

## 插件

应用：状态仓库持久化

```javascript
const persist = store => {
  // store初始化时将localStorage中的状态还原
  if (localStorage) {
    const user = JSON.stringify(localStorage.getItem('user'));
    store.commit('login', user.username);
  }
  // store订阅
  store.subscribe((mutation, state) => {
    // ..
    if (mutation.type === 'user/login') {
      const user = JSON.stringify(state.user);
      localStorage.setItem('user', user);
    } else if (mutation.type === 'user/logout') {
      localStorage.removeItem('user');
    }
  });
};
```

```javascript
new Vuex.Store({
  modules: { user },
  strict: true,
  plugins: [persist],
});
```
