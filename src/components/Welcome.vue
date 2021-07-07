<template>
  <v-row justify="center" no-gutters>
    <State>
      <welcomeCard slot-scope="{ onConnectMe }" @connectMe="onConnectMe($event)"
    /></State>
  </v-row>
</template>

<script>
/**
 * The first duty of App.vue is to connect to the Server:
 *    A connection requires first a username, then a sessionID and userID.
 *    After mounted(), the watcher for this.ready calls connectMe() with
 *    a username and perhaps a sessionID.
 *    First time access has now sessionID, but when the Welcome page
 *    calls connectMe() with just a username, the server will return a sessionID.
 *    So, the next run will have username and sessionID taken from the Setting entity.
 */

import State from './renderless/State.vue';
import welcomeCard from './cards/welcomeCard.vue';

import Setting from '@/models/Setting';

export default {
  name: 'Welcome',

  components: {
    welcomeCard,
    State,
  },

  computed: {
    // BASE computed properties
    connectIcon() {
      return this.userID ? 'mdi-lan-connect' : 'mdi-lan-disconnect';
    },
    version() {
      return this.$version;
    },
    settings() {
      return Setting.all()[0] || [];
    },
  },

  data() {
    return {
      ready: false,

      isConnected: false,
      sessionID: '',
      userID: '',
      username: '',

      namespace: '',

      // for PWA
      refreshing: false,
      registration: null,
      updateExists: false,
    };
  },

  methods: {
    //#region Welcome method
    // username passed in from Welcome
    // called by ready watch and may include sessionID
    // but if there are no settings, payload will be empty (so return)
    // onConnectMe(payload) {
    //   const { username, userID, sessionID } = payload;
    //   if (!username) {
    //     console.log(warn('No username yet. Let us get them signed up...'));
    //     return;
    //   }
    //   this.username = username;
    //   this.userID = userID;
    //   this.sessionID = sessionID;
    //   const data = { data: { ...payload, id: 1 } };
    //   console.info(warn('data:', JSON.stringify(data, null, 3)));
    //   Setting.updatePromise(data)
    //     .then((s) => {
    //       console.info(
    //         info('Settings after connectMe() update:', printJson(s))
    //       );
    //     })
    //     .catch((e) => {
    //       console.error(err(printJson(e)));
    //     });
    //   this.$socket.client.auth = {
    //     username: this.username,
    //     userID: this.userID,
    //     sessionID: this.sessionID,
    //   };
    //   const msg = sessionID
    //     ? `${this.username} connected to server with session ${this.sessionID}`
    //     : `Step 1: first server contact with ${this.username}. Awaiting reply in session event..`;
    //   console.log(info(msg));
    //   this.$socket.client.open();
    // },
    //#endregion
    // these are BASE methods
    // getData() {
    //   return Promise.all([Setting.$fetch()])
    //     .then((entities) => {
    //       console.groupCollapsed('Getting data: >');
    //       const settings = entities[0].settings || [];
    //       console.log(settings.length, 'settings');
    //       console.groupEnd();
    //       //#endregion
    //     })
    //     .catch((error) => this.onError(error));
    // },
  },

  watch: {
    // NOTE: it is MUCH easier to handle data after mounted() is done
    // mounted() sets this.ready to true if we get to the last line of that function
    ready() {
      // sessionID saved to Setting entity in session event handler (after Server provides the ID)
      const sessionID = this.settings.sessionID;
      const userID = this.settings.userID;
      const username = this.settings.username;
      this.onConnectMe({ username, sessionID, userID });

      console.log('Waiting for server...');
    },
    sessionID(newVal, oldVal) {
      console.log(`SessionID new/old: ${newVal}/${oldVal}`);
      console.assert(oldVal === newVal, 'sessionID changed');
    },
  },

  created() {
    // console.groupCollapsed('Creating App:');
    // console.log(process.env.VUE_APP_NAMESPACE);
    // //#region PWA
    // // Listen for swUpdated event and display refresh snackbar as required.
    // document.addEventListener('swUpdated', this.showRefreshUI, { once: true });
    // document.addEventListener('offline', this.showOfflineUI, { once: true });
    // // Refresh all open app tabs when a new service worker is installed.
    // if (navigator.serviceWorker) {
    //   navigator.serviceWorker.addEventListener('controllerchange', () => {
    //     if (this.refreshing) return;
    //     this.refreshing = true;
    //     window.location.reload();
    //   });
    // }
    // // document.addEventListener('beforeinstallprompt', this.showAdd2HsUI, {
    // //   once: true,
    // // });
    // document.addEventListener('appinstalled', () => {
    //   console.log('PWA was installed');
    // });
    // //#endregion PWA
    // console.groupEnd();
  },

  async mounted() {
    // const self = this;
    // console.groupCollapsed('Mounting App:');
    // self.getData().then(() => {
    //   self.ready = true;
    //   console.groupEnd();
    //   console.log('App.vue mounted');
    // });
  },

  // TODO Figure out how to unsub events
  destroyed() {},
};
</script>
