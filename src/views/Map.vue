<template>
  <State>
    <div slot-scope="{ isConnected, state }">
      <googgle-map :isConnected="isConnected" :state="state" />
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
  mounted() {},
};
</script>
