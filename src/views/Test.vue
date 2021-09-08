<template>
  <v-row justify="center" no-gutters>
    Test Val: {{ val }}.
    <testCard :test="test" />
  </v-row>
</template>

<script>
import testCard from '../components/cards/testCard.vue';

export default {
  name: 'Test',
  props: {
    test: {
      type: Function,
    },
    val: String,
  },

  components: {
    testCard,
  },

  data() {
    return {
      ready: false,
    };
  },

  methods: {},

  watch: {
    ready() {
      // this.test('Test mounted');
    },
  },

  async mounted() {
    this.ready = true;
    console.log('\tTEST.vue mounted');
  },

  // TODO Figure out how to unsub events
  destroyed() {
    alert('destroyed Test.vue');
  },
};
</script>
