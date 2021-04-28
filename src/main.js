import Vue from 'vue';
import 'roboto-fontface/css/roboto/roboto-fontface.css';
import 'material-design-icons-iconfont/dist/material-design-icons.css';
import vuetify from './plugins/vuetify';
import './registerServiceWorker';
import App from './App.vue';
import { version } from '../package.json';

Vue.prototype.$version = version;

Vue.config.productionTip = false;

new Vue({
  vuetify,
  render: (h) => h(App),
}).$mount('#app');
