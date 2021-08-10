<template>
  <Model @error="onError" @updatedModel="onUpdatedModel">
    <div slot-scope="{ isConnected, state, onUpdate }">
      <Calendar
        :isConnected="isConnected"
        :state="state"
        :onUpdate="onUpdate"
        :confirmations="confirmations"
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
    console.log('\tTIME.vue mounted');
  },
};
</script>

<style></style>
