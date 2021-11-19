<template>
  <div>
    <v-banner v-if="alert" :key="refresh" :color="getAlertColor">
      <v-card :color="getAlertColor" flat>
        <v-card-title class="text-sm-h4  text-subtitle-2"
          >COVID Early Warning System</v-card-title
        >
        <v-card-subtitle
          >A fellow visitor warns of possible COVID-19
          exposure.</v-card-subtitle
        >
        <v-card-text tile v-html="alertMessage" />
        <v-card outlined
          ><v-card-text>
            Warnings received to date:
            <strong>{{ warningsReceived }}</strong></v-card-text
          ></v-card
        >
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
    alert: Object,
    riskScore: Object,
    refresh: Number,
    showBanner: Boolean,
    warningsReceived: Number,
  },
  computed: {
    getAlertColor() {
      const { reliability } = this.riskScore;

      if (reliability < 25) return 'amber';
      if (reliability < 75) return 'orange';
      return 'red';
    },

    alertMessage() {
      const { score, reliability } = this.riskScore;

      const currAlert = Object.entries(this.alert)[0][1][0];
      const msg = `<p>
       Their self-reported <br/><strong>Risk Value: ${score}</strong><br/><strong> Relative Risk ${Math.round(
        reliability,
        0
      )}%</strong> of total risk.
      </p>
      <p>You were exposed at ${currAlert.placeID} on ${
        currAlert.exposedOn
      } for approximately <strong>${currAlert.exposedFor} ${
        currAlert.nominalTime
      }</strong>.</p>
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
      console.log(JSON.stringify(this.alert, null, 3));
    },
    showBanner(n, o) {
      console.log(n, o);
    },
  },

  mounted() {
    this.ready = true;
    console.log('promptBanner mounted');
  },
};
</script>

<style lang="scss" scoped></style>
