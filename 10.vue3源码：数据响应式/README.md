// createAppAPI(render) => rootComponent(vnode) => mount(container) => render(vnode, container) => patch => processComponent => mountComponent

缺点

1. 动态添加
2. 数组
3. 初始化时深层递归，速度慢
4. 无法监听 Map、Set

新的响应式原理
13 个 api 的拦截
速度提升一倍，内存占以前的 1/2

缺点：兼容性

- set
- get
- deleteProperty

`Reflect`是安全措施，保证操作的是原对象

vue2 的更新策略使得存在大量闭包关系
