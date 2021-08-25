<template>
  <Model @error="onError" @updatedModel="onUpdatedModel">
    <!-- Step 2/4: don't forget to ref a Model function next -->
    <div
      slot-scope="{
        isConnected,
        state,
        onUpdate,
        changeGraphName,
        getGraphName,
      }"
    >
      {{ state.visits.length }}
      <!-- Step 3/4: assign slotted props to component's props -->
      <Calendar
        :isConnected="isConnected"
        :state="state"
        :onUpdate="onUpdate"
        :confirmations="confirmations"
        :changeGraphName="changeGraphName"
        :getGraphName="getGraphName"
      />
    </div>
  </Model>
</template>

<script>
import Calendar from '@/components/Calendar.vue';

import Model from '@/components/renderless/Model.vue';

export default {
  name: `Time`,
  components: {
    Calendar,
    Model,
  },
  data() {
    return { confirmations: null };
  },
  methods: {
    onError(error) {
      // let the global error handler pick up and display this error
      error.message = `Time.vue error message: ${error.message}`;
      throw error;
    },
    onUpdatedModel(msg) {
      this.confirmations = msg;
    },
  },

  mounted() {
    console.log('\tTime.vue mounted');
  },
};
</script>

<style></style>
