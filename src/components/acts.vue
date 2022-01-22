<template>
  <v-container fluid>
    <prompt-banner
      :alert="alert"
      :riskScore="riskScore"
      :refresh="refresh"
    ></prompt-banner>
    <v-btn @click="act">Warn them</v-btn>
    <v-card-title>CoVid Early Warning System</v-card-title>
    <v-card-subtitle
      >The virus likely visited these places when you did</v-card-subtitle
    >
    <pre class="text-caption">{{ visits }}</pre>
    <v-row>
      <v-col cols="12" md="8"> </v-col>
      <v-col> </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { getAlerts, log, print } from '../utils/alerts';
import PromptBanner from '../components/prompts/promptBanner.vue';
import { liftMappedKeysFrom } from '../utils/helpers';

export default {
  name: 'acts',
  components: { PromptBanner },
  props: {
    state: Object,
    addWarnings: Function,
    updateVisit: Function,
  },
  computed: {
    visits() {
      return this.state.visits;
    },
  },
  data() {
    return {
      riskScore: '',
      refresh: '',
      alert: 'No Exposure Alerts at this time.',
    };
  },
  sockets: {
    //NOTE: the one emitting the alert is not going to see the alert handled here
    // The only ones to handle are waiting for it
    broadcastedAlert(alerts) {
      this.alert = getAlerts(this.state.visits, alerts);
    },
  },
  methods: {
    act() {
      // we are adding warnings to the warning Stream in srv/redis/stream.js
      const visitData = this.state.visits.map((v) => {
        console.log(log(print(v.id, v.place_id, v.start, v.end)), 'warnings');
        return { id: v.id, place_id: v.place_id, start: v.start, end: v.end };
      });
      console.log(
        `warnThem() sending ${
          this.$socket.client.auth.userID
        } visits: ${JSON.stringify(visitData, null, 2)}`
      );
      // TODO add back riskScore
      this.addWarnings({
        visitData,
      }).then((warnings) => {
        // update visits with warning sids
        // each warning as the original vid and the new ssid
        const data=Object.values(warnings).flat()
        log(print(data),'warning data')
        const x=liftMappedKeysFrom([{ fm: 'vid', to: 'id' }, {fm:'ssid', to:'wsid'}],data)
        log(print(x),'updating data')
        this.updateVisit(x)
        this.alerts = warnings;
      });
    },
  },
  watch: {},
  mounted() {
    console.log('Act component mounted:');
    console.log(' ');
  },
};
</script>

<style lang="scss" scoped>
.SplitHorizontal {
  width: 100vw;
  height: 50vh;
}
</style>
