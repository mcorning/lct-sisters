import Vue from 'vue';
import 'roboto-fontface/css/roboto/roboto-fontface.css';
import 'material-design-icons-iconfont/dist/material-design-icons.css';
import vuetify from './plugins/vuetify';
import './registerServiceWorker';
import App from './App.vue';

import * as VueGoogleMaps from 'vue2-google-maps';

Vue.use(VueGoogleMaps, {
  load: {
    key: process.env.VUE_APP_MAP_API_KEY,
    libraries: 'places',
  },
});

console.log(
  process.env.VUE_APP_NAMESPACE,
  process.env.VUE_APP_LAT,
  process.env.VUE_APP_LNG
);
import { version } from '../package.json';

Vue.prototype.$version = version;
Vue.prototype.$location = {
  lat: 44.29160723928563,
  lng: -121.5441825899421,
};

Vue.config.productionTip = false;

new Vue({
  vuetify,
  render: (h) => h(App),
}).$mount('#app');
