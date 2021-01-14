import Dep from './Dep.js';
import { arrayProto } from './array.js';
class Observer {
  constructor(_data) {
    //
    if (Array.isArray(_data)) {
      // todo
      this.observeArray(_data);
    } else {
      this.walk(_data);
    }
  }
  walk(data) {
    Object.keys(data).forEach(key => {
      defineReactive(data, key, data[key]);
    });
  }
  observeArray(data) {
    // 覆盖原型方法
    data.__proto__ = arrayProto;
    // 对数组内部元素执行响应化
    for (let item of data) {
      observe(item);
    }
  }
}

export function observe(data) {
  //
  if (data === null || typeof data !== 'object') return;

  return new Observer(data);
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

export function def(obj, key, val, enumerable) {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: !!enumerable,
    writable: true,
    configurable: true,
  });
}
