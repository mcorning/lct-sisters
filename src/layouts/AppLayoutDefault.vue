<template>
  <Model>
    <!-- the header disappears if the slot-scope is inside AppLayoutHeadr -->
    <!-- can we move slot-scope object values up to AppLayout.vue? -->
    <div
      slot-scope="{
        isConnected,
        state,
        updateSession,
        updateLoggedVisitId,
        usernumber,
        getPoi,
        incrementWarningsReceived,
      }"
    >
      <AppLayoutHeader
        :isConnected="isConnected"
        :state="state"
        :updateSession="updateSession"
        :updateLoggedVisitId="updateLoggedVisitId"
        :usernumber="usernumber"
        :getPoi="getPoi"
        :incrementWarningsReceived="incrementWarningsReceived"
      />
      <CaptureErrorSnackbar>
        <!-- send props to components through their master vue files -->
        <slot />
      </CaptureErrorSnackbar>

      <AppLayoutFooter /></div
  ></Model>
</template>
<script>
import Model from '../components/renderless/Model.vue';

import AppLayoutHeader from '@/layouts/AppLayoutHeader';
import AppLayoutFooter from '@/layouts/AppLayoutFooter';
import CaptureErrorSnackbar from '@/components/errorBoundary/CaptureErrorSnackbar.vue';

export default {
  name: 'DefaultLayout',
  components: {
    AppLayoutFooter,
    AppLayoutHeader,
    CaptureErrorSnackbar,
    Model,
  },

  props: {
    usernumber: {
      type: Number,
      required: true,
    },
    isConnected: Boolean,
    getPoi: Function,
    getVisitors: Function,
    earnReward: Function,
    getWarnings: Function,
  },
  computed: {
    status() {
      return `${this.usernumber || 'You'} ${this.connectionStatus}`;
    },
    connectionStatus() {
      return this.$socket.connected
        ? `in session with ${this.$socket.client.auth.userID} `
        : 'are not yet connected to server';
    },
  },
  data() {
    return {
      ready: false,
      inSession: '',
    };
  },
  sockets: {
    newSession({ sessionID }) {
      this.inSession = sessionID;
    },
  },
  methods: {},
  watch: {
    ready() {
      console.log('ready', this.$route);
      if (this.$route.path === '/') {
        this.getWarnings().then((warnings) => {
          console.log('warnings', warnings);
          if (warnings) {
            console.log('AppLayoutDefault delegating alerts to acts.vue');
            // this.$route.query=`?warnings=${warnings}`
            console.log('warnings', JSON.stringify(warnings, null, 2));
            this.$router.push({
              name: 'Cvew',
              params: warnings,
            });
          }
        });
      }
    },
  },
  mounted() {
    this.ready = true;
  },
};
</script>
