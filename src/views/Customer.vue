<template>
  <Model @error="onError">
    <div
      slot-scope="{
        callUpdateRewardPoints,
        state,
        earnReward,
        getRewardPoints,
        getPointsFromCustomer,
        isConnected,
        rewardMap,
        getSponsorRewards,
        rewardingSponsors,
        redeemReward,
        audit,
      }"
    >
      <Customer
        :state="state"
        :getRewardPoints="getRewardPoints"
        :earnReward="earnReward"
        :isConnected="isConnected"
        :callUpdateRewardPoints="callUpdateRewardPoints"
        :rewardMap="rewardMap"
        :rewardingSponsors="rewardingSponsors"
        :getSponsorRewards="getSponsorRewards"
        :getPointsFromCustomer="getPointsFromCustomer"
        :redeemReward="redeemReward"
        :audit="audit"
      />
    </div>
  </Model>
</template>

<script>
import Model from '@/components/renderless/Model.vue';
import Customer from '@/components/Customer.vue';

export default {
  name: 'CustomerView',
  props: {},
  components: {
    Model,
    Customer,
  },
  data() {
    return {};
  },
  methods: {
    onError(error) {
      // let the global error handler pick up and display this error
      const msg = `Customer.vue error message: ${error.message}`;
      throw Error(msg);
    },
  },
  watch: {},
  mounted() {
    console.log(this.$route.query);
  },
};
</script>

<style lang="scss" scoped></style>
