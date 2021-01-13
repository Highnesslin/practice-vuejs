import { def } from './utils.js';

// 获取数组原型
const arrayProto = Array.prototype;
// 克隆一份
export const arrayMethods = Object.create(arrayProto);
// 7个mutation方法
const methodsToPatch = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'];

methodsToPatch.forEach(function (method) {
  // cache original method
  // 1.保存原始方法
  const original = arrayProto[method];
  def(arrayMethods, method, function mutator(...args) {
    // 先执行原始方法
    const result = original.apply(this, args);

    // 获取ob实例
    const ob = this.__ob__;
    // 判断当前是否是插入操作
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
    // 新加入的对象需要做响应式处理
    if (inserted) ob.observeArray(inserted);
    // 通知更新
    ob.dep.notify();
    return result;
  });
});
