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
