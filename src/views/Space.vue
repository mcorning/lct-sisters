<template>
  <Model @error="onError">
    <div
      slot-scope="{
        isConnected,
        state,
        onMarkerClicked,
        onMarkerAdded,
        onToWork,
        onVisitPlace,
        onShareGathering,
        onDeletePlace,
      }"
    >
      <v-container fluid>
        <v-row>
          <Spaces
            :isConnected="isConnected"
            :state="state"
            :onToWork="onToWork"
            :onVisitPlace="onVisitPlace"
            :onShareGathering="onShareGathering"
            :onMarkerAdded="onMarkerAdded"
            :onMarkerClicked="onMarkerClicked"
            :onDeletePlace="onDeletePlace"
        /></v-row>
      </v-container>
    </div>
  </Model>
</template>

<script>
import Spaces from '@/components/GoogleMap.vue';

import Model from '@/components/renderless/Model.vue';

export default {
  name: `Space`,
  components: {
    Spaces,
    Model,
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
