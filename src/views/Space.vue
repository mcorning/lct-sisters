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
        ownThePlace,
        uid,
        onSharePlace,
        onShareGathering,
        onDeletePlace,
        setPoi,
        getPoi,
        usernumber,
        setSpecial,
        clearLocationSettings,
        setDefaultMapCenter,
        setPreferredGraph,
        updateLatLng,
        getGraphs,
        getRedisGraphs,
        enterLottery,
        setNamespace,
        getAllSettings,
        iWorkHere,
      }"
    >
      <Spaces
        :setSpecial="setSpecial"
        :clearLocationSettings="clearLocationSettings"
        :isConnected="isConnected"
        :state="state"
        :onToWork="onToWork"
        :onVisitPlace="onVisitPlace"
        :ownThePlace="ownThePlace"
        :iWorkHere="iWorkHere"
        :uid="uid"
        :onSharePlace="onSharePlace"
        :onShareGathering="onShareGathering"
        :onMarkerAdded="onMarkerAdded"
        :onMarkerClicked="onMarkerClicked"
        :onDeletePlace="onDeletePlace"
        :setPoi="setPoi"
        :getPoi="getPoi"
        :setDefaultMapCenter="setDefaultMapCenter"
        :setPreferredGraph="setPreferredGraph"
        :usernumber="usernumber"
        :emergency="emergency"
        :updateLatLng="updateLatLng"
        :getGraphs="getGraphs"
        :getRedisGraphs="getRedisGraphs"
        :enterLottery="enterLottery"
        :setNamespace="setNamespace"
        :getAllSettings="getAllSettings"
      />
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
    emergency: Boolean,
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
      const msg = `Space.vue error message: ${error.message}`;
      throw Error(msg);
    },
  },
  watch: {
    emergency(e) {
      console.log(e);
    },
    state() {
      console.log(this.state);
    },
  },

  mounted() {
    console.log('\tSPACE.vue mounted');
  },
};
</script>

<style></style>
