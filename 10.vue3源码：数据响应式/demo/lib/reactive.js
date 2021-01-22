const isObject = obj => obj !== null && typeof obj === 'object';

function reactive(obj) {
  if (typeof obj !== 'object') return obj;

  return new Proxy(obj, {
    set(target, key, val) {
      Reflect.set(target, key, val);
      trigger(target, key);
    },
    get(target, key) {
      const res = Reflect.get(target, key);
      track(target, key);
      return isObject(res) ? reactive(res) : res;
    },
    deleteProperty(target, key) {
      Reflect.deleteProperty(target, key, val);
      trigger(target, key);
    },
  });
}
//
const effectStack = [];

function effect(fn) {
  const e = createReactiveEffect(fn);
  e();
  return e;
}

function createReactiveEffect(fn) {
  const effect = function () {
    try {
      effectStack.push(effect);
      return fn();
    } finally {
      effectStack.pop();
    }
  };
  return effect;
}

const targetMap = new WeakMap();

// 依赖追踪
function track(target, key) {
  const effect = effectStack[effectStack.length - 1]; // 考虑到effect互相嵌套的场景

  if (effect) {
    let depMap = targetMap.get(target);
    if (!depMap) {
      depMap = new Map();
      targetMap.set(target, depMap);
    }

    let deps = depMap.get(key);
    if (!deps) {
      deps = new Set();
      depMap.set(key, deps);
    }
    deps.add(effect);
  }
}

// 触发依赖
function trigger(target, key) {
  const depMap = targetMap.get(target);
  if (!depMap) return;

  const deps = depMap.get(key);
  if (!deps) return;

  deps.forEach(fn => fn());
}
