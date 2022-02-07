<script>
import { getAlerts, log, print } from '../../utils/alerts';
import { liftMappedKeysFrom, printJson, isEmpty } from '../../utils/helpers';

export default {
  computed: {
    visitsWithoutWsid() {
      return this.$parent.state.visits
        .filter((v) => !v.wsid)
        .map((v) => {
          console.log(log(print(v.id, v.place_id, v.start, v.end)), 'warnings');
          return { id: v.id, place_id: v.place_id, start: v.start, end: v.end };
        });
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
    // The only ones to handle the alerts are the ones waiting for it
    // NOTE: this is one of two times we getAlerts()
    // The second time is when we launch the app in AppLayoutDefault.vue.
    broadcastedAlert(alerts) {
      this.alert = getAlerts(this.state.visits, alerts).flat();
    },
  },

  methods: {
    emitFromClient(eventName, data, ack) {
      this.$socket.client.emit(eventName, data, ack);
    },
    // visits includes: {id:v.id, place_id: v.place_id, start: v.start, end: v.end };
    // TODO replace with real score data
    addWarnings({ visitsWithoutWsid, score, reliability }) {
      console.log('visitsWithoutWsid, score, reliability');
      console.log(printJson(visitsWithoutWsid), score, reliability);
      return new Promise((resolve) => {
        this.emitFromClient(
          'addWarnings',
          { visitsWithoutWsid, score, reliability },
          (warnings) => resolve(warnings)
        );
      });
    },
    trace(warnings) {
      console.log('warnings :>> ', printJson(warnings));
      return warnings;
    },
    getWsids(warnings) {
      // update visits with warning sids
      // each warning as the original vid and the new ssid
      const keysMap = [
        { fm: 'vid', to: 'id' },
        { fm: 'ssid', to: 'wsid' },
      ];
      const ids = Object.values(warnings).map((c) =>
        liftMappedKeysFrom(keysMap, c)
      );

      console.log('getWsids() ids :>> ', printJson(ids));
      return ids;
    },
    setAlert(len) {
      const msg = `You raised ${len} exposure warnings for others to evaluate. Well Done.`;
      console.log('SetAlert msg :>> ', msg);
      this.alert = msg;
    },

    act() {
      if (isEmpty(this.visitsWithoutWsid)) {
        this.alert = 'No new warnings. All Visits have a value for wsid.';
        return;
      }
      // we are adding warnings to the warning Stream in srv/redis/stream.js
      // TODO add back riskScore
      const visitsWithoutWsid = this.visitsWithoutWsid;
      const score = 76,
        reliability = 10;
      this.addWarnings({ visitsWithoutWsid, score, reliability })
        .then((warnings) => this.trace(warnings))
        .then((warnings) => this.getWsids(warnings))
        .then((wsids) => this.$parent.updateVisit(wsids[0]))
        .then((x) => this.setAlert(x.length));
    },
  },
  mounted() {
    // in case the alerts come at login...
    this.alert = this.warnings;
  },
  render() {
    // The first user of Model will not see data if we render() while loading
    if (this.loading) {
      return { loading: this.loading };
    }
    return this.$scopedSlots.default({
      act: this.act,
    });
  },
};
</script>

<style lang="scss" scoped></style>
