<template>
  <v-app>
    <v-app-bar color="primary" app dark>
      <v-app-bar-nav-icon></v-app-bar-nav-icon>
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
        <v-row align="start" justify="center" no-gutters>
          <v-col class="text-center">
            <GoogleMap
              v-if="showSpaces"
              v-model="location"
              @addedPlace="onAddedPlace"
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
        <v-btn grow @click="show = SPACES">
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
import GoogleMap from '@/components/GoogleMap';
// import GoogleMap from '@/components/Vue2GoogleMap';

export default {
  name: 'App',
  data() {
    return {
      // For GoogleMap component
      location: {},

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
  components: {
    GoogleMap,
  },

  computed: {
    // Navigation properties
    showSpaces() {
      return this.show == this.SPACES;
    },
    showWarningButton() {
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
      return this.bp?.width < 360;
    },
    version() {
      return this.$version;
    },
  },

  methods: {
    //#region GoogMap methods
    onAddedPlace() {
      alert('make me');
    },
    //#endregion

    // these are BASE methods
    act() {
      if (this.action === 'refresh') {
        this.refreshApp();
      } else {
        this.add2HomeScreen();
      }
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
    console.log(process.env.VUE_APP_MAP_API_KEY);
    console.log(process.env.VUE_APP_NAMESPACE);

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
  },

  async mounted() {
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
    console.log('App.vue mounted');
    self.bp = bp;
    self.namespace = process.env.VUE_APP_NAMESPACE;
  },
};
</script>
