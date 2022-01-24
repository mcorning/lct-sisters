<template>
  <Model @error="onError">
    <div
      slot-scope="{
        isConnected,
        state,
        hasVisits,
        visitCount,
        logVisits,
        onExposureWarning,
        getUnloggedVisits,
        setVaccinationStatus,
        addWarnings,
      }"
    >
      <exposure
        :isConnected="isConnected"
        :state="state"
        :hasVisits="hasVisits"
        :visitCount="visitCount"
        :logVisits="logVisits"
        :onExposureWarning="onExposureWarning"
        :getUnloggedVisits="getUnloggedVisits"
        :setVaccinationStatus="setVaccinationStatus"
        :emergency="emergency"
        :addWarnings="addWarnings"
      />
    </div>
  </Model>
</template>

<script>
import Model from '@/components/renderless/Model.vue';
import Exposure from '@/components/Exposure.vue';

export default {
  name: 'Warning',
  props: {
    emergency: Boolean,
  },
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
