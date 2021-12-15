<template>
  <keep-alive>
    <Model>
      <div
        slot-scope="{
          isConnected,
          usernumber,
          getVisitors,
          earnReward,
          namespace,
          setNamespace,
          getNamespace,
          state,
        }"
      >
        <component
          :is="layout"
          :isConnected="isConnected"
          :usernumber="usernumber"
          :getVisitors="getVisitors"
          :earnReward="earnReward"
          :getNamespace="getNamespace"
          :state="state"
        >
          <slot />
        </component>
        <v-row v-if="firstTime" justify="center">
          <welcome-dialog
            :namespace="namespace"
            :setNamespace="setNamespace"
            :getNamespace="getNamespace"
          ></welcome-dialog>
        </v-row>
      </div>
    </Model>
  </keep-alive>
</template>

<script>
import WelcomeDialog from '../components/prompts/welcomeDialog.vue';
const defaultLayout = 'AppLayoutDefault';
import Model from '../components/renderless/Model.vue';

export default {
  name: 'AppLayout',
  components: {
    Model,
    WelcomeDialog,
  },
  computed: {
    layout() {
      const layout = this.$route.meta.layout || defaultLayout;
      return () => import(`@/layouts/${layout}.vue`);
    },
    firstTime() {
      // TODO Jason didn't want this message in Singapore, and i'm not sure we need it anyway.
      return false; //!this.namespace;
    },
  },

  methods: {
    onOpenDiagnostics() {
      alert('openDiagnostics');
    },
  },
};
</script>
