<template>
  <v-app>
    <v-app-bar color="primary" app dark>
      <v-app-bar-nav-icon></v-app-bar-nav-icon>
      <v-toolbar-title>Local Contact Tracing-Sisters</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon>
        <v-icon>search</v-icon>
      </v-btn>
      <v-btn icon>
        <v-icon>favorite</v-icon>
      </v-btn>
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
    };
  },

  created() {
    console.log(process.env.VUE_APP_MAP_API_KEY);
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
    });
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
};
</script>
