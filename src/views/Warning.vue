<template>
  <Model @error="onError">
    <div
      slot-scope="{
        isConnected,
        state,
        hasVisits,
        visitCount,
        hasUnloggedVisits,
        logVisits,
        onExposureWarning,
      }"
    >
      <exposure
        :isConnected="isConnected"
        :state="state"
        :hasVisits="hasVisits"
        :visitCount="visitCount"
        :hasUnloggedVisits="hasUnloggedVisits"
        :logVisits="logVisits"
        :onExposureWarning="onExposureWarning"
      />
    </div>
  </Model>
</template>

<script>
import Model from '@/components/renderless/Model.vue';
import Exposure from '@/components/Exposure.vue';

export default {
  name: 'Warning',

  components: {
    Model,
    Exposure,
  },
  methods: {
    onError(error) {
      // let the global error handler pick up and display this error
      error.message = `Time.vue error message: ${error.message}`;
      throw error;
    },
  },
};
</script>

<style lang="scss" scoped></style>
