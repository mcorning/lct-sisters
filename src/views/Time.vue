<template>
  <Model>
    <div
      slot-scope="{
        isConnected,
        state,
        relevantEvents,
        onUpdateVisit,
        onLogVisit,
      }"
    >
      <Calendar
        :isConnected="isConnected"
        :state="state"
        :relevantEvents="relevantEvents"
        @updateVisit="onUpdateVisit"
        @logVisit="onLogVisit"
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
    return {};
  },
  methods: {},

  mounted() {
    console.log('Time.vue mounted');
  },
};
</script>

<style></style>
