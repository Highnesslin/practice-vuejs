import { SAVE_USER } from '../../store/type.js';

export default {
  name: 'UserInfo',
  data() {
    return {
      username: '',
      phone: '',
    };
  },
  computed: {
    ...Vuex.mapGetters({
      isLogin: 'isLogin',
    }),
    ...Vuex.mapState({
      user: state => state.user,
    }),
  },
  methods: {
    ...Vuex.mapActions([SAVE_USER]),
    login() {
      this.$store.dispatch(SAVE_USER, {
        id: Date.now(),
        name: this.username,
        phone: this.phone,
      });
    },
  },
  template: `
    <section>
      <div v-if="isLogin">{{user}}</div>
      <div v-else>
        <input v-model="username" placeholder="请输入用户名" />
        <br/>
        <input v-model="phone" placeholder="请输入手机号" />
        <br/>
        <button @click="login">登录</button>
      </div>
    </section>
  `,
};
