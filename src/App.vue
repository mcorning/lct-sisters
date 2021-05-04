<template>
  <v-app>
    <v-app-bar color="primary" app dark>
      <v-toolbar-title
        >{{ xxs ? 'LCT' : 'Local Contact Tracing' }} -
        {{ namespace }}</v-toolbar-title
      >

      <v-spacer></v-spacer>
      {{ version }}
      <v-icon right class="pl-3">{{ connectIcon }} </v-icon>

      <v-btn icon>
        <v-icon>more_vert</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main>
      <v-container class="fill-height" fluid>
        <v-row v-if="!usernameAlreadySelected" justify="center" no-gutters>
          <Welcome @input="connectMe($event)" />
        </v-row>

        <v-row
          v-if="usernameAlreadySelected"
          align="start"
          justify="center"
          no-gutters
        >
          <v-col v-if="showSpaces" class="text-center">
            <GoogleMap v-model="location" @addedPlace="onAddedPlace" />
          </v-col>
          <v-col v-if="showWarning" class="text-center">
            <Warning
              @exposureWarning="onExposureWarning($event)"
              @returnToSpaces="show = SPACES"
            />
          </v-col>
          <v-col v-if="showCalendar" class="text-center">
            <Calendar
              :avgStay="avgStay"
              :selectedSpace="selectedSpace"
              @logVisit="onLogVisit"
              @updateLoggedVisit="onLogVisit"
              @deleteVisit="onDeleteVisit"
              @error="onError($event)"
            />
          </v-col>
        </v-row>
        <v-row
          v-if="snackWithButtons"
          align="center"
          justify="center"
          no-gutters
        >
          <v-col class="text-center">
            <v-snackbar bottom left timeout="-1" height="100px">
              {{ snackWithBtnText }}
              <template v-slot:action="{ attrs }">
                <v-btn text color="#00f500" v-bind="attrs" @click.stop="act">
                  {{ snackBtnText }}
                </v-btn>
                <v-btn icon class="ml-4" @click="snackWithButtons = false">
                  <v-icon>close</v-icon>
                </v-btn>
              </template>
            </v-snackbar>
          </v-col>
        </v-row>

        <!-- Alert Snackbar -->
        <v-snackbar
          top
          :value="alertPending"
          :timeout="-1"
          color="orange darken-3"
          vertical
          dark
          max-width="400"
        >
          <v-card dark color="orange darken-1" v-if="alertPending">
            <v-card-title>COVID-19 Detected</v-card-title>
            <v-card-subtitle>
              Someone in your community has tested positive for COVID-19.
            </v-card-subtitle>
            <v-card-text class="white--text">
              You will see an exposure alert next only if you shared the same
              space with that person.</v-card-text
            >
          </v-card>

          <template v-slot:action="{ attrs }">
            <v-btn
              color="white"
              text
              v-bind="attrs"
              @click="alertPending = false"
            >
              OK
            </v-btn>
          </template>
        </v-snackbar>

        <!-- Alert Snackbar -->
        <v-snackbar
          :value="exposureAlert"
          :timeout="-1"
          color="red darken-3"
          vertical
          centered
          dark
          max-width="400"
        >
          <v-card dark color="red darken-1" v-if="exposureAlert">
            <v-card-title>COVID-19 Exposure Alert</v-card-title>
            <v-card-subtitle>
              You shared space recently with someone who tested positive
            </v-card-subtitle>
            <v-card-text>
              Please get tested. If you are positive you can spread the virus -
              even if you are immune.</v-card-text
            >
          </v-card>

          <template v-slot:action="{ attrs }">
            <v-btn
              color="white"
              text
              v-bind="attrs"
              @click="exposureAlert = false"
            >
              OK
            </v-btn>
          </template>
        </v-snackbar>
      </v-container>
    </v-main>

    <v-footer app color="primary" class="white--text">
      <v-bottom-navigation
        :value="value"
        color="secondary"
        background-color="primary"
        dark
        grow
      >
        <v-btn grow @click="resetSpaces">
          <span>Spaces</span>
          <v-icon>mdi-map-marker</v-icon>
        </v-btn>

        <v-btn fab color="red" dark @click="show = WARNING">
          <span>Warn</span>
          <v-icon dark> mdi-alert </v-icon></v-btn
        >

        <v-btn @click="show = CALENDAR">
          <span>Calendar</span>
          <v-icon>mdi-calendar</v-icon>
        </v-btn>
      </v-bottom-navigation>
    </v-footer>
  </v-app>
</template>

<script>
import Welcome from '@/components/Welcome';
import GoogleMap from '@/components/GoogleMap';
import Warning from '@/components/Warning';
import Calendar from '@/components/Calendar';
import { highlight, success, warn, printJson } from './utils/colors';
import Visit from '@/models/Visit';
import Auditor from './utils/Auditor';

export default {
  name: 'App',

  components: {
    Welcome,
    GoogleMap,
    Warning,
    Calendar,
  },

  computed: {
    // Navigation properties
    showSpaces() {
      return this.show == this.SPACES;
    },
    showWarning() {
      return this.show == this.WARNING;
    },
    showCalendar() {
      return this.show == this.CALENDAR;
    },

    // BASE computed properties
    connectIcon() {
      return this.userID ? 'mdi-lan-connect' : 'mdi-lan-disconnect';
    },
    xxs() {
      console.log('bp.width', this.bp?.width);
      return this.bp?.width < 400;
    },
    version() {
      return this.$version;
    },
  },

  data() {
    return {
      // Exposer data
      exposureAlert: false,
      alertPending: false,
      alertText: '',

      // for Welcome component
      isConnected: false,
      usernameAlreadySelected: false,
      sessionID: '',
      username: '',
      avgStay: 3600000,

      // For GoogleMap component
      location: null,

      // For Calendar component
      selectedSpace: null,

      // these are footer values
      value: 0,
      show: 0,
      SPACES: 0,
      CALENDAR: 1,
      WARNING: 2,
      rating: 0,
      dialog: false,
      userID: '',

      // these are BASE values
      auditor: new Auditor(),
      snackBtnText: '',
      snackWithBtnText: '',
      snackWithButtons: false,
      action: '',
      refreshing: false,
      registration: null,
      bp: null,
      namespace: '',
    };
  },

  sockets: {
    /*
     * 👂 Listen to socket events emitted from the socket server
     */
    connect() {
      console.log('Connected to the socket server.');
      this.isConnected = true;
    },

    session({ sessionID, userID, username, graphName }) {
      // attach the session ID to the next reconnection attempts
      this.$socket.client.auth = { sessionID };
      // store it in the localStorage
      localStorage.setItem('sessionID', sessionID);
      // save the ID of the user
      // TODO isn't userID already assigned in middleware?
      this.$socket.client.userID = userID;
      // this.sid = sessionID;
      this.username = username;
      console.log('on Session', this.username);

      this.userID = userID;
      this.graphName = graphName;
    },

    // Exposure dialogs
    alertPending() {
      this.alertPending = true;
    },

    exposureAlert(alert, ack) {
      this.exposureAlert = true;
      this.alertText = alert;
      if (ack) {
        ack(this.$socket.client.id);
      }
      this.auditor.logEntry(alert, 'Alert');
    },
  },

  methods: {
    //#region Warning method
    onExposureWarning(reason) {
      this.show = this.SPACES;
      console.log(warn(`App.js: Emitting exposureWarning because "${reason}"`));
      const data = { userID: this.userID, reason };
      this.emitFromClient('exposureWarning', data, (results) =>
        this.auditor.logEntry(
          `exposureWarning (for ${reason}) results: ${printJson(results)}`,
          'Warnings'
        )
      );
    },
    //#endregion

    //#region Welcome method
    // username passed in from Welcome
    connectMe(username = this.username) {
      // create() takes username from localStorage
      this.username = username;
      console.assert(this.username, 'No username available');
      console.assert(this.sessionID, 'No sessionID available');
      this.usernameAlreadySelected = true;

      console.log('Connecting', this.username);
      this.$socket.client.auth = {
        username: this.username,
        sessionID: this.sessionID,
      };
      this.$socket.client.open();
    },
    //#endregion

    //#region GoogMap methods
    onAddedPlace(place) {
      if (!place) {
        alert("oops. I didn't get that. Please try again.");
        return;
      }
      const { name, placeId, lat, lng } = place;

      this.selectedSpace = {
        name: name,
        id: placeId,
        lat: lat,
        lng: lng,
      };
      this.show = this.CALENDAR;
    },

    //#endregion

    //#region Calendar methods
    onDeleteVisit(e) {
      this.selectedSpace = e;
      const query = {
        username: this.username,
        userID: this.$socket.client.userID,
        selectedSpace: e.name,
        start: e.start,
        end: e.end,
      };
      this.auditor.logEntry(
        `DELETE Visit query: ${printJson(query)}`,
        'DELETE Visit'
      );

      // send the visit to the server
      this.emitFromClient('deleteVisit', query, (results) => {
        this.auditor.logEntry(
          `Delete Visit Results: ${printJson(results)}`,
          'DELETE Visit'
        );

        this.confirmationMessage = `You have deleted ${this.selectedSpace.name}`;
        this.hasSaved = true;
      });
    },

    // TODO Whey does Calendar send two events that land at the same place here?
    onLogVisit(visit) {
      if (!this.$socket.client.userID) {
        this.confirmationColor = 'orange';
        this.confirmationMessage = `You are not connected to the server`;
        this.hasSaved = true;
        return;
      }
      const { id, name, start, end, logged, oldStart, oldEnd } = visit;
      console.log('What is visit.id?', id);
      this.selectedSpace = visit;
      const query = {
        username: this.username,
        userID: this.$socket.client.userID,
        selectedSpace: name,
        start: start,
        end: end,
        logged: logged,
        oldStart: oldStart,
        oldEnd: oldEnd,
      };
      console.log(highlight(`App.js: Visit to process: ${printJson(visit)}`));
      console.log(highlight(`App.js: Visit query: ${printJson(query)}`));
      this.auditor.logEntry(`Visit query: ${printJson(query)}`, 'Log Visit');

      // send the visit to the server
      this.updateVisitOnGraph(query).then((node) => {
        // here's where we update the logged field to the id of the graph node
        // TODO Visit is not installed yet
        Visit.updateLoggedPromise(id, node.id).then((v) => {
          console.log(success(`Returned Visit:`, printJson(v)));
          console.log(highlight(`Updated Visit to:`, printJson(visit)));
        });

        console.log('updateVisitOnGraph', name, node);

        this.auditor.logEntry(
          `Log Visit Results: ${printJson(node)}`,
          'Log Visit'
        );

        this.confirmationColor = '';
        this.confirmationMessage = `You have logged ${this.selectedSpace.name}`;
        this.hasSaved = true;
      });
    },

    updateVisitOnGraph(query) {
      console.log('query to update graph:', printJson(query));
      return new Promise((resolve) => {
        this.emitFromClient('logVisit', query, (results) => {
          resolve(results);
        });
      });
    },

    //#endregion Calendar methods

    // these are BASE methods

    act() {
      if (this.action === 'refresh') {
        this.refreshApp();
      } else {
        this.add2HomeScreen();
      }
    },

    emitFromClient(event, data, ack) {
      console.log(event, data, ack);
      this.$socket.client.emit(event, data, ack);
    },

    onError(e) {
      console.log(`Sending error to server`, e);
      this.emitFromClient('client_error', e);
    },

    onUserFeedback(e) {
      console.log('userFeedback:', e);
      this.emitFromClient('userFeedback', e);
    },

    resetSpaces() {
      this.selectedSpace = null;
      this.show = this.SPACES;
    },

    showRefreshUI(e) {
      // Display a snackbar inviting the user to refresh/reload the app due
      // to an app update being available.
      // The new service worker is installed, but not yet active.
      // Store the ServiceWorkerRegistration instance for later use.
      this.action = 'refresh';
      this.registration = e.detail;
      this.snackBtnText = 'Refresh';
      this.snackWithBtnText = 'New version available!';
      this.snackWithButtons = true;
    },
    showAdd2HsUI(e) {
      // Display a snackbar inviting the user to refresh/reload the app due
      // to an app update being available.
      // The new service worker is installed, but not yet active.
      // Store the ServiceWorkerRegistration instance for later use.
      this.action = 'a2Hs';
      this.registration = e.detail;
      this.snackBtnText = 'Add';
      this.snackWithBtnText = 'Add to Home Screen?';
      this.snackWithButtons = true;
    },

    add2HomeScreen() {
      this.snackWithButtons = false;
    },

    refreshApp() {
      this.snackWithButtons = false;

      // Protect against missing registration.waiting.
      if (!this.registration || !this.registration.waiting) {
        return;
      }

      this.registration.waiting.postMessage('skipWaiting');
    },
  },

  watch: {
    location(location) {
      console.log(location);
    },
  },

  created() {
    console.log(process.env.VUE_APP_NAMESPACE);

    //#region PWA
    // Listen for swUpdated event and display refresh snackbar as required.
    document.addEventListener('swUpdated', this.showRefreshUI, { once: true });

    // Refresh all open app tabs when a new service worker is installed.
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (this.refreshing) return;
        this.refreshing = true;
        window.location.reload();
      });
    }
    document.addEventListener('beforeinstallprompt', this.showAdd2HsUI, {
      once: true,
    });

    document.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      alert('PWA was installed');
    });
    //#endregion PWA

    //#region Socket.io
    this.sessionID = localStorage.getItem('sessionID');
    this.username = localStorage.getItem('username');
    console.log('created()', this.username);
    if (this.sessionID) {
      this.usernameAlreadySelected = true;
      this.connectMe();
    }

    //#endregion
  },

  async mounted() {
    Visit.$fetch().then((visits) => console.log('Visits:', printJson(visits)));

    const self = this;
    const bp = self.$vuetify.breakpoint;
    console.log(
      'Breakpoint',
      bp.name,
      'width',
      bp.width,
      'height',
      bp.height,

      'mobile?',
      bp.mobile
    );
    self.bp = bp;
    self.namespace = process.env.VUE_APP_NAMESPACE;
    let x = localStorage.getItem('avgStay');
    if (x) {
      self.avgStay *= x;
    }
    console.log('Cached avgStay', x || 'empty');
    console.log('Total avgStay', self.avgStay);

    this.selectedSpace = null;
    console.log('App.vue mounted');
  },

  // TODO Figure out how to unsub events
  destroyed() {},
};
</script>
