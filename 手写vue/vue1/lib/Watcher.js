import Dep from './Dep.js';

export default class Watcher {
  constructor(obj, key, updateFn) {
    this.vm = obj;
    this.key = key;
    this.updateFn = updateFn;

    // 注册进Dep
    Dep.target = this;
    this.vm[this.key];
    Dep.target = null;
  }
  update() {
    this.updateFn.call(this.vm, this.vm[this.key]);
  }
}
