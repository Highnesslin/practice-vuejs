new Vue => createApp
$mount => mount
链式调用

多模块架构

浏览器用的是 umd
node 用的是 cjs/global/iife
自调函数 iife

webpack 使用的 esm

createApp => ensureRenderer => createRenderer

初始化 processComponent

setupComponet 相当于 原来 的 `_init`

setup > data

setRenderEffect 虚拟 dom => 真实 dom

渲染器包含三个方法
render
hydrate
createApp

## 开始

apiCreateApp.ts createAppApI render

ctx 是原对象
proxy 是响应式对象

初始化时 tag 是根组件

依赖注入 控制反转
