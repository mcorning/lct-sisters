<template>
  <v-row justify="center" no-gutters>
    <!-- <State> -->
    <welcomeCard
      slot-scope="{ onConnectMe }"
      @connectMe="onConnectMe($event)"
    />
    >
    <!-- </State    > -->
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

// import State from '../components/renderless/State.vue';
import welcomeCard from '../components/cards/welcomeCard.vue';

import Setting from '@/models/Setting';

export default {
  name: 'Welcome',
  props: {
    onConnectMe: {
      type: Function,
    },
  },

  components: {
    welcomeCard,
    // State,
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

  methods: {},

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

  created() {},

  async mounted() {},

  // TODO Figure out how to unsub events
  destroyed() {},
};
</script>
