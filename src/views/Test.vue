<template>
  <Model @error="onError" @updatedGraphTest="onUpdatedGraphTest">
    <div slot-scope="{ testGraph }">
      <test-card :testGraph="testGraph" :results="results" />
    </div>
  </Model>
</template>

<script>
import Model from '@/components/renderless/Model.vue';

import testCard from '@/components/cards/testCard.vue';

export default {
  name: 'Test',
  props: {},

  components: {
    testCard,
    Model,
  },
  computed: {
    test() {
      return ' success';
    },
  },
  data() {
    return {
      results: {},
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

    allRelationships() {
      // const query = `MATCH p=()-[*]->() RETURN p`;
    },
    onUpdatedGraphTest(res) {
      this.results = res;
      const { msg, results } = res;
      console.log(`${msg}: ${JSON.stringify(results, null, 3)}`);
    },
  },

  watch: {
    ready() {
      this.allRelationships();
    },
    res(n, o) {
      console.log(n, o);
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
