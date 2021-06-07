<template>
  <v-app>
    <v-app-bar color="primary" app dark>
      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-btn icon v-bind="attrs" v-on="on" @click="qrDialog = !qrDialog">
            <v-icon>mdi-qrcode</v-icon>
          </v-btn>
        </template>
        <span>Toggle QR to share LCT</span></v-tooltip
      >

      <v-toolbar-title
        >{{ xxs ? 'LCT' : 'Local Contact Tracing' }} -
        {{ namespace }}</v-toolbar-title
      >

      <v-spacer></v-spacer>
      {{ version }}
      <v-icon right class="pl-3">{{ connectIcon }} </v-icon>

      <!-- Options Menu-->
      <nestedMenu
        :menu-items="fileMenuItems"
        @nestedMenu-click="onMenuItemClick"
      />
      <!-- <v-menu bottom left>
TODO Incorporate this header data into nestedMenu
        <v-list two-line subheader dense>
          <v-list-item>
            <v-list-item-avatar>
              <v-img :src="getAvatar()"></v-img>
            </v-list-item-avatar>

            <v-list-item-content>
              <v-list-item-title>Visitor</v-list-item-title>
              <v-list-item-subtitle v-html="username"></v-list-item-subtitle>
              <v-list-item-subtitle>{{ bpWidth }}</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>-->

      <!-- End Options Menu-->
    </v-app-bar>
    <v-main>
      <error-boundary @error="onError($event)">
        <v-alert v-if="errorState" class="mt-10" type="error" dismissible>
          <v-card dark>
            <v-card-title class="headling ">
              Oops. Sorry, we messed up.
            </v-card-title>
            <v-card-subtitle>
              Devs now know what to fix. You may have to restart
              LCT.</v-card-subtitle
            >
            <v-card-text>
              Source: {{ errorState.source }}
              <br />
              Exception: {{ errorState.message }}
            </v-card-text>
            <v-card-text v-if="errorState.stack">
              Stack (for the devs):
              <br />
              {{ errorState.stack }}
            </v-card-text>
          </v-card>
        </v-alert>
        <v-container class="fill-height" fluid>
          <!-- QR Dialog -->
          <v-dialog
            id="qrCodeDialog"
            v-model="qrDialog"
            max-width="400"
            max-height="400"
            transition="dialog-bottom-transition"
          >
            <v-card>
              <v-tooltip top>
                <template v-slot:activator="{ on, attrs }">
                  <v-img
                    class="mt-5"
                    src="../public/img/LCT-Sisters-QR.png"
                    v-bind="attrs"
                    v-on="on"
                    contain
                    @click="qrDialog = false"
                  ></v-img>
                </template>
                <span>Click to dismiss</span></v-tooltip
              >
            </v-card>
          </v-dialog>

          <FeedbackCard
            v-if="feedbackDialog"
            @endFeedback="feedbackDialog = false"
          ></FeedbackCard>

          <v-row v-if="!usernameAlreadySelected" justify="center" no-gutters>
            <Welcome @connectMe="onConnectMe($event)" />
          </v-row>

          <!-- GoogleMap, Warning, and Calendar components -->
          <v-row
            id="controlsContainer"
            v-if="usernameAlreadySelected"
            class="fill-height"
            align="start"
            justify="center"
            no-gutters
          >
            <v-col v-if="showSpaces" class="text-center">
              <GoogleMap
                v-model="location"
                :auditor="auditor"
                @addedPlace="onAddedPlace"
                @log="onLog"
                @error="onError($event)"
                @manageAppointment="onManageAppointment"
              />
            </v-col>

            <v-col v-if="showWarning" class="text-center">
              <Warning
                @exposureWarning="onExposureWarning($event)"
                @returnToSpaces="show = SPACES"
              />
            </v-col>

            <v-col v-if="showCalendar" class="text-center fill-height">
              <Calendar
                :avgStay="avgStay"
                :selectedSpace="selectedSpace"
                :graphName="graphName"
                :userID="userID"
                :username="username"
                @logVisit="onLogVisit"
                @updateLoggedVisit="onLogVisit"
                @deleteVisit="onDeleteVisit"
                @error="onError($event)"
                @manageAppointment="onManageAppointment"
              />
            </v-col>
          </v-row>

          <!-- PWA snackbar -->
          <v-snackbar
            v-model="snackWithButtons"
            bottom
            left
            timeout="-1"
            height="100px"
          >
            {{ snackWithBtnText }}
            <template v-slot:action="{ attrs }">
              <v-btn
                v-if="snackBtnText"
                text
                color="#00f500"
                v-bind="attrs"
                @click.stop="act"
              >
                {{ snackBtnText }}
              </v-btn>
              <v-btn icon class="ml-4" @click="snackWithButtons = false">
                <v-icon>close</v-icon>
              </v-btn>
            </template>
          </v-snackbar>
          <!-- End PWA snackbar -->

          <!-- Community Alert Snackbar -->
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
          <!-- End Community Alert Snackbar -->

          <!-- Individual Exposure Alert Snackbar -->
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
                Please get tested. If you are positive you can spread the virus
                - even if you are immune.</v-card-text
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
          <!-- End Individual Exposure Alert Snackbar -->
        </v-container>
      </error-boundary>
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
import { ErrorBoundary } from './components';

import Welcome from '@/components/Welcome';
import GoogleMap from '@/components/GoogleMap';
import Warning from '@/components/Warning';
import Calendar from '@/components/Calendar';

import {
  highlight,
  success,
  warn,
  getRandomIntInclusive,
  printJson,
} from './utils/colors';

import Visit from '@/models/Visit';
import Auditor from './utils/Auditor';
import FeedbackCard from './components/cards/feedbackCard.vue';

export default {
  name: 'App',

  components: {
    ErrorBoundary,

    Welcome,
    GoogleMap,
    Warning,
    Calendar,
    FeedbackCard,
    // AuditorCard: () => import('./components/cards/AuditorCard.vue'),
    // MenuCard: () => import('./components/cards/menuCard.vue'),
    nestedMenu: () => import('./components/cards/nestedMenuCard'),
  },

  computed: {
    bpWidth() {
      return this.bp
        ? 'screen width: ' + this.bp.width
        : 'unknown screen width';
    },

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
      return this.bp?.width < 420;
    },
    version() {
      return this.$version;
    },
  },

  data() {
    return {
      errorState: '',
      fileMenuItems: [
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
        // {
        //   name: 'Audit Log Tail:',
        //   subtitle: 'Captures key runtime data for review',
        //   icon: 'mdi-information-outline',
        //   color: 'yellow',
        //   menu: [],
        //   // menu: [
        //   //   { name: '1.1' },
        //   //   { name: '1.2' },
        //   //   {
        //   //     name: 'Sub-menu 2',
        //   //     menu: [
        //   //       { name: '2.1' },
        //   //       { name: '2.2' },
        //   //       {
        //   //         name: 'Sub-menu 3',
        //   //         menu: [
        //   //           { name: '3.1' },
        //   //           { name: '3.2' },
        //   //           {
        //   //             name: 'Sub-menu 4',
        //   //             menu: [{ name: '4.1' }, { name: '4.2' }, { name: '4.3' }],
        //   //           },
        //   //         ],
        //   //       },
        //   //     ],
        //   //   },
        //   // ],
        // },

        {
          name: 'Support',
          menu: [
            {
              name: 'Docs',
              subtitle: 'LCT Docs (applies to all instances of LCT)',
              action: 'Docs',
              icon: 'mdi-information-variant',
              color: 'yellow',
            },
            {
              subtitle: 'How can we support you?',
              name: 'Feedback',
              action: 'Feedback',
              icon: 'mdi-comment-quote-outline',
              color: 'purple',
            },
            {
              name: 'Donate',
              subtitle: 'How can you support us?',
              icon: 'mdi-help',
              action: 'Donate',
            },
          ],
        },
        { isDivider: true },

        {
          subtitle: 'Remove localStorage username/sessionID',
          name: 'Reset',
          action: 'Reset',
          icon: 'mdi-comment-quote-outline',
          color: 'orange',
        },
      ],

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
      graphName: '',

      // these are footer values
      value: 0,
      show: 0,
      SPACES: 0,
      CALENDAR: 1,
      WARNING: 2,
      dialog: false,
      userID: '',

      // these are BASE values

      v0: true,
      loggedMessage: '',
      qrDialog: false,
      feedbackDialog: false,
      showAuditLog: false,

      // used by getAvatar()
      gender: ['men', 'women'],

      // used by more menu icon

      items: [
        { divider: true },

        {
          header: 'Graphs (Green=active)',
        },
        {
          title: 'Sandbox',
          subtitle: 'Play around with LCT safely',
          moreActionId: 0,
          icon: 'mdi-graphql',
        },
        {
          title: this.$defaultGraphName,
          subtitle: 'Where real data goes',
          moreActionId: 0,
          icon: 'mdi-graphql',
        },

        { divider: true },

        {
          title: 'Reset',
          subtitle: 'Remove localStorage username/sessionID',
          moreActionId: 1,
          icon: 'mdi-comment-quote-outline',
          color: 'orange',
        },
        {
          title: 'Docs',
          subtitle: 'LCT Docs (applies to all instances of LCT)',
          moreActionId: 1,
          icon: 'mdi-information-variant',
          color: 'yellow',
        },
        {
          title: 'Audit Log',
          subtitle: 'Captures key runtime data for review',
          moreActionId: 1,
          icon: 'mdi-information-outline',
          color: 'yellow',
        },

        { divider: true },
        {
          title: 'Feedback',
          subtitle: 'How are we doing?',
          moreActionId: 1,
          icon: 'mdi-comment-quote-outline',
          color: 'purple',
        },
      ],

      moreActions: ['changeGraph', 'actMore'],

      auditor: new Auditor(),
      snackBtnText: '',
      snackWithBtnText: '',
      snackWithButtons: false,
      action: '',
      bp: null,
      namespace: '',

      // for PWA
      refreshing: false,
      registration: null,
      updateExists: false,
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
      // sessions always load with the configured exposure graph
      // setting the current graph to Sandbox only happens after connecting to the server
      console.log('graphName used by redis', this.graphName);

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
    // TODO get this method to work here as it does in the reference implementation for exception-handler
    errorCaptured(err, vm, info) {
      this.err = err;
      this.vm = vm;
      this.info = info;

      return !this.stopPropagation;
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
          localStorage.removeItem('username');
          localStorage.removeItem('sessionID');
          localStorage.removeItem('usesPublicCalendar');
          localStorage.removeItem('people');
          localStorage.removeItem('slotInterval');
          localStorage.removeItem('openAt');
          localStorage.removeItem('closeAt');
          Visit.deleteAll();
          window.location.reload();
          break;
      }
    },

    getGraphName() {
      return this.graphName || this.$defaultGraphName;
    },

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
    onConnectMe(username = this.username) {
      // create() takes username from localStorage
      this.username = username;

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
      console.log(warn('App.onAddedPlace(place):'));
      console.log(warn(printJson(place)));
      // set the Calendar prop
      this.selectedSpace = place;
      console.log(success('Showing calendar'));
      this.show = this.CALENDAR;
    },

    //#endregion

    //#region Calendar methods
    onDeleteVisit(e) {
      const query = {
        loggedNodeId: e.loggedNodeId,
        useGraphName: e.graphName,
      };
      // this.selectedSpace = e;
      // const query = {
      //   loggedNodeId: this.selectedSpace.loggedNodeId,
      //   useGraphName: this.selectedSpace.graphName,
      // };
      if (!query.loggedNodeId) {
        this.onError(
          'error',
          'onDeleteVisit(e)',
          'Contract violation: Trying to delete an unlogged visit.'
        );
        return;
      }
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

        this.confirmationMessage = `You have deleted a visit to ${this.selectedSpace.name} on exposure graph ${this.selectedSpace.graphName}`;
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
      const { id, name, start, end, loggedNodeId, graphName, interval } = visit;
      console.log('What is visit.id?', id);
      this.selectedSpace = visit;
      const query = {
        username: this.username,
        userID: this.$socket.client.userID,
        selectedSpace: name,
        start: start,
        end: end,
        date: new Date(start).toDateString(),
        interval: interval,
        loggedNodeId,
        graphName,
      };
      console.log(highlight(`App.js: Visit to process: ${printJson(visit)}`));
      console.log(highlight(`App.js: Visit query: ${printJson(query)}`));
      this.auditor.logEntry(`Visit query: ${printJson(query)}`, 'Log Visit');

      // send the visit to the server
      this.updateVisitOnGraph(query).then((node) => {
        // here's where we update the logged field to the id of the graph node
        // TODO Visit is not installed yet
        const data = {
          visitId: id,
          loggedNodeId: node.id,
          useGraphName: this.getGraphName(),
        };
        Visit.updateLoggedPromise(data).then((v) => {
          console.log(success(`Returned Visit:`, printJson(v)));
          console.log(highlight(`Updated Visit to:`, printJson(visit)));
        });

        const msg = `${name} logged to ${this.getGraphName()} on node ${
          node.id
        }.`;
        this.snackBtnText = '';
        this.snackWithBtnText = msg;
        this.snackWithButtons = true;
        console.log('updateVisitOnGraph', name, msg, node);

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

    changeGraph(graphName) {
      // TODO will this setter interfere with session event?
      this.graphName =
        graphName === 'Sandbox' ? 'Sandbox' : this.$defaultGraphName;

      this.emitFromClient('changeGraph', this.graphName);
    },

    getAvatar() {
      const gender = this.gender[getRandomIntInclusive(0, 1)];
      const id = getRandomIntInclusive(1, 99);
      const avatar = `https://randomuser.me/api/portraits/${gender}/${id}.jpg`;
      return avatar;
    },

    getColorOfCurrentGraph(item) {
      if (item.moreActionId === 0) {
        return item.title === this.getGraphName() ? 'green' : 'red';
      }
      return item.color;
    },

    act() {
      if (this.action === 'refresh') {
        this.refreshApp();
      } else {
        this.add2HomeScreen();
      }
    },
    onMore(action, id) {
      switch (id) {
        case 0:
          this.changeGraph(action);
          break;
        case 1:
          this.actOnMore(action);
      }
    },

    actOnMore(action) {
      switch (action) {
        case 'Audit Log':
          this.showAuditLog = true;
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
        case 'Reset':
          localStorage.removeItem('username');
          localStorage.removeItem('sessionID');
          localStorage.removeItem('usesPublicCalendar');
          localStorage.removeItem('people');
          localStorage.removeItem('slotInterval');
          localStorage.removeItem('openAt');
          localStorage.removeItem('closeAt');
          Visit.deleteAll();
          window.location.reload();
          break;
      }
    },

    emitFromClient(eventName, data, ack) {
      this.$socket.client.emit(eventName, data, ack);
    },

    onError(e) {
      this.errorState = {
        source: e.source,
        message: e.error,
        stack: e.stack,
      };
      console.log(`Sending error to server`, e);
      this.emitFromClient('client_error', e);
    },

    onUserFeedback(e) {
      console.log('userFeedback:', e);
      this.emitFromClient('userFeedback', e);
    },
    onManageAppointment(e) {
      console.log('Appointment:', e);
      this.emitFromClient('manageAppointment', e);
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
      this.updateExists = true;

      this.snackBtnText = 'Refresh';
      this.snackWithBtnText = 'New version available!';
      this.snackWithButtons = true;
      console.log(highlight('Rendering Refesh snackbar'));
    },
    showOfflineUI() {
      this.snackBtnText = 'Offline';
      this.snackWithBtnText =
        'You are offline right now. You can use the Recent Visits list, however.';
      this.snackWithButtons = true;
      console.log(highlight('Rendering Offline snackbar'));
    },
    // showAdd2HsUI(e) {
    //   // Display a snackbar inviting the user to refresh/reload the app due
    //   // to an app update being available.
    //   // The new service worker is installed, but not yet active.
    //   // Store the ServiceWorkerRegistration instance for later use.
    //   this.action = 'a2Hs';
    //   this.registration = e.detail;
    //   this.snackBtnText = 'Add';
    //   this.snackWithBtnText = 'Add to Home Screen?';
    //   this.snackWithButtons = true;
    // },

    // add2HomeScreen() {
    //   this.snackWithButtons = false;
    // },

    refreshApp() {
      this.updateExists = false;

      this.snackWithButtons = false;

      // Protect against missing registration.waiting.
      if (!this.registration || !this.registration.waiting) {
        return;
      }

      this.registration.waiting.postMessage('skipWaiting');
    },
    onLog(msg, heading = 'Info') {
      this.auditor.logEntry(msg, heading);

      // not sure menu items are best way to show log
      // const x = [...this.auditor.getLog().values()];
      // const y = x.map((v) => {
      //   return { name: v.message };
      // });
      // this.fileMenuItems[3].menu = y;
    },
    refreshData() {
      localStorage.removeItem('username');
      localStorage.removeItem('sessionID');
      localStorage.removeItem('usesPublicCalendar');
      localStorage.removeItem('people');
      localStorage.removeItem('slotInterval');
      localStorage.removeItem('openAt');
      localStorage.removeItem('closeAt');
      Visit.deleteAll();
      window.location.reload();
    },
  },

  watch: {
    // this only works once (when newValue happens to be null)
    // 'auditor.log': {
    //   immediate: true,
    //   handler(newValue) {
    //     this.result = newValue.message;
    //   },
    // },
  },

  created() {
    console.groupCollapsed('Creating App:');

    console.log(process.env.VUE_APP_NAMESPACE);

    //#region PWA
    // Listen for swUpdated event and display refresh snackbar as required.
    document.addEventListener('swUpdated', this.showRefreshUI, { once: true });
    document.addEventListener('offline', this.showOfflineUI, { once: true });

    // Refresh all open app tabs when a new service worker is installed.
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (this.refreshing) return;
        this.refreshing = true;
        window.location.reload();
      });
    }
    // document.addEventListener('beforeinstallprompt', this.showAdd2HsUI, {
    //   once: true,
    // });

    document.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
    });
    //#endregion PWA

    //#region Socket.io
    this.sessionID = localStorage.getItem('sessionID');
    this.username = localStorage.getItem('username');
    console.log('created()', this.username);
    if (this.sessionID) {
      this.usernameAlreadySelected = true;
      this.onConnectMe();
    }
    console.groupEnd();
    //#endregion
  },

  async mounted() {
    console.groupCollapsed('Mounting App:');
    const goodData = localStorage.getItem('goodData');
    Visit.$fetch().then((all) => {
      if (all.visits && !goodData && confirm('Refresh data?')) {
        this.refreshData();
        localStorage.setItem('goodData', true);
      }
    });

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
    self.selectedSpace = null;
    self.graphName = self.$defaultGraphName;
    console.log(self.graphName);
    self.usernameAlreadySelected = localStorage.getItem('username');
    self.show =
      localStorage.getItem('usesPublicCalendar') === 'true'
        ? this.CALENDAR
        : this.SPACES;

    console.log('App.vue mounted');
    console.groupEnd();
  },

  // TODO Figure out how to unsub events
  destroyed() {},
};
</script>
