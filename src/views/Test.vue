<template>
  <Model @error="onError" @updatedTest="onUpdatedTest">
    <div slot-scope="{ testGraph }">
      <test-card :testGraph="testGraph" />
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
      results: '',
      query: `MATCH p=()-[*]->() RETURN p`,
      ready: false,
    };
  },

  methods: {
    allRelationships() {
      // const query = `MATCH p=()-[*]->() RETURN p`;
    },
    onUpdatedTest(val) {
      alert(val);
    },
  },

  watch: {
    ready() {
      this.allRelationships();
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
