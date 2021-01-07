import Dep from './Dep.js';

const arrayEvent = ['push', 'pop', 'shift', 'unshift', 'splice'];
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
  observeArray(data) {
    //
    const arrayProto = Array.prototype;
    const arrayMethods = Object.create(arrayProto);

    arrayEvent.forEach(method => {
      const original = arrayProto[method];

      def(arrayMethods, method, function mutator(...args) {
        const result = original.apply(this, args);
        const ob = this.__ob__;
        let inserted;
        switch (method) {
          case 'push':
          case 'unshift':
            inserted = args;
            break;
          case 'splice':
            inserted = args.slice(2);
            break;
        }
        if (inserted) ob.observeArray(inserted);
        // notify change
        ob.dep.notify();
        return result;
      });
    });
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
