<template>
  <Model>
    <!-- the header disappears if the slot-scope is inside AppLayoutHeadr -->
    <!-- can we move slot-scope object values up to AppLayout.vue? -->
    <div
      slot-scope="{
        isConnected,
        state,
        updateLoggedVisitId,
        updateSession,
        usernumber,
        getPoi,
        incrementWarningsReceived,
        getVisitors,
      }"
    >
      <AppLayoutHeader
        :namespace="namespace"
        :isConnected="isConnected"
        :state="state"
        :updateLoggedVisitId="updateLoggedVisitId"
        :updateSession="updateSession"
        :usernumber="usernumber"
        :getPoi="getPoi"
        :incrementWarningsReceived="incrementWarningsReceived"
      />
      <CaptureErrorSnackbar>
        <!-- one of the main vues goes here -->
        <slot :getVisitors="getVisitors" :emergency="emergency" />
      </CaptureErrorSnackbar>

      <AppLayoutFooter @openDiagnostics="onOpenDiagnostics" /></div
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
      emergency: false,
      namespace: 'Sisters',
      ready: false,
      inSession: '',
    };
  },
  sockets: {
    newSession({ sessionID }) {
      this.inSession = sessionID;
    },
  },
  methods: {
    onOpenDiagnostics() {
      this.emergency = true;
    },
  },
  watch: {
    ready() {
      console.log('ready');
    },
  },
  mounted() {
    this.ready = true;
  },
};
</script>
