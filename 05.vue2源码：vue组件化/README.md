# 组件化

两种声明方式

- 局部
- 全局
  将 components 放入全局默认配置，通过 mergeOptions 给每个组件中添加

## 问题

1. Vue.Component 为什么可以全局使用
   默认选项加入
   `mergeOptions` =>

2. Comp => vnode => ... => dom 如何做的

3. vnode 和 componentInstance 是什么关系
   vnode

## 起点 `/src/core/global-api/index.js` => Vue.component

`initAssetRegisters`

作用：注册方法 `Vue.component`、`Vue.filter`、`Vue.directive`

其中`Vue.component`的核心代码：

```javascript
Vue[type] = function (id, definition) {
  if (type === 'component' && isPlainObject(definition)) {
    definition.name = definition.name || id;
    // 调用 Vue.extend 转换成 VueComponent，将来使用时 new VueComponent 即可
    definition = this.options._base.extend(definition);
  }
};
```

`Vue.extend`返回的是 VueComponent，将来使用时 new VueComponent 即可获取**组件实例**
有了组件实例，将来挂载组件：render => update => patch
存在父子关系时，生命周期执行顺序：create/destory 自上而下（深度优先），mount（从下向上）

Vue.component 的作用：向`Vue.options`中添加**组件**，`Vue.options`是全局的`components`，包括：KeepAlive、Transition、TransitionGroup、...自定义组件，
将来**Vue 组件**在调用`mergeOptions`时将这些**全局组件**挂载到**Vue 组件**的`components`属性上，以此达到**全局组件**的作用

# 自定义组件 在编译阶段有何区别 (组件如何变成虚拟 dom)

`template` 到 编译后的`render` 变化

```javascript
<template>
  <div id="demo">
    <h1>Vue组件化机制</h1>
    <comp></comp>
  </div>
</template>
```

```javascript
(function anonymous() {
  with (this) {
    return _c(
      'div',
      { attrs: { id: 'demo' } },
      [_c('h1', [_v('Vue组件化机制')]), _v(' '), _c('comp')],
      1
    );
  }
});
```

可以看到对于自定义组件和 host 组件都采用了同样的处理方法：即类似 `createElement(tag)` 的方式，由此可见，答案在`createElement`中（这里的`_c`就是`createElement`的**柯里化处理**）

<!-- ---------------------------------------------------------------------------------------------------------------------------------------- -->

ps: `_c` `_v` 为何物

`instance/renderhelpers`
提供了方法别名
`renderList`：v-for
`_v` 创建文本
`_s` 格式化

`initRender`给实例声明一些方法：`createElement`、`_c`
`vm._c = (...) => createElement(...)`

<!-- ---------------------------------------------------------------------------------------------------------------------------------------- -->

## createElement `vdom/createElement`

- 作用：产生 **虚拟 dom**
- 流程：
  - 1. 对于**自定义组件**执行`createComponent`
  - 2. 对于`host组件`直接`new VNode`

核心代码：

```javascript
let vnode;
if (typeof tag === 'string') {
  // host 节点
  if (config.isReservedTag(tag)) {
    vnode = new VNode(
      config.parsePlatformTagName(tag),
      data,
      children,
      undefined,
      undefined,
      context
    );
  } else if (
    (!data || !data.pre) &&
    isDef((Ctor = resolveAsset(context.$options, 'components', tag))) // 获取自定义组件的构造函数
  ) {
    // 自定义组件
    vnode = createComponent(Ctor, data, context, children, tag);
  }
} else {
  // 直接传递组件的配置对象或构造函数
}
```

## createComponent

作用：产生虚拟 dom
位置：`src/core/vdom/create-component.js`

```javascript
export function createComponent(
  Ctor: Class<Component> | Function | Object | void,
  data: ?VNodeData,
  context: Component,
  children: ?Array<VNode>,
  tag?: string
) {
  let asyncFactory;
  if (isUndef(Ctor.cid)) {
    asyncFactory = Ctor;
    Ctor = resolveAsyncComponent(asyncFactory, baseCtor);
    if (Ctor === undefined) {
      // 异步组件的占位符
      return createAsyncPlaceholder(asyncFactory, data, context, children, tag);
    }
  }

  // 组件身上有双向绑定，要额外声明 事件类型 和 属性名称
  if (isDef(data.model)) {
    transformModel(Ctor.options, data);
  }

  // 分离原生事件和自定义事件
  const listeners = data.on;
  // replace with listeners with .native modifier
  // so it gets processed during parent component patch.
  data.on = data.nativeOn;

  // 安装自定义组件的钩子
  installComponentHooks(data);

  // 返回 虚拟dom
  const name = Ctor.options.name || tag;
  const vnode = new VNode(
    `vue-component-${Ctor.cid}${name ? `-${name}` : ''}`,
    data,
    undefined,
    undefined,
    undefined,
    context,
    { Ctor, propsData, listeners, tag, children },
    asyncFactory
  );

  return vnode;
}
```

由于`createElement`发生在`render`函数阶段，`render`返回的**虚拟 dom**会作为参数传递进`_update`，`_update`做了两件重要的事情

1. 保存一份虚拟 dom 存到`_vnode`中，下次直接取出来使用
2. 调用`__patch__`，将`_vnode`取出传递进去

而`patch`分为两种情况，初始化时调用`createElm`，更新时调用`patchVnode`，既然上一步已经得到了**虚拟 dom**并且存储起来，后面要做的就只是`diff`，就和**组件**没有太多关联了，因此关键在于`createElm`

### patch 中的 createElm

对于**组件处理**的核心代码：

```javascript
function createElm(vnode, insertedVnodeQueue, parentElm, refElm, nested, ownerArray, index) {
  // 如果是自定义组件，则创建
  if (createComponent(vnode, insertedVnodeQueue, parentElm, refElm)) {
    return;
  }

  // 下面处理host组件
}
```

到这里发现又回到了`createComponent`，一想到之前也有遇到类似的情景，`$mount`函数也有过函数覆盖的情况，于是看了一下文件路径，发现在`src/core/vdom/patch.js`

- createComponent() - src/core/vdom/create-component.js
  组件 vnode 创建
- createComponent() - src/core/vdom/patch.js
  创建组件实例并挂载，vnode 转换为 dom

<!-- 之前有研究，`createComponent`是`createElement`中对于**自定义组件**情况的处理，最终也是产生**虚拟 dom**，所以到这里，组件化的基本过程也就结束了， -->

### 另一个 createComponent

作用：将**虚拟 dom**转换成**真实 dom**
位置：`src/core/vdom/patch.js`

源码不复杂：

```javascript
function createComponent(vnode, insertedVnodeQueue, parentElm, refElm) {
  let i = vnode.data;
  if (isDef(i)) {
    const isReactivated = isDef(vnode.componentInstance) && i.keepAlive;
    // 前面安装的钩子在hook中，只有自定义组件有init函数，执行init函数后调用组件的$mount
    if (isDef((i = i.hook)) && isDef((i = i.init))) {
      i(vnode, false /* hydrating */);
    }
    // after calling the init hook, if the vnode is a child component
    // it should've created a child instance and mounted it. the child
    // component also has set the placeholder vnode's elm.
    // in that case we can just return the element and be done.
    if (isDef(vnode.componentInstance)) {
      initComponent(vnode, insertedVnodeQueue);
      insert(parentElm, vnode.elm, refElm);
      if (isTrue(isReactivated)) {
        reactivateComponent(vnode, insertedVnodeQueue, parentElm, refElm);
      }
      return true;
    }
  }
}
```

这里执行了钩子函数，
于是我们去前面寻找安装的钩子的地方

### installComponentHooks

作用：安装钩子，注意是安装，不是执行

```javascript
function installComponentHooks(data: VNodeData) {
  const hooks = data.hook || (data.hook = {});
  // 合并用户和默认的管理钩子
  for (let i = 0; i < hooksToMerge.length; i++) {
    const key = hooksToMerge[i];
    const existing = hooks[key];
    const toMerge = componentVNodeHooks[key];
    if (existing !== toMerge && !(existing && existing._merged)) {
      hooks[key] = existing ? mergeHook(toMerge, existing) : toMerge;
    }
  }
}
```

#### hooksToMerge： init、prepatch、insert、destory

keepAlive 组件的实现原理关键在`init`部分：不需要重新创建组件，放在缓存中

- init

  ```javascript
  const child = (vnode.componentInstance = createComponentInstanceForVnode(vnode, activeInstance));
  child.$mount(hydrating ? vnode.elm : undefined, hydrating);
  ```

在 hook 中，只有自定义组件有 init 函数，执行 init 函数后调用组件的$mount

区别：自定义组件有钩子和 data

因此自定义组件和组件在渲染阶段的区别主要是，根组件执行`$mount` => `patch` => `createElm` 向下递归，如果遇到**host 组件**，直接 createElement（web 平台的情况），
若遇到自定义组件，则调用子组件的 钩子： init 方法

## 整体流程

1. 定义：`Vue.component` => `通过Vue.extend获取VueComponent` => `添加到Vue.options.components中`
2. 初始化：`vm._update(vm.render())` => `createElement` => `createComponent` => `__patch__` => `createElm` => `createComponent` => 执行组件的钩子函数 `init`
3. 更新：递归到组件时执行组件的钩子函数

## 思考与总结

1. 组件化的本质是什么？<br/>
   产生**虚拟 dom**

2. 我看到用于**产生虚拟 dom**的`createComponent`中对**事件的监听**做了单独做了处理，父子组件通信时绑定的事件如何处理的？<br/>
   父子组件通过**事件通信**时，事件的绑定和触发都发生在**子组件**身上

3. 我看到用于**产生真实 dom**`createComponent`中，处理钩子函数时专门对`KeepAlive`做了处理，其实现原理是什么？<br/>
   init 时如果发现有是`KeepAlive`组件，则尝试从缓存中取，并且由于钩子函数的存在，可以做很好的动效处理，近期有个需求需要在 **react** 中实现`KeepAlive`，留个 flag，以后专门研究一下`KeepAlive`的实现原理

4. 为什么说尽量少地声明全局组件？<br/>
   由**Vue 组件化**的原理可以看到，通过`Vue.component`声明的全局组件会先执行`Vue.extends`创建出**VueComponent**，然后存放在`Vue.options.components`中，并且初始化创建**Vue 组件**时再通过`mergeOptions`注入到**Vue 组件**的`components`选项中，因此，如果全局组件过多会占用太多资源和事件，导致首屏加载不流畅或白屏时间过长的问题。

5. 组件拆分粒度的问题<br/>
   Vue 的更新策略是：当**依赖**的数据发生改变时触发**当前组件**的`render`，

   其实反观**Vue1**，不需要**虚拟 dom**，可以**精准更新**的，这是最理想化的更新，但是由于太多**Watcher**占用了内存而无法开发大型项目，因此到了**Vue2**被摒弃，**快速 diff**和**占用资源**总得有所取舍，奈何本人修炼不够，暂时还没想到特别好的方案
