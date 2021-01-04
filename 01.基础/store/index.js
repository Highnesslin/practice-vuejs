import user from './modules/user.js';
import notify from './modules/notify.js';

import createPersistPlugin from './plugins/index.js';
import { PERSIST } from './type.js';

const store = new Vuex.Store({
  modules: {
    user,
    notify,
  },
  strict: true, //process.env.NODE_ENV !== 'production',
  plugins: [createPersistPlugin(PERSIST)],
});
export default store;
