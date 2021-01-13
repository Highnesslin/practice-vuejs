import { defineReactive, observe } from './Observer.js';
import patch from './patch.js';
import Watcher from './Watcher.js';
import { nextTick } from './schedular.js';

export default class Vue {
  constructor(options) {
    this.$options = options;
    this._data = options.data;

    this._init();
  }

  _init() {
    // 数据响应式
    observe(this._data);

    proxy(this, '_data');

    // 完成挂载
    if (this.$options.el) {
      this.$mount();
    }
  }

  $mount() {
    this.$el = document.querySelector(this.$options.el);
    this.mountComponent();
  }

  mountComponent() {
    const updateComponent = () => this.update(this._render());

    new Watcher(this, updateComponent);
  }

  _render() {
    return this.$options.render.call(this, this.createElement);
  }

  createElement(tag, attrs, children) {
    children = Array.isArray(children)
      ? children.map(v => {
          return typeof v === 'number' ? String(v) : v;
        })
      : typeof children === 'number'
      ? String(children)
      : children;

    children = typeof children === 'number' ? String(children) : children;
    return { tag, attrs, children };
  }

  update(vnode) {
    const prevVnode = this._vnode;
    //
    this._vnode = vnode;

    if (!prevVnode) {
      // init
      this.__patch__(this.$el, vnode);
    } else {
      // update
      this.__patch__(prevVnode, vnode);
    }
  }
}

Vue.prototype.__patch__ = patch;

Vue.prototype.$nextTick = nextTick;

Vue.prototype.$set = function (obj, key, val) {
  const ob = obj.__ob__;

  defineReactive(ob.value, key, val);

  ob.dep.notify();
};

function proxy(vm, key) {
  Object.keys(vm[key]).forEach(key => {
    Object.defineProperty(vm, key, {
      get() {
        return vm._data[key];
      },
      set(newVal) {
        vm._data[key] = newVal;
      },
    });
  });
}
