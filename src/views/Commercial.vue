<template>
  <Model @error="onError" @exposures="onExposures">
    <div slot-scope="{ updateSponsor, sponsor, earnReward }">
      <Sponsor :updateSponsor="updateSponsor" :sponsor="sponsor" :earnReward="earnReward" />
    </div>
  </Model>
</template>

<script>
import Model from '@/components/renderless/Model.vue';
import Sponsor from '@/components/Sponsor.vue';

export default {
  name: 'LabView',
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
      error.message = `Commercial.vue error message: ${error.message}`;
      throw error;
    },
  },
  mounted() {
    console.log(this.$route.query);
  },
};
</script>

<style lang="scss" scoped></style>
