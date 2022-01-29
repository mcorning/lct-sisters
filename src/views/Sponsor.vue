<template>
  <Model @error="onError">
    <div
      slot-scope="{ updateSponsor, sponsor, earnReward, isConnected, audit }"
    >
      <Sponsor
        :updateSponsor="updateSponsor"
        :sponsor="sponsor"
        :earnReward="earnReward"
        :isConnected="isConnected"
        :audit="audit"
      />
    </div>
  </Model>
</template>

<script>
import Model from '@/components/renderless/Model.vue';
import Sponsor from '@/components/Sponsor.vue';

export default {
  name: 'SponsorView',
  props: {},
  components: {
    Model,
    Sponsor,
  },
  data() {
    return {};
  },
  methods: {
    onError(error) {
      // let the global error handler pick up and display this error
      const msg = `Sponsor.vue error message: ${error.message}`;
      throw Error(msg);
    },
  },
  mounted() {
    console.log(this.$route.query);
  },
};
</script>

<style lang="scss" scoped></style>
