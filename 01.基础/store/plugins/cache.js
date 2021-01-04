// 缓存处理函数
export function saveToCache(type, value) {
  if (value === undefined || value === null) return;

  value = typeof value === 'string' ? value : JSON.stringify(value);

  localStorage.setItem(type, value);
}

export function getFromCache(type) {
  const obj = localStorage.getItem(type);

  if (typeof obj === 'string') {
    return JSON.parse(obj);
  }

  if (['', 'null', 'undefined'].includes(obj)) {
    return null;
  }

  return obj;
}
