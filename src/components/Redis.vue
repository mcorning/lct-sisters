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
  },
};
</script>

<style lang="scss" scoped></style>
