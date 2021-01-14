import Dep from './dep.js';
import { queueWatcher } from './schedular.js';

export default class Watcher {
  constructor(vm, updateFn) {
    this.vm = vm;
    this.getter = updateFn;

    this.get();
  }

  get() {
    Dep.target = this;
    this.getter.call(this.vm);
    Dep.target = null;
  }

  update() {
    queueWatcher.call(this, this.getter);
  }
}
