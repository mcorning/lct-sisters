import Vue from 'vue';
import Vuex from 'vuex';
import VuexORM from '@vuex-orm/core';
import VuexORMLocalForage from 'vuex-orm-localforage';
import database from '@/database';
import { version } from '../../package.json';

Vue.use(Vuex);

VuexORM.use(VuexORMLocalForage, { database });

const store = new Vuex.Store({
  plugins: [VuexORM.install(database)],
  // using package.json for version number
  settings: {
    packageVersion: version || '0',
  },
  getters: {
    appVersion: (settings) => {
      return settings.packageVersion;
    },
  },
});
console.log('Registered Vuex Store');

export default store;
