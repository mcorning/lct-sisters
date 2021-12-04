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
        <v-card-title v-html="callToAction"></v-card-title>
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
    callToAction() {
      const { reliability } = this.riskScore;
      return reliability === 0
        ? 'This is a drill. This is ONLY A DRILL. <br/>If this had been an actual EXPOSURE ALERT you would get tested for COVID. This drill simulates getting such an ALERT. <br/>DO NOT ACT ON THIS INCIDENT.'
        : 'For this reason, please get tested now. Time is not our ally.<br/> Quarantine and warn others, if necessary.';
    },
    getAlertColor() {
      const { reliability } = this.riskScore;
      if (reliability === 0) {
        return 'green';
      }
      if (reliability < 25) return 'amber';
      if (reliability < 75) return 'orange';
      return 'red';
    },

    alertMessage() {
      const { score, reliability } = this.riskScore;
      const details = Object.entries(this.alert);

      let msg = `<p>
       Their self-reported <br/><strong>Risk Value: ${score}</strong><br/><strong> Relative Risk ${Math.round(
        reliability,
        0
      )}%</strong> of total risk.
      </p>
      <p>You were exposed in ${details.length} public places</p><dl>`;

      let map = new Map(Object.entries(details));

      map.forEach((value) => {
        let map2 = new Map(Object.entries(value));
        map2.forEach((propVals) => {
          let s = propVals;
          if (Array.isArray(s)) {
            s.forEach((v) => {
              msg += `<dd class="ml-5">Exposed on: <strong>${v.exposedOn}</strong> for <strong>${v.exposedFor} ${v.nominalTime}</strong></dd>`;
            });
          } else {
            msg += `<dt>Place: ${s}</dt>`;
          }
        });
      });
      msg += `</dl>`;
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
