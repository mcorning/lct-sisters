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
        onDeletePlace,
      }"
    >
      <v-container fluid>
        <!--

          <v-col v-if="state.currentPlace">
            <v-btn dark color="green darken-2" @click="onToWork">Work</v-btn>
          </v-col>
          <v-col v-if="state.currentPlace">
            <v-btn dark color="primary" @click="onVisitPlace">Visit</v-btn>
          </v-col>
        </v-row> -->
        <v-row>
          <Spaces
            :isConnected="isConnected"
            :state="state"
            @markerAdded="onMarkerAdded"
            @markerClicked="onMarkerClicked"
            @deletePlace="onDeletePlace"
            @delMarker="onDelMarker"
        /></v-row>
        <!--    <v-row>
          <v-col>
             <v-text-field
              dense
              id="autoCompleteInput"
              hint="Enter place search terms here"
              persistent-hint
            ></v-text-field> 
          </v-col>
        </v-row>-->

        <v-snackbar v-model="snackbar" color="orange"
          >{{ message }}
          <template v-slot:action="{ attrs }">
            <v-btn
              color="black"
              text
              v-bind="attrs"
              @click="deleteMarker(onDeletePlace)"
            >
              Yes
            </v-btn>
            <v-btn color="black" text v-bind="attrs" @click="snackbar = false">
              No
            </v-btn>
          </template>
        </v-snackbar>
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
    onDelMarker(marker) {
      this.selectedMarker = marker;
      this.message = `Delete marker for ${marker.name} from the map?`;
      this.snackbar = true;
    },
    onError(error) {
      // let the global error handler pick up and display this error
      error.message = `Space.vue error message: ${error.message}`;
      throw error;
    },
    deleteMarker(onDeletePlace) {
      this.selectedMarker.setMap(null);
      onDeletePlace(this.selectedMarker.place_id);
      this.selectedMarker = null;
      this.snackbar = false;
    },
  },
  watch: {},

  mounted() {
    console.log('\tSPACE.vue mounted');
  },
};
</script>

<style></style>
