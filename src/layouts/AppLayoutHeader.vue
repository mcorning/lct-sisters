<template>
  <div>
    <v-app-bar color="primary" app dark>
      <v-toolbar-title
        >{{ 'Local Contact Tracing' }} - {{ namespace }}</v-toolbar-title
      >

      <v-spacer></v-spacer>
      {{ $version }}
      <v-icon right class="pl-3"
        >{{ isConnected ? 'mdi-lan-connect' : 'mdi-lan-disconnect' }}
      </v-icon>

      <!-- Begin Options Menu-->
      <nestedMenu
        :menu-items="fileMenuItems"
        @nestedMenu-click="onMenuItemClick"
      />
      <!-- End Options Menu-->
    </v-app-bar>
    <prompt-banner :riskScore="riskScore"></prompt-banner>
  </div>
</template>

<script>
import { getNow } from '@/utils/luxonHelpers';
import { info, success, warn, printJson } from '@/utils/helpers';
import PromptBanner from '../components/prompts/promptBanner.vue';

export default {
  name: 'AppLayoutHeader',
  props: {
    state: Object,
    updateSession: Function,
    updateLoggedVisitId: Function,
    isConnected: Boolean,
    getPoi: Function,
  },
  components: {
    nestedMenu: () => import('../components/menus/nestedMenu.vue'),
    PromptBanner,
  },
  computed: {
    namespace() {
      return this.getPoi().namespace;
    },

    fileMenuItems() {
      const x = [
        { isDivider: true },
        {
          name: 'Select a Graph',
          menu: [
            {
              name: 'Sisters',
              subtitle: 'Where real data goes',
              icon: 'mdi-graphql',
              action: 'Sisters',
            },
            {
              name: 'Sandbox',
              subtitle: 'Play around with LCT safely',
              icon: 'mdi-graphql',
              action: 'Sandbox',
            },
          ],
        },
        { isDivider: true },
        {
          name: 'Audit Log Tail:',
          subtitle: 'Captures key runtime data for review',
          icon: 'mdi-information-outline',
          color: 'yellow',
          menu: this.tail,
          // menu: [
          //   { name: '1.1' },
          //   { name: '1.2' },
          //   {
          //     name: 'Sub-menu 2',
          //     menu: [
          //       { name: '2.1' },
          //       { name: '2.2' },
          //       {
          //         name: 'Sub-menu 3',
          //         menu: [
          //           { name: '3.1' },
          //           { name: '3.2' },
          //           {
          //             name: 'Sub-menu 4',
          //             menu: [{ name: '4.1' }, { name: '4.2' }, { name: '4.3' }],
          //           },
          //         ],
          //       },
          //     ],
          //   },
          // ],
        },

        { isDivider: true },
        {
          subtitle: 'How are we doing?',
          name: 'Feedback',
          action: 'Feedback',
          icon: 'mdi-comment-quote-outline',
          color: 'purple',
        },
        {
          name: 'Docs',
          subtitle: 'LCT Docs (applies to all instances of LCT)',
          action: 'Docs',
          icon: 'mdi-information-variant',
          color: 'yellow',
        },

        { isDivider: true },

        {
          subtitle: 'Remove localStorage username/sessionID',
          name: 'Reset',
          action: 'Reset',
          icon: 'mdi-comment-quote-outline',
          color: 'orange',
        },
      ];
      return x;
    },
  },

  data() {
    return {
      handledSessionEvent: false,
      graphName: '',
      feedbackDialog: false,
      riskScore: null,
      showBanner: false,
    };
  },
  sockets: {
    exposureAlert(riskScore) {
      this.riskScore = riskScore;
      this.showBanner = true;
    },
    /*
     * 👂 Listen to socket events emitted from the socket server
     */
    connect() {
      console.log(getNow());
      console.log(
        success(`Connected to the server on socket ${this.$socket.id}.\n`)
      );
    },
    disconnect() {
      console.log(getNow());
      console.log(warn(`The server just disconnected the socket.\n`));
    },

    // sent from Server after Server has all the data it needs to register the Visitor
    // TODO better style uses a single object as arg. function deconstructs vars.
    //    socket.emit('session', {
    //        sessionID,
    //        userID,
    //        username,
    //        graphName,
    //    });
    session({ sessionID, userID, username, graphName }) {
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
      this.$socket.client.userID = userID;

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
    // why are we passing in a payload when Model gets that itself from the server?
    // const { username, userID, sessionID } = payload;    // connectMe(payload) {
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
      // Setting.update(data);
      // why are we updating the entity with something we just took from the entity?
      // this.updateSetting(data);

      this.$socket.client.auth = {
        username:usernumber,
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

    onWelcome() {
      alert('Welcome');
      this.$router.push({
        name: 'Welcome',
      });
    },
    // TODO this is part of the Model component, too
    changeGraph(graphName) {
      this.graphName =
        graphName === 'Sandbox' ? 'Sandbox' : this.$defaultGraphName;
      // this server event gets delegated to redis.js
      //this.emitFromClient('changeGraph', this.graphName);
    },

    onMenuItemClick(item) {
      if (typeof item.action === 'function') {
        item.action();
        return;
      }
      switch (item.action) {
        case 'Sisters':
        case 'Sandbox':
          this.changeGraph(item.action);
          break;
        // case 'Audit Log':
        //   this.showAuditLog = true;
        //   break;
        case 'Docs':
          window.open(
            'https://lct-docs.netlify.app',
            '_blank',
            'noopener noreferrer'
          );
          break;
        case 'Feedback':
          this.feedbackDialog = true;
          break;
        case 'Donate':
          alert(
            'Your financial support makes this work possible. Email mcorning@soteriaInstitute.org for details. Thanks a 0xF4240.'
          );
          break;
        case 'Reset':
          // TODO replace with Model renderless component
          // Visit.deleteAll();
          // Setting.deleteAll();
          window.location.reload();
          break;
      }
    },
  },

  watch: {},

  mounted() {
    console.log('Attempting to connect to server...');
    console.log(this.connectMe());
    console.log('\tAppLayoutHeader mounted');
  },
};
</script>

<style scoped></style>
