import store from '../store/index.js';
import UserInfo from './components/UserInfo.js';

// 全局组件
Vue.component('comp', {
  props: ['value'],
  methods: {
    onAdd() {
      this.$emit('input', this.value + 1);
    },
  },
  template: `
    <div>
      <p>{{value}}</p>
      <button @click="onAdd">add</button>
    </div>
  `,
});

new Vue({
  el: '#root',
  store,
  // 局部组件
  components: {
    [UserInfo.name]: UserInfo,
  },
  data() {
    return {
      count: 0,
    };
  },
  template: `
    <div>
      <comp v-model="count"/>
      <heading title="标题"/>
      <user-info />
    </div>
  `,
});
