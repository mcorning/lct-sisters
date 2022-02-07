<template>
  <div>
    <v-system-bar color="primary" app dark window>
      <v-dialog v-model="enlargeQR" width="500">
        <template v-slot:activator="{ on, attrs }">
          <v-btn color="primary" icon v-bind="attrs" v-on="on">
            <v-icon>qr_code_2</v-icon>
          </v-btn>
        </template>

        <v-card>
          <v-btn
            icon
            absolute
            top
            right
            large
            color="primary"
            @click="enlargeQR = false"
            ><v-icon>close</v-icon></v-btn
          >

          <v-card-title>Share Local Contact Tracing</v-card-title>

          <v-card-text>
            <v-tabs v-model="tab" background-color="transparent" grow>
              <v-tab v-for="item in items" :key="item.tab">
                {{ item.tab }}
              </v-tab>
            </v-tabs>
            <v-tabs-items v-model="tab">
              <v-tab-item v-for="item in items" :key="item.tab">
                <v-card flat>
                  <v-select
                    v-if="item.tab === 'Sponsored URLs'"
                    v-model="sponsor"
                    :items="sponsors"
                    label="Sponsors"
                  ></v-select>

                  <v-card-text v-else
                    >Share the link widely. Stop this virus cold.</v-card-text
                  >
                </v-card>
              </v-tab-item>
            </v-tabs-items>
          </v-card-text>
          <v-card-text>
            <v-row>
              <v-spacer />
              <v-col class="text-center">
                <VueQRCodeComponent
                  id="qr"
                  ref="qr"
                  :text="decodedUri"
                  error-level="L"
                >
                </VueQRCodeComponent>
              </v-col>
              <v-spacer />
            </v-row>
            <v-row
              ><v-col
                ><span class="text-caption"
                  >Right-click and "Save image as..." then print QR for customer
                  convenience.</span
                ></v-col
              ></v-row
            >
            <v-divider class="my-3"></v-divider>

            <v-card-title>Event Link</v-card-title>
            <v-card-text class="text-caption text-sm-body-2">{{
              decodedUri
            }}</v-card-text>
            <!-- Disabled until copyToClipboard is idempontent -->
            <!-- <v-sheet
              v-if="showConf"
              class="px-5 pt-5 pb-4 mx-auto text-center d-inline-block"
              color="blue-grey darken-3"
              dark
              width="100%"
            >
              <div class="grey--text text--lighten-1 text-body-2 mb-4">
                Link copied
              </div>
              <v-btn color="grey" plain class="ma-1" @click="showConf = false">
                Close
              </v-btn>
            </v-sheet> -->
          </v-card-text>
        </v-card>
      </v-dialog>
      {{ toolbarTitle }}
      <!-- <v-tooltip top>
        <template v-slot:activator="{ on, attrs }">
          <span v-bind="attrs" v-on="on" @click="toggleQr"
            >{{ toolbarTitle }}
          </span>
        </template>
        <span>Click to share LCT</span>
      </v-tooltip> -->
      <v-spacer></v-spacer>

      {{ $version }}
      <v-icon right class="pl-3"
        >{{ isConnected ? 'mdi-lan-connect' : 'mdi-lan-disconnect' }}
      </v-icon>
      <span>{{ shortUserID }}</span>

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
      :alert="alert"
      :riskScore="riskScore"
      :refresh="refresh"
    ></prompt-banner>

    <feedback-card
      v-if="feedbackDialog"
      @endFeedback="feedbackDialog = false"
    ></feedback-card>
    <confirmation-snackbar
      v-if="confSnackbar"
      :confirmationTitle="confirmationTitle"
      :confirmationMessage="confirmationMessage"
      :confirmationIcon="confirmationIcon"
      :bottom="confBottom"
    />
  </div>
</template>

<script>
import { getNow } from '@/utils/luxonHelpers';
import { info, success, warn, printJson } from '@/utils/helpers';
import PromptBanner from '../components/prompts/promptBanner.vue';
import FeedbackCard from '../components/cards/feedbackCard.vue';
import VueQRCodeComponent from 'vue-qr-generator';
import ConfirmationSnackbar from '../components/prompts/confirmationSnackbar.vue';
import { objectToKeyedArray } from '../utils/helpers';

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
    VueQRCodeComponent,
    ConfirmationSnackbar,
  },
  computed: {
    decodedUri() {
      return this.tab === 0
        ? `${window.location.origin}/?uid=${
            this.$socket.client.connected ? this.$socket.client.auth.userID : ''
          }`
        : this.sponsorUri;
    },

    sponsorUri() {
      // the QR code generator needs to use the decoded URI
      const uri = `${
        window.location.origin
      }/?sponsor=${this.sponsor.toLowerCase()}`;
      const d = decodeURIComponent(uri);
      return d;
    },
    shortUserID() {
      if (this.$socket.connected) {
        const id = this.$socket.client.auth.userID.slice(12);
        return id;
      }
      return '';
    },

    toolbarTitle() {
      if (this.$route.name === 'Sponsor') {
        return this.namespace;
      }
      const t = this.$vuetify.breakpoint.xsOnly
        ? 'LCT'
        : 'Local Contact Tracing';

      return `${t} ${this.namespace ? `- ${this.namespace}` : ''}`;
    },

    namespace() {
      const nsp = this.getPoi().namespace;
      return nsp;
    },

    fileMenuItems() {
      return [
        {
          subtitle: 'Look behind the curtain',
          name: 'Monitor',
          action: 'Monitor',
          icon: 'mdi-monitor-dashboard',
          color: 'orange',
        },
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
    },
  },

  data() {
    return {
      alert: true,
      showEmail: false,
      enlargeQR: false,

      sponsor: '',
      sponsors: ['Microsoft', 'Sisters', 'Manchester'],
      tab: null,
      items: [{ tab: 'Base URL' }, { tab: 'Sponsored URLs' }],
      showCvewQR: false,
      handledSessionEvent: false,
      graphName: '',
      feedbackDialog: false,
      riskScore: null,
      showBanner: false,
      refresh: 0,
      warningsReceived: 0,

      sid: '',

      confSnackbar: false,
      confirmationTitle: '',
      confirmationMessage: 'Welcome to a safer Microsoft Campus',
      confirmationColor: '',
      confBottom: true,
    };
  },
  sockets: {
    confirmRewardEntry({ uid, sid }) {
      this.confirmationTitle = `Congratulations, ${this.$socket.client.auth.userID}`;
      this.confirmationMessage = `You just earned Reward points from ${uid} (Confirmation number ${sid}).`;
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

    // broadcastedAlert replaces exposureAlert
    exposureAlert({ alert, riskScore }) {
      console.log('alert :>> ', printJson(alert));
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
      this.alert = alert;
      this.riskScore = riskScore;
      this.refresh++;
      this.showBanner = true;
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
        case 'Monitor':
          this.open('Monitor');
          break;
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
