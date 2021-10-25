<template>
  <div>
    <v-system-bar color="primary" app dark window>
      <v-tooltip top>
        <template v-slot:activator="{ on, attrs }">
          <span v-bind="attrs" v-on="on" @click="toggleQr"
            >{{ toolbarTitle }}
          </span>
        </template>
        <span>Click to share LCT</span>
      </v-tooltip>
      <v-spacer></v-spacer>

      {{ $version }}
      <v-icon right class="pl-3"
        >{{ isConnected ? 'mdi-lan-connect' : 'mdi-lan-disconnect' }}
      </v-icon>
      <span>{{ shortUserID }}</span>
      <v-btn icon @click="open('Test')">
        <v-icon>mdi-monitor-dashboard</v-icon>
      </v-btn>
      <!-- Begin Options Menu-->
      <nestedMenu
        :menu-items="fileMenuItems"
        @nestedMenu-click="onMenuItemClick"
      />
      <!-- End Options Menu-->
    </v-system-bar>
    <v-dialog v-model="showCvewQR" max-width="400">
      <v-card class="dialog;">
        <v-row justify="space-around">
          <v-col>
            <v-card-title>Share the app</v-card-title>
            <v-card-text>
              <v-img src="./cvew-qr-code.png"></v-img>
              <v-card-subtitle>URL: http://cvew.herokuapp.com</v-card-subtitle>
              <v-card-actions
                ><v-spacer /><v-btn dark @click="showCvewQR = false"
                  ><v-icon>close</v-icon></v-btn
                ><v-spacer
              /></v-card-actions>
            </v-card-text>
          </v-col>
        </v-row>
      </v-card>
    </v-dialog>

    <prompt-banner
      :riskScore="riskScore"
      :refresh="refresh"
      :warningsReceived="warningsReceived"
    ></prompt-banner>
    <feedback-card
      v-if="feedbackDialog"
      @endFeedback="feedbackDialog = false"
    ></feedback-card>
  </div>
</template>

<script>
import { getNow } from '@/utils/luxonHelpers';
import { info, success, warn, printJson } from '@/utils/helpers';
import PromptBanner from '../components/prompts/promptBanner.vue';
import FeedbackCard from '../components/cards/feedbackCard.vue';

export default {
  name: 'AppLayoutHeader',
  props: {
    state: Object,
    updateSession: Function,
    updateLoggedVisitId: Function,
    isConnected: Boolean,
    getPoi: Function,
    incrementWarningsReceived: Function,
    setVaccinationStatus: Function,
  },
  components: {
    nestedMenu: () => import('../components/menus/nestedMenu.vue'),
    PromptBanner,
    FeedbackCard,
  },
  computed: {
    shortUserID() {
      if (this.$socket.connected) {
        const id = this.$socket.client.auth.userID.slice(12);
        return id;
      }
      return '';
    },

    toolbarTitle() {
      const t = this.$vuetify.breakpoint.xsOnly
        ? 'LCT'
        : 'Local Contact Tracing';
      return `${t} ${this.namespace ? `- ${this.namespace}` : ''}`;
    },

    namespace() {
      return this.getPoi().namespace;
    },

    fileMenuItems() {
      const x = [
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
      ];
      return x;
    },
  },

  data() {
    return {
      showCvewQR: false,
      handledSessionEvent: false,
      graphName: '',
      feedbackDialog: false,
      riskScore: null,
      showBanner: false,
      refresh: 0,
      warningsReceived: 0,
    };
  },
  sockets: {
    exposureAlert(riskScore) {
      const audio = new AudioContext();
      function beep(vol, freq, duration) {
        const v = audio.createOscillator();
        const u = audio.createGain();
        v.connect(u);
        v.frequency.value = freq;
        v.type = 'square';
        u.connect(audio.destination);
        u.gain.value = vol * 0.01;
        v.start(audio.currentTime);
        v.stop(audio.currentTime + duration * 0.001);
      }
      beep(100, 520, 200);
      this.riskScore = riskScore;
      this.refresh++;
      this.showBanner = true;
      this.incrementWarningsReceived().then((x) => {
        // TODO this is a Maybe
        this.warningsReceived = x[0].warningsReceived;
      });
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

    // sent from Server after Server has all the data it needs to register the Visitor
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
    toggleQr() {
      this.showCvewQR = !this.showCvewQR;
    },

    open(view) {
      if (this.$router.currentRoute.name === view) {
        return;
      }
      this.$router.push({
        name: view,
      });
    },
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

    onWelcome() {
      alert('Welcome');
      this.$router.push({
        name: 'Welcome',
      });
    },

    onMenuItemClick(item) {
      if (typeof item.action === 'function') {
        item.action();
        return;
      }
      switch (item.action) {
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

<style scoped>
.dialog {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>
