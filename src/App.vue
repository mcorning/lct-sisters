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
      <!-- <v-btn icon>
        <v-icon>search</v-icon>
      </v-btn>
      <v-btn icon>
        <v-icon>favorite</v-icon>
      </v-btn> -->
      <v-btn icon>
        <v-icon>more_vert</v-icon>
      </v-btn>
    </v-app-bar>
    <v-main>
      <!-- Add to Home Screen 
      and PWA update -->
      <v-snackbar v-model="snackWithButtons" bottom right timeout="-1">
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
    </v-main>
  </v-app>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      refreshing: false,
      registration: null,
      snackBtnText: '',
      snackWithBtnText: '',
      snackWithButtons: false,
      action: '',
      bp: null,
      namespace: '',
    };
  },
  computed: {
    xxs() {
      return this.bp?.width < 360;
    },
    version() {
      return this.$version;
    },
  },

  methods: {
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
    console.log('Visitor.vue mounted');
    self.bp = bp;
    self.namespace = process.env.VUE_APP_NAMESPACE;
  },
};
</script>
