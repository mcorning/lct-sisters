<template>
  <Model @error="onError">
    <div
      slot-scope="{
        needsUsername,
        updateUsername,
        isConnected,
        state,
        onMarkerClicked,
        onMarkerAdded,
        onToWork,
        onVisitPlace,
        onShareGathering,
        onDeletePlace,
        connectMe,
      }"
    >
      <prompt-banner
        :needsUsername="needsUsername"
        :updateUsername="updateUsername"
        :connectMe="connectMe"
        label="Your nickname"
        hint="You need some nickname to connect to the server:"
      />

      <Spaces
        :isConnected="isConnected"
        :state="state"
        :onToWork="onToWork"
        :onVisitPlace="onVisitPlace"
        :onShareGathering="onShareGathering"
        :onMarkerAdded="onMarkerAdded"
        :onMarkerClicked="onMarkerClicked"
        :onDeletePlace="onDeletePlace"
      />
    </div>
  </Model>
</template>

<script>
import Spaces from '@/components/GoogleMap.vue';

import Model from '@/components/renderless/Model.vue';
import promptBanner from '../components/prompts/promptBanner.vue';

export default {
  name: `Space`,
  components: {
    Spaces,
    Model,
    promptBanner,
  },
  props: {
    state: {
      type: Object,
    },
    isConnected: Boolean,
    onDeletePlace: Function,
  },

  data() {
    return {
      showButtons: true,
      snackbar: false,
      selectedMarker: null,
      message: '',
    };
  },
  methods: {
    onError(error) {
      // let the global error handler pick up and display this error
      error.message = `Space.vue error message: ${error.message}`;
      throw error;
    },
  },
  watch: {},

  mounted() {
    console.log('\tSPACE.vue mounted');
  },
};
</script>

<style></style>
