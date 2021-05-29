<template>
  <div>
    <slot
      v-if="err"
      name="error"
      v-bind:err="err"
      v-bind:vm="vm"
      v-bind:info="info"
    >
      <v-alert type="error" dismissible>
        <p>An unexpected error occurred at: {{ info }}</p>
        <p>Message: {{ err.message }}</p>
        <p>Stack: {{ err.stack }}</p>
        <v-btn href="https://lct-sisters.herokuapp.com">Go Back</v-btn>
      </v-alert>
    </slot>
    <slot v-else></slot>
  </div>
</template>

<script>
export default {
  name: 'error-boundary',
  props: {
    stopPropagation: Boolean,
  },
  data() {
    return {
      err: false,
      vm: null,
      info: null,
    };
  },
  errorCaptured(err, vm, info) {
    if (
      confirm(
        'If you are using a previous version of LCT, we need to delete your data because it is missing the place_id property.'
      ) === 'Ok'
    ) {
      alert('deleting data');
    }
    this.err = err;
    this.vm = vm;
    this.info = info;
    this.$emit('error', { err, vm, info });
    return !this.stopPropagation;
  },
};
</script>

<style lang="scss" scoped></style>
