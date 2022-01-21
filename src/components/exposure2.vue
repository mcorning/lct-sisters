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
// import { getAlerts, log, print } from '../utils/alerts';
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
  methods: {
    // getAlertMessages(visits, alerts) {
    //   log(print(getAlerts(visits, alerts)));
    // },
  },
  mounted() {
    this.ready = true;
    const query = this.$route.query;
    this.openDiagnostics = query.d && query.d === '1';
  },
};
</script>

<style lang="scss" scoped></style>
