<template>
  <Model @error="onError" @updatedModel="onUpdatedModel">
    <!-- Step 2/4: don't forget to ref a Model function next -->
    <div
      slot-scope="{
        isConnected,
        isDefaultGraph,
        state,
        onUpdate,
        changeGraphName,
        setDefaultGraphName,
        getGraphName,
      }"
    >
      <!-- Step 3/4: assign slotted props to component's props -->
      <Calendar
        :isConnected="isConnected"
        :isDefaultGraph="isDefaultGraph"
        :state="state"
        :onUpdate="onUpdate"
        :changeGraphName="changeGraphName"
        :setDefaultGraphName="setDefaultGraphName"
        :getGraphName="getGraphName"
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

    onUpdatedModel(updateResults) {
      console.log(JSON.stringify(updateResults, null, 3));
      const getMsg = (updateResults) => {
        const { place, graphName, id } = updateResults;
        const msg = {
          logged: true,
          confirmationColor: 'success',
          confirmationMessage: `${place} logged to ${graphName} graph on visit relationship ID ${id}`,
        };
        console.log('sending message to Calendar:', msg);
        return msg;
      };
      this.confirmations = getMsg(updateResults);
      // updateResults.logged > -1 ? updateResults : getMsg(updateResults);
    },
  },

  mounted() {
    console.log('\tTime.vue mounted');
  },
};
</script>

<style></style>
