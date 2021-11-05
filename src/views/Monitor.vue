<template>
  <Model
    @error="onError"
    @spaces="onSpaces"
    @visitors="onVisitors"
    @exposures="onExposures"
  >
    <div
      slot-scope="{
        getVisitors,
        getExposures,
        getVisits,
        getPlaces,
        visitExists,
        validateVisits,
        diagnostics,
      }"
    >
      <redis
        :visitors="visitors"
        :exposures="exposures"
        :spaces="spaces"
        :getVisitors="getVisitors"
        :getExposures="getExposures"
        :getPlaces="getPlaces"
        :getVisits="getVisits"
        :visitExists="visitExists"
        :validateVisits="validateVisits"
        :diagnostics="diagnostics"
      />
    </div>
  </Model>
</template>

<script>
import Model from '@/components/renderless/Model.vue';

import Redis from '../components/Redis.vue';

export default {
  name: 'Monitor',
  props: {},
  components: {
    Model,
    Redis,
  },
  computed: {
    test() {
      return ' success';
    },
  },
  data() {
    return {
      visitorsMap: null,
      visitors: {},
      exposures: {},
      spaces: {},
      query: `MATCH p=()-[*]->() RETURN p`,
      ready: false,
    };
  },

  methods: {
    onError(error) {
      // let the global error handler pick up and display this error
      error.message = `Time.vue error message: ${error.message}`;
      throw error;
    },

    onVisitors({ msg, visitors }) {
      this.visitors = visitors;
      console.log(`${msg}: ${JSON.stringify(visitors, null, 3)}`);
    },

    onExposures({ msg, exposures }) {
      this.exposures = exposures;
      console.log(`${msg}: ${JSON.stringify(exposures, null, 3)}`);
    },

    onSpaces(res) {
      const { msg, results } = res;
      this.spaces = results;
      console.log(`${msg}: ${JSON.stringify(results, null, 3)}`);
    },
  },

  watch: {
    ready() {},
    visitors(n) {
      console.log('visitors:', JSON.stringify(n, null, 3));
    },
    exposures(n) {
      console.log('exposures:', JSON.stringify(n, null, 3));
    },
    spaces(n) {
      console.log('spaces:', JSON.stringify(n, null, 3));
    },
  },

  async mounted() {
    this.ready = true;
    console.log('\tMONITOR.vue mounted');
  },

  // TODO Figure out how to unsub events
  destroyed() {},
};
</script>
