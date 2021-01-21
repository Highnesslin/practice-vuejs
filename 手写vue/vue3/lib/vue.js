import { ensureRenderer } from './runtimer-dom.js';

const createApp = (...args) => {
  const app = ensureRenderer().createApp(...args);

  const mount = app.mount;
  app.mount = el => {
    const container = document.querySelector(el);
    container.innerHTML = '';
    mount(container);
  };

  return app;
};

export { createApp };
