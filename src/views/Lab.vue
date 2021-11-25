<template>
  <Model @error="onError" @exposures="onExposures">
    <div slot-scope="{ getExposures, getVisits }">
      <lab
        :exposures="exposures"
        :getExposures="getExposures"
        :getVisits="getVisits"
      />
    </div>
  </Model>
</template>

<script>
import Model from '@/components/renderless/Model.vue';
import Lab from '@/components/Lab.vue';

export default {
  name: 'LabView',
  props: {},
  components: {
    Model,
    Lab,
  },
  data() {
    return {
      exposures: {},
    };
  },
  methods: {
    onExposures({ msg, exposures }) {
      this.exposures = exposures;
      console.log(`${msg}: ${JSON.stringify(exposures, null, 3)}`);
    },

    onError(error) {
      // let the global error handler pick up and display this error
      error.message = `Lab.vue error message: ${error.message}`;
      throw error;
    },
  },
  mounted() {},
};
</script>

<style lang="scss" scoped></style>
