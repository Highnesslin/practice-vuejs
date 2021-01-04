let Vue;

class Store {
  constructor(options) {
    this._mutations = options.mutations;
    this._actions = options.actions;

    this.commit = this.commit.bind(this);
    this.dispatch = this.dispatch.bind(this);

    // + 获取computed，后续放入Vue的options参数中
    this.getters = options.getters;
    const computed = this.initialGetters();

    // + 新增getters
    this._vm = new Vue({
      data: {
        $$state: options.state,
      },
      computed,
    });
  }

  get state() {
    return this._vm._data.$$state;
  }

  set state(v) {
    console.error('please use replaceState to reset state');
  }

  // + 处理getters
  initialGetters() {
    const computed = {};

    Object.keys(this.getters).forEach(key => {
      const fn = this.getters[key];

      computed[key] = () => fn(this.state);

      // 将getters中属性的获取代理到vue
      Object.defineProperty(this.getters, key, {
        get: () => this._vm[key],
      });
    });

    return computed;
  }

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
}

// Vue.use
// install.apply(this, [this,...])
function install(_Vue) {
  Vue = _Vue;

  Vue.mixin({
    beforeCreate() {
      if (this.$options.store) {
        Vue.prototype.$store = this.$options.store;
      }
    },
  });
}

export default { Store, install };
