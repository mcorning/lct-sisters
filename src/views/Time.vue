<template>
  <Model @error="onError" @success="onSuccess">
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
    return { confirmations: '' };
  },
  methods: {
    onError(payload) {
      // let the global error handler pick up and display this error
      throw new Error(
        `Time.vue error message: ${payload.err.message}`,
        payload.err
      );
    },
    onSuccess(msg) {
      console.log(msg);
      this.confirmations = msg;
    },
  },

  mounted() {
    console.log('\tTIME.vue mounted');
  },
};
</script>

<style></style>
