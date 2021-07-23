<template>
  <State>
    <div slot-scope="{ isConnected, state }">
      <v-container>
        <v-row justify="space-between">
          <v-spacer></v-spacer>
          <v-btn>Go to Work</v-btn
          ><v-btn @click="onVisitPlace">Visit Place</v-btn
          ><v-btn @click="onMakeAppointment">Make Appointment</v-btn
          ><v-btn>Delete Marker</v-btn>
          <v-spacer></v-spacer>
        </v-row>
      </v-container>
      <googgle-map
        :isConnected="isConnected"
        :state="state"
        @markerClicked="onMarkerClicked"
      />
    </div>
  </State>
</template>

<script>
// import MarkerClusterer from '@google/markerclustererplus';

import GooggleMap from './GoogleMap.vue';
// import { printJson } from '../utils/colors';

import State from '@/components/renderless/State.vue';

export default {
  name: `Map`,
  components: {
    GooggleMap,
    State,
  },
  data() {
    return {
      marker: null,
    };
  },
  methods: {
    onVisitPlace() {},

    onMarkerClicked(marker) {
      this.marker = marker;
    },
  },

  mounted() {},
};
</script>
