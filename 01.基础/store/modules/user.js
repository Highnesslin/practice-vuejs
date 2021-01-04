// const moduleA = {
//     state: () => ({ ... }),
//     mutations: { ... },
//     actions: { ... },
//     getters: { ... }
//   }

import { SAVE_USER } from '../type.js';

export default {
  state: () => ({
    id: null,
    name: '',
    phone: '',
  }),
  mutations: {
    [SAVE_USER](state, user) {
      state.id = user.id;
      state.name = user.name;
      state.phone = user.phone;
    },
  },
  actions: {
    [SAVE_USER]({ commit }, user) {
      commit(SAVE_USER, user);
    },
  },
  getters: {
    isLogin(state) {
      return state && ![null, undefined].includes(state.id);
    },
  },
};
