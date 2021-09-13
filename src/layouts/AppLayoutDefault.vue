<template>
  <Model>
    <!-- the header disappears if the slot-scope is inside AppLayoutHeadr -->
    <!-- can we move slot-scope object values up to AppLayout.vue? -->
    <div
      slot-scope="{ isConnected, state, updateLoggedVisitId, updateSession }"
    >
      <AppLayoutHeader
        :namespace="namespace"
        :isConnected="isConnected"
        :state="state"
        :updateLoggedVisitId="updateLoggedVisitId"
        :updateSession="updateSession"
      />
      <CaptureErrorSnackbar>
        <slot />

        <!-- status bar -->
        <v-row no-gutters justify="space-around"
          ><v-spacer /><v-col cols="auto" class="text-center"
            ><small class="mt-5 mb-0 ml-3 ">{{ status }}</small></v-col
          ><v-spacer
        /></v-row>
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
  },
  computed: {
    status() {
      return `${this.usernumber || 'You'} ${this.connectionStatus} [${
        this.$socket.connected
      } ]`;
    },
    connectionStatus() {
      return this.inSession
        ? `in session with ${this.inSession} `
        : 'are not yet connected to server';
    },
  },
  data() {
    return {
      namespace: 'Sisters',
      ready: false,
      inSession: '',
    };
  },
  sockets: {
    session({ sessionID }) {
      this.inSession = sessionID;
    },
  },
  methods: {},
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
