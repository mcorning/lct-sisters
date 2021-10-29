<template>
  <div>
    <redis-card
      :visitors="visitors"
      :exposures="exposures"
      :getVisits="getVisits"
      :visitExists="visitExists"
      @selectedChanged="onSelectedChanged"
    ></redis-card>
  </div>
  <!-- add diagnostics here -->
</template>

<script>
// Monitor.vue calls this card

import RedisCard from './cards/redisCard.vue';

export default {
  components: { RedisCard },
  props: {
    getVisitors: {
      type: Function,
      require: true,
    },
    getExposures: {
      type: Function,
      require: true,
    },
    getVisits: {
      type: Function,
      require: true,
    },

    visitExists: {
      type: Function,
      require: true,
    },
    validateVisits: {
      type: Function,
      require: true,
    },

    visitors: Object,
    exposures: Object,
    emergency: Boolean,
  },
  computed: {
    checkEmergency() {
      if (!this.openDiagnostics) {
        return 'Map';
      }
      return this.$vuetify.breakpoint.mdAndUp ? 'EmergencyW' : 'EmergencyH';
    },
  },
  data() {
    return {
      openDiagnostics: this.emergency,
    };
  },
  methods: {
    onSelectedChanged(userID) {
      // in redis.js
      this.getExposures(userID);
      this.validateVisits(userID);
    },
  },
  mounted() {
    // called only once to get all visitors on the graphs used by the Visitor
    this.getVisitors();
    const query = this.$route.query;
    this.openDiagnostics = query.d && query.d === '1';
  },
};
</script>

<style lang="scss" scoped>
.EmergencyW {
  width: 50vw;
  height: 88vh;
}
.EmergencyH {
  width: 100vw;
  height: 50vh;
}

</style>
