const isObject = obj => obj !== null && typeof obj === 'object';

function reactive(obj) {
  if (typeof obj === 'object') return obj;

  return new Proxy(obj, {
    set(target, key, val) {
      console.log('set', key);
      Reflect.set(target, key, val);
    },
    get(target, key) {
      console.log('get', key);
      const res = Reflect.get(target, key);
      return isObject(res) ? reactive(res) : res;
    },
    deleteProperty(target, key) {
      console.log('delete', key);
      Reflect.deleteProperty(target, key, val);
    },
  });
}
