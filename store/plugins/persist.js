import { getFromCache, saveToCache } from './cache.js';

export default sign => {
  // 工具函数
  function isPersist(type) {
    return type.startsWith(sign);
  }

  function hasLocalStroage() {
    return window && window.localStorage;
  }

  return store => {
    console.log(store);
    // 初始化时
    if (hasLocalStroage() && store._actions) {
      Object.keys(store._actions).forEach(type => {
        if (!isPersist(type)) return;

        const obj = getFromCache(type);
        if (obj) {
          console.log('commit', obj);
          store.commit(type, obj);
        }
      });
    }

    // 订阅变更
    store.subscribe((mutation, state) => {
      console.log('mutation', mutation);
      // 有持久化存储的标志
      if (isPersist(mutation.type)) {
        console.log(mutation);
        saveToCache(mutation.type, mutation.payload);
      }
    });
  };
};
