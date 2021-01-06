// 1.插件
// 2.两个组件

// vue插件：
// function
// 要求必须有一个install，将来会被Vue.use调用
let Vue; // 保存Vue构造函数，插件中要使用，不导入还能用
class VueRouter {
  constructor(options) {
    this.$options = options;

    // // 把current作为响应式数据
    // // 将来发生变化，router-view的render函数能够再次执行
    this.current = window.location.hash.slice(1) || '/';
    Vue.util.defineReactive(this, 'matched', []);
    this.match();

    // 监听hash变化
    window.addEventListener('hashchange', () => {
      this.current = window.location.hash.slice(1);
      this.matched = [];
      this.match();
    });
  }

  match(routes) {
    routes = routes || this.$options.routes;

    this.current;

    for (const route of routes) {
      if (route.path === '/' && this.current === '/') {
        this.matched.push(route.component);
      } else if (route.path !== '/' && this.current.includes(route.path)) {
        this.matched.push(route.component);
      }
      if (route.children) {
        this.match(route.children);
      }
    }
  }
}
// 参数1是Vue.use调用时传入的
VueRouter.install = function(_Vue) {
  Vue = _Vue;

  // 1.挂载$router属性
  // this.$router.push()
  // 全局混入目的：延迟下面逻辑到router创建完毕并且附加到选项上时才执行
  Vue.mixin({
    beforeCreate() {
      // 此钩子在每个组件创建实例时都会调用
      // 根实例才有该选项
      if (this.$options.router) {
        Vue.prototype.$router = this.$options.router;
      }
    },
  });

  // 2.注册实现两个组件router-view,router-link
  Vue.component('router-link', {
    props: {
      to: {
        type: String,
        required: true,
      },
    },
    render(h) {
      // return <a href={'#'+this.to}>{this.$slots.default}</a>
      return h(
        'a',
        {
          attrs: {
            href: '#' + this.to,
          },
        },
        this.$slots.default
      );
    },
  });
  Vue.component('router-view', {
    render(h) {
      // <router-view /> 的标志
      this.$vnode.data.routerView = true;

      // 嵌套路由
      let depth = 0;
      let parent = this.$parent;
      while (parent) {
        const vnodeData = parent.$vnode ? parent.$vnode.data : {};
        if (vnodeData.routerView) {
          depth++;
        }
        parent = parent.$parent;
      }

      const component = this.$router.matched[depth];

      return component ? h(component) : null;
    },
  });
};

export default VueRouter;
