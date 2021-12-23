<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" md="8">
        <redis-card
          :visitors="visitors"
          :exposures="exposures"
          :getVisits="getVisits"
          :visitExists="visitExists"
          @selectedChanged="onSelectedChanged"
        ></redis-card>
      </v-col>
      <v-col>
        <v-card flat v-if="openDiagnostics">
          <v-btn absolute top right icon @click="openDiagnostics = false"
            ><v-icon>close</v-icon></v-btn
          >
          <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                v-bind="attrs"
                v-on="on"
                @click="emailDiagnostics"
                color="primary"
                large
                text
                class="mt-3"
              >
                <v-icon left>email</v-icon>
                Diagnostics
              </v-btn>
            </template>
            <span>Email diagnostics to LCT Dev Lead</span>
          </v-tooltip>

          <v-card-text>
            <pre class="text-body-2">{{ diagnosticOutput }}</pre>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
// Monitor.vue calls this card

import RedisCard from './cards/redisCard.vue';

export default {
  name: 'Redis',
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
    diagnostics: Array,
    emergency: Boolean,
  },
  computed: {
    diagnosticOutput() {
      return this.diagnostics.join('\n');
    },
  },
  data() {
    return {
      openDiagnostics: true,
    };
  },
  methods: {
    // TODO why isn't this in Model?
    emailDiagnostics() {
      // this.$clipboard(this.diagnosticOutput);
      window.location = `mailto:mcorning@soteriaInstitute.org?subject=Diagnostics&body=${this.diagnosticOutput}\n`;
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
// .EmergencyW {
//   width: 50vw;
//   height: 88vh;
// }
.SplitHorizontal {
  width: 100vw;
  height: 50vh;
}
</style>
