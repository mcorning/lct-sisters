<template>
  <!-- the new layouts strategy https://itnext.io/vue-tricks-smart-layouts-for-vuejs-5c61a472b69b
  still requires the v-app wrapper for vuetify to work properly -->
  <v-app>
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
    <v-main>
      <!-- NOTE: ApplyLayout is configured in main.js -->
      <AppLayout>
        <router-view @exposureWarning="onExposureWarning" />
      </AppLayout>
    </v-main>
  </v-app>
</template>

<script>
//thanks to danvega: https://youtu.be/JwccQYpsE2Q for tip on router events

export default {
  name: 'App',
  components: {},

  computed: {
    state() {
      return this.data;
    },
  },

  data() {
    return {
      userID: 'mpc',
      namespace: 'Sisters',

      snackBtnText: '',
      snackWithButtons: false,
      snackWithBtnText: '',

      // for PWA
      refreshing: false,
      registration: null,
      updateExists: false,
    };
  },

  methods: {
    onExposureWarning(reason) {
      alert('success' + reason);
    },
    showRefreshUI(e) {
      // TODO add back a generic <snackBar> component (see line 140 of AppOrig.js)
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
      console.log('Rendering Refesh snackbar');
    },
    showOfflineUI() {
      this.snackBtnText = 'Offline';
      this.snackWithBtnText =
        'You are offline right now. You can use the Recent Visits list, however.';
      this.snackWithButtons = true;
      console.log('Rendering Offline snackbar');
    },
    refreshApp() {
      this.updateExists = false;

      this.snackWithButtons = false;

      // Protect against missing registration.waiting.
      if (!this.registration || !this.registration.waiting) {
        return;
      }

      this.registration.waiting.postMessage('skipWaiting');
    },
  },

  created() {
    console.group('Creating PWA:');

    console.log('Namespace', process.env.VUE_APP_NAMESPACE);

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
    console.groupEnd();
  },

  mounted() {},

  destroyed() {
    // document.removeEventListener('swUpdated', this.showRefreshUI);
    // document.removeEventListener('offline', this.showOfflineUI);
    // document.removeEventListener('controllerchange', () => {
    //   if (this.refreshing) return;
    //   this.refreshing = true;
    //   window.location.reload();
    // });
    // document.removeEventListener('appinstalled', () => {
    //   console.log('PWA was installed');
    // });
  },
};
</script>
<style></style>
