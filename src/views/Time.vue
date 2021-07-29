<template>
  <Model @error="onError" @success="onSuccess">
    <div slot-scope="{ isConnected, state, onUpdate }">
      <Calendar
        :isConnected="isConnected"
        :state="state"
        :onUpdate="onUpdate"
        :successFul="successFul"
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
    return { successFul: '' };
  },
  methods: {
    onError(error) {
      throw error;
    },
    onSuccess(msg) {
      console.log(msg);
      this.successFul = msg;
    },
  },

  mounted() {
    console.log('Time.vue mounted');
  },
};
</script>

<style></style>
