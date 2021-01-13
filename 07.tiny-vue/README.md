# 数据响应式

## 数组

1. 方法覆盖<br>
   7 个方法执行时加入如下操作：
   1. 对新加入的内容执行`observe`
   2. 拿到当前对象的 **ob 实例**，执行其**dep**的`notify`方法
2. 执行数组的`getter`时给**数组**每一项的**dep**添加**watcher**

# $nextTick、$set

# 虚拟 dom

# 异步更新

# 一些小细节

```javascript
// data.__ob__ = this; // 注意上下两种写法意义不一样
def(data, '__ob__', this);
```
