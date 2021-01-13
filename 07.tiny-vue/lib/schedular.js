// 异步任务
export const callbacks = new Set();
let pending = false;
let waiting = false;

export function queueWatcher(flushSchedulerQueue) {
  callbacks.add(flushSchedulerQueue);
  if (!waiting) {
    waiting = true;

    nextTick(flushSchedulerQueue);
  }
}

function flushCallbacks() {
  waiting = pending = false;

  const copied = new Set(...new Array(callbacks));
  callbacks.clear();

  copied.forEach(task => task());
}

export function nextTick(cb, ctx) {
  callbacks.add(cb);

  if (!pending) {
    pending = true;
    // 启动异步任务
    timerFunc();
  }
}

const p = Promise.resolve();
function timerFunc() {
  p.then(flushCallbacks);
}
