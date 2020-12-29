const MyPlugin = {
  install(Vue, options) {
    Vue.component('heading', {
      functional: true,
      props: ['title'],
      render(h, context) {
        const { title } = context.props;
        return h('div', { class: 'head' }, [h('h1', { class: 'head-title' }, [title])]);
      },
    });
  },
};

if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.use(MyPlugin);
}
