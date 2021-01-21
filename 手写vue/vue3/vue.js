import {ensureRenderer} from "./lib/runtimer-dom.js"

const Vue = {
  createApp(...args) {
    const app = ensureRenderer().createApp(...args);

    const mount = app.mount;
    app.mount = el => {
      const container = document.querySelector(el);
      container.innerHTML = '';
      mount(container);
    };
    return app;
  },
};

export default Vue;
