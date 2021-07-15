<template>
  <!-- the new layouts strategy https://itnext.io/vue-tricks-smart-layouts-for-vuejs-5c61a472b69b
  still requires the v-app wrapper for vuetify to work properly -->
  <v-app>
    <AppLayoutHeader :namespace="namespace" />

    <v-main>
      <!-- Step 2: include all and only properties from State render() function -->

      <State>
        <!-- NOTE: ApplyLayout is configured in main.js -->
        <AppLayout
          slot-scope="{
            state,
            connectMe,
            emitFromClient,
            logVisit,
            lastLoggedNodeId,
            isConnected,
          }"
        >
          <!-- you MUST assign relevant props below in each relevent component 
               you can assign ALL methods from renderless component here
               and then assign only those needed by a working component in that component's props object

               Step 3: pass on all properties from State render() function to dynamic components
          -->
          <router-view
            :state="state"
            :connectMe="connectMe"
            :emitFromClient="emitFromClient"
            :isConnected="isConnected"
            :logVisit="logVisit"
            :lastLoggedNodeId="lastLoggedNodeId,"
            @exposureWarning="onExposureWarning"
          />
          <small> Ready...</small>
        </AppLayout>
      </State>
    </v-main>
    <AppLayoutFooter />
  </v-app>
</template>

<script>
//thanks to danvega: https://youtu.be/JwccQYpsE2Q for tip on router events
// TODO NOTE: ApplyLayout is configured in main.js

import AppLayoutHeader from '@/layouts/AppLayoutHeader';
import AppLayoutFooter from '@/layouts/AppLayoutFooter';
import State from '../src/components/renderless/State.vue';
// import Setting from '@/models/Setting';
// import Visit from '@/models/Visit';
// import Place from '@/models/Place';
// import Appointment from '@/models/Appointment';

export default {
  name: 'App',
  components: {
    AppLayoutFooter,
    AppLayoutHeader,
    State,
  },

  computed: {
    state() {
      return this.data;
    },
  },

  data() {
    return {
      userID: 'mpc',
      namespace: 'Sisters',

      // for PWA
      refreshing: false,
      registration: null,
      updateExists: false,
      initialState: {},
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

  mounted() {
    // const self = this;
    // Promise.all([
    //   Place.$fetch(),
    //   Visit.$fetch(),
    //   Appointment.$fetch(),
    //   Setting.$fetch(),
    // ])
    //   .then((entities) => {
    //     const places = entities[0].places || [];
    //     const visits = entities[1].visits || [];
    //     const appointments = entities[2].appointments || [];
    //     // there is only one settings array element
    //     const settings = entities[3].settings[0] || [];
    //     self.validateEntities();
    //     self.initialState = { places, visits, appointments, settings };
    //     console.log('mounted State component');
    //   })
    //   .catch((err) =>
    //     this.throwError({
    //       source: 'Calendar.mounted()',
    //       error: err,
    //       comment: 'This is bad.',
    //     })
    //   );
  },
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
