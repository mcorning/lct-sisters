<script>
export default {
  props: {
    // by setting capture true, console.log (or any other code) will not report the error
    capture: {
      default: false,
      type: Boolean,
    },
  },
  data() {
    return {
      err: false,
      vm: null,
      info: null,
    };
  },
  methods: {
    reset() {
      this.err = null;
      this.vm = null;
      this.info = null;
      this.$emit('reset');
    },
  },
  // Vue hook. see: https://vuejs.org/v2/api/#errorCaptured
  errorCaptured(err, vm, info) {
    this.err = err;
    // we use all the args from Vue's errorCaptured()
    this.vm = vm;
    this.info = info;
    this.$emit('error', { err, vm, info });
    // Optionally capture errors and fully handle them in FrameError.vue
    return !this.capture;
  },

  // to get render() to work, I had to turn Markus' FrameError.js into FrameError.vue
  render() {
    return this.$scopedSlots.default({
      err: this.err,
      vm: this.vm,
      info: this.info,
      reset: this.reset,
    });
  },
};
</script>
