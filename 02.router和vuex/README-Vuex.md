# 使用

```javascript
// 1.使用Vuex插件
Vue.use(Vuex);

// 2.创建store实例
new Vuex.Store({
  state: {
    counter: 0,
  },
  mutations: {
    add(state) {
      state.counter++;
    },
  },
  actions: {
    add({ commit }) {
      setTimeout(() => {
        commit('add');
      }, 1000);
    },
  },
  getters: {
    doubleCounter(state) {
      return state.counter * 2;
    },
  },
});

// 3.配置到选项中
new Vue({
  // ...其他options
  router,
  render: h => h(App),
}).$mount('#app');
```

# 问题

1. 为什么要先注册插件:`Vue.use(Vuex)`
2. `new Vuex.Store(...)`做了哪些事情
3. `mutations`参数中的`state`从哪里来
4. `actions`参数中解构出了`commit`,`commit`是什么，从哪里来？

# 原理

## state

(源码中这样操作)[https://github.com/vuejs/vuex/blob/1c693b6c917d1420032ad2c95680ce38ff2e6bff/src/store.js#L308]

```javascript
store._vm = new Vue({
  data: {
    $$state: state,
  },
});
```

`Vue响应式模块`对于`$$`开头的属性，不代理到`Vue`上面，因此 **vue 实例** 不能直接访问到`$$`开头的属性，起到了保护变量的作用，只允许通过`actions`和`mutations`来更新`state`

## getters

`getters`在使用的时候，是不是就已经发现和 `Vue` 的`computed`很像了，没错，`Vuex`内部对于`getters`的实现同样是借助了`computed`，
而`computed`为何物？其实只是把我们写的`computed函数`经过简单包装后赋值给`Object.defineProperty`中第三个参数的`get方法`，
源码中的操作也很简单，将`getters`简单处理后，直接赋值给`new Vue`的`computed`属性即可

(源码在这里)[https://github.com/vuejs/vuex/blob/1c693b6c917d1420032ad2c95680ce38ff2e6bff/src/store.js#L290]

核心代码其实就是这样

```javascript
const computed = {};

Object.keys(this.getters).forEach(key => {
  const fn = this.getters[key];

  computed[key] = () => fn(this.state);

  // 将getters中属性的获取代理到vue
  Object.defineProperty(this.getters, key, {
    get: () => this._vm[key],
  });
});
store._vm = new Vue({
  // ... state: {$$state: state}
  computed,
});
```

## mutation 和 actions

这部分没有太过于复杂

核心实现如下

```javascript
  commit(type, payload) {
    const entry = this._mutations[type];
    if (!entry) {
      console.error('unkown mutation type');
    }

    entry(this.state, payload);
  }

  dispatch(type, payload) {
    const entry = this._actions[type];
    if (!entry) {
      console.error('unkown action type');
    }

    entry(this, payload);
  }
```

# 思考与总结

1. `Vue`的`computed`不是魔法
2. 为什么设置属性名为`getters`，其他名称不可以吗
   不可以，`getters`
3. `Vue`的`data`中`$$XX`和`XX`的区别
   `$$XX`将不会被`Vue`代理到`this`，直接通过`this.$$XX`无法获取，但是可以通过`_data`获取
4. `store`中的数据可以直接被修改吗
   可以，并且还是响应式变化，但项目变大时将变得很难维护
5. 写`Vue组件`越熟悉底层原理越有优势
