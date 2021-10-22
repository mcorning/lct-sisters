<template>
  <Model
    @error="onError"
    @spaces="onSpaces"
    @visitors="onVisitors"
    @exposures="onExposures"
  >
    <div slot-scope="{ getVisitors, getExposures, getVisits, visitExists, validateVisits, }">
      <redis
        :visitors="visitors"
        :exposures="exposures"
        :spaces="spaces"
        :getVisitors="getVisitors"
        :getExposures="getExposures"
        :getVisits="getVisits"
        :visitExists="visitExists"
        :validateVisits=validateVisits
      />
    </div>
  </Model>
</template>

<script>
import Model from '@/components/renderless/Model.vue';

import Redis from '../components/Redis.vue';

export default {
  name: 'Test',

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

    onVisitors(res) {
      const { msg, results } = res;
      this.visitors = results;
      console.log(`${msg}: ${JSON.stringify(results, null, 3)}`);
    },

    onExposures(res) {
      const { msg, results } = res;
      this.exposures = results;
      console.log(`${msg}: ${JSON.stringify(results, null, 3)}`);
    },
    onSpaces(res) {
      const { msg, results } = res;
      this.spaces = results;
      console.log(`${msg}: ${JSON.stringify(results, null, 3)}`);
    },
  },

  watch: {
    ready() {},
    visitors(n, o) {
      console.log('visitors', n, o);
    },
    exposures(n, o) {
      console.log('exposures', n, o);
    },
    spaces(n, o) {
      console.log('spaces', n, o);
    },
  },

  async mounted() {
    this.ready = true;
    console.log('\tTEST.vue mounted');
  },

  // TODO Figure out how to unsub events
  destroyed() {},
};
</script>
