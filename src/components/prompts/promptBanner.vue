<template>
  <div>
    <v-banner v-if="riskScore" :key="refresh" :color="getAlertColor">
      <v-card :color="getAlertColor">
        <v-card-title class=text-h6>COVID Exposure Early Warning System</v-card-title>
        <v-card-text tile v-html="alertMessage" />
        Warnings received to date: <strong>{{ warningsReceived }}</strong>
      </v-card>
      <template v-slot:actions="{ dismiss }">
        <v-btn text @click="dismiss">Dismiss </v-btn>
      </template>
    </v-banner>
  </div>
</template>

<script>
export default {
  name: 'promptBanner',
  props: {
    riskScore: Object,
    refresh: Number,
    showBanner: Boolean,
    warningsReceived: Number,
  },
  computed: {
    getAlertColor() {
      const { reliability: relativeRisk } = this.riskScore;
      if (relativeRisk < 25) return 'amber';
      if (relativeRisk < 75) return 'orange';
      return 'red';
    },

    alertMessage() {
      const { score, reliability } = this.riskScore;
      const msg = `A fellow visitor warns of possible COVID-19 exposure.
      <p>
       Their self-reported risk value: <strong>${score}</strong>. Relative Risk ${Math.round(
        reliability,
        0
      )}% of total risk.
      </p>
  For this reason, please get tested.<br/>
  Quarantine and warn others, if necessary.`;
      return msg;
    },
  },
  data() {
    return { ready: false };
  },
  methods: {},
  watch: {
    ready() {
      console.log(this.riskScore);
    },
    showBanner(n, o) {
      console.log(n, o);
    },
    riskScore() {
      console.log(
        'RISK SCORE:',
        this.riskScore,
        Object.keys(this.riskScore).length
      );
    },
  },

  mounted() {
    this.ready = true;
    console.log('promptBanner mounted');
  },
};
</script>

<style lang="scss" scoped></style>
