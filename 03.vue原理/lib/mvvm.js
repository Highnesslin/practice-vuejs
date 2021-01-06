import { observe, defineReactive } from './Observer.js';
import Compile from './Compile.js';

export default class MVVM {
  constructor(options) {
    this.$options = options;
    this._data = options.data;
    this.$methods = options.methods || {};

    observe(this._data);

    proxy(this);

    new Compile(options.el, this);
  }
}

MVVM.set = defineReactive;

function proxy(vm) {
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
}
