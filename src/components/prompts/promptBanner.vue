<template>
  <div>
    <v-banner v-if="riskScore" :color="getAlertColor">
      {{ alertMessage }}
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
    showBanner:Boolean,
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
       Self-reported risk value: ${score}. Relative Risk ${Math.round(
        reliability,
        0
      )}% of total risk.
      
  For this reason, please get tested.
  Quarantine and warn others, if necessary.`;
      return msg;
    },
  },
  data() {
    return { ready: false,  };
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
