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
        :confirmations="confirmations"
        :changeGraphName="changeGraphName"
        :setDefaultGraphName="setDefaultGraphName"
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

    // updatedModel emitted by Model's visitLogged() and emitFromClient() as a guard against offline state
    // so updateResults can have the update details or a preset message, respectively
    // TODO this design might smell off, just a bit...
    onUpdatedModel(updateResults) {
      const getMsg = (updateResults) => {
        const { name, graphName, loggedNodeId } = updateResults;
        const msg = {
          logged: true,
          confirmationColor: 'success',
          confirmationMessage: `${name} logged to ${graphName} graph on node ${loggedNodeId}`,
        };
        console.log('emitting updatedModel with:', msg);
        return msg;
      };
      this.confirmations =
        updateResults.logged > -1 ? updateResults : getMsg(updateResults);
    },
  },

  mounted() {
    console.log('\tTime.vue mounted');
  },
};
</script>

<style></style>
