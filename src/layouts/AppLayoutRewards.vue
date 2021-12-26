<template>
  <Model>
    <div slot-scope="{ isConnected, state, updateSession }">
      <sponsor
        v-if="isSponsor"
        :isConnected="isConnected"
        :state="state"
        :updateSession="updateSession"
      />
      <customer
        v-else
        :isConnected="isConnected"
        :state="state"
        :updateSession="updateSession"
      />
    </div>
  </Model>
</template>

<script>
import Model from '../components/renderless/Model.vue';

import Sponsor from '@/views/Sponsor.vue';
import Customer from '@/views/Customer.vue';

import { getNow } from '@/utils/luxonHelpers';
import { info, success, warn, printJson } from '@/utils/helpers';
export default {
  name: 'AppLayoutRewards',
  props: {
    state: Object,
    updateSession: Function,
    isConnected: Boolean,
  },
  components: { Model, Customer, Sponsor },
  computed: {
    isSponsor() {
      const yes = this.$route.path === '/sponsor';
      return yes;
    },
  },
  data() {
    return {};
  },
  sockets: {
    confirmRewardEntry({ bid, sid }) {
      this.confirmationTitle = `Congratulations, ${this.$socket.client.auth.userID}`;
      this.confirmationMessage = `You just earned Reward points from ${bid} (Confirmation number ${sid}).`;
      this.confSnackbar = true;
      this.confBottom = false;
      this.confirmationIcon = 'lottery';
    },
    confirmShare(sid) {
      this.confirmationTitle = `Well Done, ${this.$socket.client.auth.userID}`;
      this.confirmationMessage = `You are now entered in the LCT Reward Lottery (Confirmation number ${sid}). But more important: you are helping keep us all safe.`;
      this.confSnackbar = true;
      this.confBottom = true;
      this.confirmationIcon = 'lottery';
    },

    /*
     * 👂 Listen to socket events emitted from the socket server
     */
    connect() {
      console.log(getNow());
      console.log(
        success(
          `Connected to the server on socket ${this.$socket.client.id}.\n`
        )
      );
    },
    disconnect() {
      console.log(getNow());
      console.log(warn(`The server just disconnected the socket.\n`));
    },

    // sent from Server after Server has all the data it needs to register the customer or restauranteur
    newSession({ sessionID, userID, username, graphName }) {
      console.assert(
        sessionID && userID && username,
        `Session event missing args: ${sessionID} ${userID} ${username}`
      );

      const data = { id: 1, sessionID, userID, username };
      this.updateSession(data);

      // attach the session session data to the next reconnection attempts
      console.log(
        info(
          'Socket auth before update in session():',
          printJson(this.$socket.client.auth)
        )
      );
      this.$socket.client.auth = {
        username,
        userID,
        sessionID,
      };
      console.log(
        info(
          'Socket auth after update in session():',
          printJson(this.$socket.client.auth)
        )
      );

      // attach the userID to the client object for easy reference on server
      this.$socket.client.auth.userID = userID;

      console.group(info('Step 2:Handling Session event from Server: >'));
      console.log(success('Session ID', sessionID));
      console.log(success('User Name:', username));
      console.log(success('User ID:', userID));
      console.log(success('graphName used by redis', graphName));
      console.log('Entire Model:', this.state);
      console.groupEnd();
      this.handledSessionEvent = true;
    },
  },
  methods: {
    connectMe() {
      if (this.isConnected) {
        return 'Already connected';
      }

      const { usernumber, userID, sessionID } = this.state.settings;

      const data = {
        usernumber,
        userID,
        sessionID,
        id: 1,
      };
      if (this.$DEBUG) {
        console.info(warn('data:', JSON.stringify(data, null, 3)));
      }

      this.$socket.client.auth = {
        username: usernumber,
        usernumber,
        userID,
        sessionID,
      };
      const msg = sessionID
        ? `${usernumber} connected to server with session ${sessionID}`
        : `Step 1: first server contact with ${usernumber}. Awaiting reply in session event for sessionID and userID.`;
      console.log(this.$socket.client.auth);
      this.$socket.client.open();
      return msg;
    },
  },
  mounted() {
    console.log(this.connectMe());
    console.log('Mounted');
  },
};
</script>

<style scoped></style>
