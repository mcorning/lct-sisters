// BASE imports
import Vue from 'vue';
import router from './router';
import 'roboto-fontface/css/roboto/roboto-fontface.css';
import 'material-design-icons-iconfont/dist/material-design-icons.css';
import vuetify from './plugins/vuetify';
import './plugins';
// import VueClipboard from 'vue2-clipboard';

// Vue.use(VueClipboard);
// import for Vuex-ORM
// see Vuex-ORM section in lct-docs app
import store from './store';

import './registerServiceWorker';

import AppLayout from '@/layouts/AppLayout';
Vue.component('AppLayout', AppLayout);

import App from './App.vue';

console.log(process.env.VUE_APP_LAT, process.env.VUE_APP_LNG);

// Socket.io
import io from 'socket.io-client';
import VueSocketIOExt from 'vue-socket.io-extended';

// To set/change the port, modify the .env files
const socket = io(process.env.VUE_APP_HOST, {
  autoConnect: false,
});

Vue.use(VueSocketIOExt, socket);

import { version } from '../package.json';
Vue.prototype.$version = version;
Vue.prototype.$defaultGraphName = process.env.VUE_APP_NAMESPACE;
Vue.prototype.$DEBUG = false;
Vue.prototype.$namespace = 'Sisters OR';
Vue.prototype.$userID = '';
Vue.prototype.$connected = false;

Vue.config.productionTip = false;

new Vue({
  vuetify,
  // use vuex-ORM
  store,
  router,

  render: (h) => h(App),
}).$mount('#app');
