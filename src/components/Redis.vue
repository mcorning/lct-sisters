<template>
  <div>
    <test-card
      :visitors="visitors"
      :exposures="exposures"
      :getVisits="getVisits"
      :visitExists="visitExists"
      @selectedChanged="onSelectedChanged"
    ></test-card>
  </div>
</template>

<script>
// Test.vue calls this card
import testCard from './cards/testCard.vue';
export default {
  components: { testCard },
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
  },
  methods: {
    onSelectedChanged(userID) {
      this.getExposures(userID);
      this.validateVisits(userID)
    },
  },
  mounted() {
    this.getVisitors();
  },
};
</script>

<style lang="scss" scoped></style>
