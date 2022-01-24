<template>
  <v-sheet class="overflow-auto fill-height">
    <confirmation-snackbar
      v-if="confSnackbar"
      :centered="true"
      :top="true"
      :confirmationTitle="confirmationTitle"
      :confirmationMessage="confirmationMessage"
      :confirmationIcon="confirmationIcon"
      @disapprove="confSnackbar = false"
    />
  </v-sheet>
</template>

<script>
export default {
  data() {
    return {
      ready: false,
      confirmationTitle: 'Cvew',
      confirmationMessage: 'Ready',
      confirmationIcon: 'check',
      confSnackbar: true,
      openDiagnostics: false,
    };
  },
  methods: {},
  mounted() {
    this.ready = true;
    const query = this.$route.query;
    this.openDiagnostics = query.d && query.d === '1';
  },
};
</script>

<style lang="scss" scoped></style>
