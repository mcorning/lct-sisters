<template>
  <div>
    <redis-card
      :class="checkEmergency"
      :visitors="visitors"
      :exposures="exposures"
      :getVisits="getVisits"
      :visitExists="visitExists"
      @selectedChanged="onSelectedChanged"
    ></redis-card>
    <v-col v-if="openDiagnostics" no-gutters>
      <v-card flat>
        <v-btn absolute top right icon @click="openDiagnostics = false"
          ><v-icon>close</v-icon></v-btn
        >
        <v-btn plain text @click="emailDiagnostics" large class="mt-3 "
          >Diagnostics</v-btn
        >
        <v-card-text>
          <pre class="text-body-2">{{ diagnosticOutput }}</pre>
        </v-card-text>
      </v-card>
    </v-col>
  </div>
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
    diagnostics: Object,
    emergency: Boolean,
  },
  computed: {

    diagnosticOutput() {
      return this.diagnostics.join('\n');
    },
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
    // TODO why isn't this in Model?
    emailDiagnostics() {
      this.$clipboard(this.msg);
      window.location = `mailto:mcorning@soteriaInstitute.org?subject=Diagnostics&body=Paste copied text here, please.}`;
    },

    // TODO TEST: Does FireFox handle default args?
    onSelectedChanged(userID = this.$socket.client.auth.userID) {
      console.log('userID', userID);
      // in redis.js
      this.getExposures(userID);
      this.validateVisits(userID);
    },
  },
  watch: {
    diagnostics(val) {
      console.log('Diagnostic:', val);
      this.openDiagnostics = true;
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
