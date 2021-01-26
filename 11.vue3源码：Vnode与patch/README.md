# 编译器

AST 与虚拟 dom 相似但不同
模板在转换 render 时的中间产物，一旦创建 render 将不再存在

发生在

1. vue-loader 转换 SFC 时
2. finishComponentSetup =》 compileToFunction

baseCompile

- generate：得到字符串拼接形式的函数

## 相比 vue2 的优化

### 静态节点提升

### 补丁标记和动态属性记录

### 缓存事件处理程序

### block

记录动态的节点，保存到 dynamicChildren，diff 时只操作这里的节点

可以多个

# 新的 Vnode

children 和 props 的动态记录

patchFlag 是一个二进制数字，表示更新的内容

shapeFlag 表示是组件还是 teleport
shapeFlag 是一堆位运算符

type 浏览器标签改用 Symbol，组件该用对象

一次性掐头，一次性去尾，新增/删除、通用处理

# 异步更新策略

`runtime-core/src/renderer.ts`中的 setupRenderEffect 中为 instance.update 提供了更新函数

`setter`时触发`trigger`的`run` 函数，根据`effect.options.scheduler`选择**异步**或者**同步**：**queueJob**和**effect**

异步策略改为直接使用 `promise.then`
