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
      <v-container>
        <v-row justify="space-around">
          <v-col cols="12" sm="6">
            <v-text-field
              :value="state.currentPlace"
              label="Select a marker to mark your calendar:"
              dense
              hide-details
              readonly
            >
            </v-text-field>
          </v-col>
          <v-spacer />

          <v-col>
            <v-btn
              dark
              color="green darken-2"
              :disabled="!state.currentPlace"
              @click="onToWork"
              >Work</v-btn
            >
          </v-col>
          <v-col>
            <v-btn
              dark
              color="primary"
              :disabled="!state.currentPlace"
              @click="onVisitPlace"
              >Visit</v-btn
            >
          </v-col>
        </v-row>
      </v-container>
      <Spaces
        :isConnected="isConnected"
        :state="state"
        @markerAdded="onMarkerAdded"
        @markerClicked="onMarkerClicked"
        @deletePlace="onDeletePlace"
      />
      <v-row>
        <v-col>
          <label for="autoCompleteInput" class="mx-3">
            Search:
          </label>
          <input
            id="autoCompleteInput"
            size="30"
            placeholder="Enter place search terms here"
          />
        </v-col>
      </v-row>
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
  data() {
    return {};
  },
  methods: {
    onError(payload) {
      // let the global error handler pick up and display this error
      throw new Error(
        `Space.vue error message: ${payload.err.message}`,
        payload.err
      );
    },
  },

  mounted() {
    console.log('\tSPACE.vue mounted');
  },
};
</script>

<style></style>
