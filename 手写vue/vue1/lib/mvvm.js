import { observe } from './Observer.js';
import Compile from './Compile.js';

export default class MVVM {
  constructor(options) {
    this.$options = options;
    this._data = options.data;
    // + 挂载methods
    this.$methods = options.methods || {};

    observe(this._data);

    proxy(this);

    new Compile(options.el, this);
  }
}

function proxy(vm) {
  // 代理 data
  Object.keys(vm._data).forEach(key => {
    Object.defineProperty(vm, key, {
      get() {
        return vm._data[key];
      },
      set(newVal) {
        vm._data[key] = newVal;
      },
    });
  });
  // + 代理 methods
  Object.keys(vm.$methods).forEach(method => {
    Object.defineProperty(vm, method, {
      get() {
        return vm.$methods[method].bind(vm);
      },
    });
  });
}
