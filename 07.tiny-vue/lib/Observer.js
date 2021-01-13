import { arrayMethods } from './array.js';
import Dep from './Dep.js';
import { def } from './utils.js';

class Observer {
  constructor(value) {
    this.value = value;

    this.dep = new Dep();
    // 指定ob实例
    def(value, '__ob__', this);

    if (Array.isArray(value)) {
      // 覆盖原型方法
      value.__proto__ = arrayMethods;
      this.observeArray(value);
    } else {
      this.walk(value);
    }
  }

  walk(value) {
    Object.keys(value).forEach(key => {
      defineReactive(value, key, value[key]);
    });
  }

  observeArray(arr) {
    for (let i = 0, l = arr.length; i < l; i++) {
      observe(arr[i]);
    }
  }
}

export function defineReactive(obj, key, val) {
  const dep = new Dep(); // 监听对象key对应val的变化

  let childOb = observe(val);

  Object.defineProperty(obj, key, {
    get() {
      if (Dep.target) {
        dep.depend();
        if (childOb) {
          childOb.dep.depend();
          if (Array.isArray(val)) {
            dependArray(val);
          }
        }
      }
      return val;
    },
    set(newVal) {
      if (val !== newVal) {
        val = newVal;

        childOb = observe(newVal);

        dep.notify();
      }
    },
  });
}
export function observe(value) {
  if (value === null || typeof value !== 'object') return;

  let ob;
  if (value.__ob__ && value.__ob__ instanceof Observer) {
    ob = value.__ob__;
  } else {
    ob = new Observer(value);
  }
  return ob;
}

function dependArray(value) {
  for (let e, i = 0, l = value.length; i < l; i++) {
    e = value[i];
    e && e.__ob__ && e.__ob__.dep.depend();
    if (Array.isArray(e)) {
      dependArray(e);
    }
  }
}
