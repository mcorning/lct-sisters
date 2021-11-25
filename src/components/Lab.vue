<template>
  <v-container fluid>
    <v-card-title>LCT Lab</v-card-title>
    <v-row>
      <v-col cols="12" md="8"> </v-col>
      <v-col> </v-col>
    </v-row>
  </v-container>
</template>

<script>
// import {Interval, DateTime} from '@/utils/luxonHelpers'
export default {
  name: 'Labcomponent',
  components: {},
  props: {
    getExposures: {
      type: Function,
      require: true,
    },
    getVisits: {
      type: Function,
      require: true,
    },
    exposures: Object,
  },
  computed: {},
  data() {
    return {
      visits: null,
    };
  },
  methods: {
    test() {},
  },
  watch: {
    exposures(val) {
      console.log(val[0]);
      console.log(this.visits[0].start);
    },
  },
  mounted() {
    const userID = 'df494086c836d25b';
    this.getExposures(userID);
    this.visits = this.getVisits();
    console.log('visits:', this.visits);
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
