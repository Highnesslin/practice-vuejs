let renderer;

const nodeOptions = {
  querySelector: document.querySelector,
  createElement(el) {
    return document.createElement(el);
  },
  insert: document.insertBefore,
};

export const ensureRenderer = function () {
  return renderer || (renderer = createRenderer(nodeOptions));
};
const createRenderer = function (nodeOptions) {
  return baseCreateRenderer(nodeOptions);
};

const createHydrateRenderer = function () {
  return baseCreateRenderer();
};

const baseCreateRenderer = function (nodeOptions) {
  const { querySelector, createElement, insert } = nodeOptions;

  const patch = (n1, n2, container) => {
    const { type, children } = n2;

    const el = createElement(type);

    container.appendChild(el);

    if (Array.isArray(children)) {
      // todo 递归
    } else if (['number', 'string'].includes(typeof children)) {
      el.textContent = children;
    }
  };

  const render = (vnode, container) => {
    patch(container._vnode || null, vnode, container);

    container._vnode = vnode;
  };

  const hydrate = () => {};

  return {
    render,
    hydrate,
    createApp: createAppAPI(render),
  };
};

const createAppAPI = render => {
  return function createApp(rootComponent) {
    const app = {
      mount(container) {
        // 根据 rootComponent 生成 vnode
        const vnode = {
          type: 'p',
          children: 1,
        };
        render(vnode, container);
      },
    };
    return app;
  };
};
