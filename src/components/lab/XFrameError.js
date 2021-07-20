export default {
  props: {
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
  errorCaptured(err, vm, info) {
    this.err = err;
    this.vm = vm;
    this.info = info;
    this.$emit('error', { err, vm, info });
    // Optionally capture errors.
    return !this.capture;
  },
  render() {
    return this.$scopedSlots.default({
      err: this.err,
      vm: this.vm,
      info: this.info,
      reset: this.reset,
    });
  },
};
