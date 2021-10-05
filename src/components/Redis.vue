<template>
  <div>
    <test-card :visitors=visitors :exposures=exposures></test-card>
  </div>
</template>

<script>
import testCard from './cards/testCard.vue';
export default {
  components: { testCard },
  props: {
    getVisitors: {
      type: Function,
      require: true,
    },
    visitors: Object,
    Exposures: Object,
  },
  mounted(){
    this.getVisitors()
  }
};
</script>

<style lang="scss" scoped></style>
