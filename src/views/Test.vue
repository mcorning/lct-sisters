<template>
  <div>
    <div @click="clickHandler1">Click 1</div>
    <div
      @click="clickHandler2"
      v-clipboard="text"
      v-clipboard:success="clipboardSuccessHandler"
      v-clipboard:error="clipboardErrorHandler"
    >
      Click 2
    </div>
    <v-textarea></v-textarea>
  </div>
</template>

<script>
// import testCard from '../components/cards/testCard.vue';

export default {
  name: 'Test',
  props: {},

  components: {
    // testCard,
  },
  computed: {
    test() {
      return ' success';
    },
  },
  data() {
    return {
      ready: false,
      text:
        'http://localhost:8080/?place_id%3DChIJFWkctxkxv1QRLhhGQdCn4gE%26date%3D2021-09-22%26start%3D1632351600000%26end%3D1632360600000%26n',
    };
  },

  methods: {
    clickHandler1() {
      this.$clipboard({ test: this.test, text: this.text }); // this.$clipboard copy any String/Array/Object you want
    },
    clickHandler2() {},
    clipboardSuccessHandler() {
      console.log('clipboardSuccessHandler');
    },
    clipboardErrorHandler() {
      console.log('clipboardErrorHandler');
    },
  },

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
  destroyed() {},
};
</script>
