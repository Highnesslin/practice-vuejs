import Dep from './Dep.js';
import { def } from './utils.js';

class Observer {
  constructor(data) {
    this.value = data;

    // + 对象的dep，用于set时使用
    this.dep = new Dep();
    // 指定ob实例
    def(data, '__ob__', this);

    if (Array.isArray(data)) {
      // todo 数组的处理
    } else {
      this.walk();
    }
  }

  walk() {
    Object.keys(this.value).forEach(key => {
      defineReactive(this.value, key, this.value[key]);
    });
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
          // if (Array.isArray(value)) {
          //   dependArray(value)
          // }
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

  // +
  let ob;
  if (value.__ob__ && value.__ob__ instanceof Observer) {
    // 如果有直接复用
    ob = value.__ob__;
  } else {
    // 初始化创建一次
    ob = new Observer(value);
  }
  return ob;
}
