###

resolve.alias 别名

html 中可以通过 webpackConfig 获得变量

process 是 nodejs 根据执行环境提供的不同的值

- configureWebpack(config)
- chainWebpack(config)

vue inspect --rules
vue inspect --rule svg

```javascript
require.context('./svg', false /*不递归*/, /\.svg$/);
```

### 可自动引用的图标组件

###

### 环境变量

.env.development
环境变量
客户端要获取的需要加 VUE*APP*做前缀

```javascript
vue-cli-service serve --model dev
```

对应文件是.env.dev

### 权限控制

动态路由表在后端的情况
前端做映射表
`v-permission`：无法处理 抽象组件
对于抽象组件：`v-if="checkPermission"`

### 数据交互

本地 mock
`devServer before(app)`

线上 mock
`easy-mock`

### 测试

文件名

### v-if 和 v-for

v-for 的优先级高于 v-if，在源码的`compiler`模块，有一个 codeGen 模块，其中对于指令的优先级如下：staticRoot>once>for>if>pre>slot
不同的编码会直接影响渲染函数的生成
若在同一个标签使用，生成的 render 函数会先遍历 v-for 的内容，然后在循环内部进行 v-if 的执行
若 v-if 在上面，则生成一个三目表达式，满足条件执行 v-for，否则执行一个空函数
而渲染函数可能会频繁执行，因此优化 render 函数会得到很大的性能提升，最好的编码是通过 computed 判断输出的数组，然后执行 v-for
