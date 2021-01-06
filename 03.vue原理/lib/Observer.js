import Dep from './Dep.js';

class Observer {
  constructor(_data) {
    //
    if (Array.isArray(_data)) {
      // todo
    } else {
      this.walk(_data);
    }
  }
  walk(data) {
    Object.keys(data).forEach(key => {
      defineReactive(data, key, data[key]);
    });
  }
}

export function observe(data) {
  //
  if (data === null || typeof data !== 'object') return data;

  new Observer(data);
}

export function defineReactive(obj, key, val) {
  observe(val);

  const dep = new Dep();
  Object.defineProperty(obj, key, {
    get() {
      if (Dep.target) {
        dep.addDeps(Dep.target);
      }
      return val;
    },
    set(newVal) {
      if (val !== newVal) {
        val = newVal;
        dep.notify();
      }
    },
  });
}
