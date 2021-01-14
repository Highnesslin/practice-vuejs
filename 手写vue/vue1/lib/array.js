const originalProto = Array.prototype;
export const arrayProto = Object.create(originalProto);

// ['push', 'pop', 'shift', 'unshift', 'splice'].forEach(method => {
//   const original = arrayProto[method];

//   const result = original.apply(this, args);
//   //   const ob = this.__ob__;
//   let inserted;
//   switch (method) {
//     case 'push':
//     case 'unshift':
//       inserted = args;
//       break;
//     case 'splice':
//       inserted = args.slice(2);
//       break;
//   }
//   //   if (inserted) ob.observeArray(inserted);
//   // notify change
//   //   ob.dep.notify();
//   return result;
// });

['push', 'pop', 'shift', 'unshift', 'splice'].forEach(method => {
  arrayProto[method] = function () {
    // 执行原方法
    originalProto[method].apply(this, arguments);
    // 通知更新
    console.log('数组' + method + '更新');
  };
});
