const Vue = {
  createApp(...args) {
    const app = ensureRender().createApp(...args);
    const mount = app.mount;
    app.mount = el => {
      mount(el);
      // ...扩展
    };
    return app;
  },
};

let renderer;
// 保证renderer为单例
const ensureRender = () => {
  return renderer || (renderer = createRenderer());
};

// 创建默认renderer
const createRenderer = () => {
  return baseCreateRenderer();
};
// 创建服务端renderer
const createHydrateRender = () => {
  return baseCreateRenderer();
};
// 创建通用renderer
const baseCreateRenderer = () => {
  const render = (vnode, container) => {
    console.log('vnode, container', vnode, container);
    const preVnode = container._vnode || null;
    patch(preVnode, vnode);
    container._vnode = vnode;
  };
  const patch = (n1, n2) => {
    // ...
    console.log('patch', n1, n2);
  };
  const hydrate = () => {
    /* SSR */
  };
  return {
    render,
    hydrate,
    createApp: createAppAPI(render),
  };
};

// 创建Vue实例
const createAppAPI = render => {
  return function createApp() {
    const app = {
      mount(el) {
        // ...
        render(null, document.querySelector(el));
      },
    };
    return app;
  };
};
