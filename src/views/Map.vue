<template>
  <State>
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
  </State>
</template>

<script>
import Spaces from './GoogleMap.vue';

import State from '@/components/renderless/State.vue';

export default {
  name: `Map`,
  components: {
    Spaces,
    State,
  },
  data() {
    return {
      marker: null,
    };
  },
  methods: {
    // called by
    //  * onGo() with the shift startTime
    //  * mark your calendar button
    onVisitPlace(nativeEvent, startTime = Date.now(), endTime, shift) {
      console.log('Start Time:', startTime.toString());
      const selectedSpace = {
        ...this.place,
        startTime: startTime,
        endtime: endTime,
        shift: shift,
      };
      console.log('selectedSpace:', { ...selectedSpace });

      // TODO NOTE: be sure the router push to Calendar uses the same params everywhere
      // e.g., forgetting 'logVisit' and 'isConnected' below made Calendar misbehave
      // but when called from the appLayoutFooter push, Calendar could access logVisit.
      this.$router.push({
        name: 'Calendar',
        params: {
          selectedSpace,
        },
      });
    },
  },

  mounted() {},
};
</script>

<style></style>
