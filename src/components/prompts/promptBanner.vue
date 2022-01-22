<template>
  <div>
    <v-banner v-if="alert" :key="refresh" dark :color="getAlertColor">
      <v-card :color="getAlertColor" flat>
        <v-card-title class="text-sm-h4 text-subtitle-2"
          >COVID Early Warning System</v-card-title
        >
        <v-card-subtitle
          >A fellow visitor warns of possible COVID-19
          exposure.</v-card-subtitle
        >
        <v-card-text tile v-html="alertMessage" />
        <v-divider />
        <v-card-text
          class="text-subtitle-1"
          v-html="callToAction"
        ></v-card-text>
        <v-card outlined
          ><v-card-text>
            <pre>{{ alert }}</pre>
          </v-card-text></v-card
        >
      </v-card>
      <template v-slot:actions="{ dismiss }">
        <v-btn text @click="dismiss">Dismiss </v-btn>
      </template>
    </v-banner>
  </div>
</template>

<script>
import { printJson, isEmpty } from '@/utils/helpers';

export default {
  name: 'promptBanner',
  props: {
    riskScore: Object,
    refresh: Number,
    showBanner: Boolean,
    alert: Object,
  },
  computed: {
    callToAction() {
      const { reliability } = this.riskScore;
      return reliability === 0
        ? `<p><strong>This is a drill. This is ONLY A DRILL.</strong><p/>
        If this had been an actual EXPOSURE ALERT you would get tested for COVID immediately. <br/>This drill simulates getting such an ALERT. 
        <p><strong>DO NOT ACT ON THIS INCIDENT.</strong></p>`
        : `<p>For this reason, please get tested <strong>now</strong>. Otherwise time is not our ally in this war against the virus.<p/> 
        Quarantine and warn others, if necessary.`;
    },
    getAlertColor() {
      if (isEmpty(this.riskScore)) {
        return;
      }
      const { reliability } = this.riskScore;
      if (reliability === 0) {
        return 'green';
      }
      if (reliability < 25) return 'amber';
      if (reliability < 75) return 'orange';
      return 'red';
    },

    alertMessageX() {
      const { score, reliability } = this.riskScore;
      // const details = objectToKeyedArray(this.alert);
      // console.log('details :>> ', JSON.stringify(details, null, 2));
      // const alerts = details.map((v) => v[1]);
      return `${score} ${reliability}`;
    },

    alertMessage() {
      return
      const { score, reliability } = this.riskScore;

      const details = Object.entries(this.alert)[0][1][1];

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
      console.log(printJson(this.alert), 'alert:>>');
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
