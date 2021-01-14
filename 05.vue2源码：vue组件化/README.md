# 组件化

两种声明方式

- 局部
- 全局
  将 components 放入全局，通过 mergeOptions 给每个组件中添加

## 问题

1. Vue.Component 为什么可以全局使用
   默认选项加入
   `mergeOptions` =>

2. Comp => vnode => ... => dom 如何做的

3. vnode 和 componentInstance 是什么关系
   vnode

## 起点 `/src/core/global-api/index.js`

`initAssetRegisters`

作用：为 Vue.component、Vue.filter、Vue.directive 注册方法

1. 获取实例:`definition = this.$options._base.extend(definition)`
   `Vue.extend(options)` => `VueComponent` Ctor

2. 注册到默认选项中:`this.options["components"][id] = definition`，将来等待`merge`
   将来获取组件实例，`new definition`

有了组件实例，将来挂载组件：render => update => patch
存在父子关系时，生命周期执行顺序：create/destory 自上而下（深度优先），mount（从下向上）

# 自定义组件 在编译阶段有何区别

```javascript
render(h) {
   return h("comp")
}
```

将组件注册到 父组件的 `options` 中，将来`createElement`从`options.components`中获取

`instance/renderhelpers`
提供了方法别名
`renderList`：v-for
`_v` 创建文本
`_s` 格式化

`initRender`给实例声明一些方法：`createElement`、`_c`
`vm._c = (...) => createElement(...)`

## createElement `vdom/createElement`

- 作用：处理组件 产生 **虚拟 dom**

```javascript
let vnode, ns;
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

## 自定义组件：`createComponent(Ctor...)`

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

### 有了虚拟 dom，下面进入 patch

初始化时调用`createElm`：将完整的 Vnode 转换成真实 dom

```javascript
function createElm(vnode, insertedVnodeQueue, parentElm, refElm, nested, ownerArray, index) {
  // 如果是自定义组件，则创建
  if (createComponent(vnode, insertedVnodeQueue, parentElm, refElm)) {
    return;
  }

  // 下面处理host组件
}
```

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

  此时获得了虚拟 dom，因此这一步发生在`patch`

  整理流程：根组件执行`$mount` => `patch` => `createElm` 向下递归，若遇到自定义组件，则调用子组件的 钩子 init 方法

### createComponent

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

前面安装的钩子在 hook 中，只有自定义组件有 init 函数，执行 init 函数后调用组件的$mount

区别：自定义组件有钩子和 data

## 整体流程

首次`_render`时得到整棵树的`VNode`结构，其中自定义组件相关的主要是

1. createComponent() - `src/core/vdom/create-component.js`
   将组件变成`VueComponent`最终创建`VNode`
2. createComponent() - src/core/vdom/patch.js
   创建组件实例并挂载，vnode 转换为 dom

## 总结

编译`_c("comp")`
产生 vnode

```javascript
{
    tag: "vue-component-1-comp",
    data: {...},
    children: [...]，
    componentConstructor
}
```

得到 componentInstance 才能挂载

得到 instance 执行 `$mount`，最终得到真实 dom

# vue2 总结

## 1. $mount

执行渲染函数获取虚拟 dom，然后执行 patch

1. 获取宿主
2. updateComponent
3. 创建 Watcher
