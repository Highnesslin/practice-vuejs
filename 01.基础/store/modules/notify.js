import { ADD_NOTIFY } from '../type.js';

export default {
  state: () => [],
  mutations: {
    [ADD_NOTIFY](state, notify) {
      state.push(notify);
    },
  },
  actions: {
    [ADD_NOTIFY]({ commit }, notify) {
      commit(ADD_NOTIFY, notify);
    },
  },
  getters: {
    hasNotify(state) {
      return state && state.length > 0;
    },
  },
};
