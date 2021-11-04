<template>
  <Model @error="onError" @updatedModel="onUpdatedModel">
    <!-- Step 2/4: don't forget to ref a Model function next -->
    <div
      slot-scope="{
        isConnected,
        isDefaultGraph,
        state,
        onUpdate,
        setDefaultGraphName,
        usernumber,
        getVisits,
        updateGraphVisit,
      }"
    >
      <!-- Step 3/4: assign slotted props to component's props -->
      <Calendar
        :isConnected="isConnected"
        :isDefaultGraph="isDefaultGraph"
        :state="state"
        :onUpdate="onUpdate"
        :setDefaultGraphName="setDefaultGraphName"
        :confirmations="confirmations"
        :usernumber="usernumber"
        :getVisits="getVisits"
        :updateGraphVisit="updateGraphVisit"
        :emergency="emergency"
      />
    </div>
  </Model>
</template>

<script>
import Calendar from '@/components/Calendar.vue';

import Model from '@/components/renderless/Model.vue';

export default {
  name: `Time`,
  props: {
    emergency: Boolean,
  },
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

    /** Event handler that composes a confirmation message when user changes a visit
     *
     * @param updateResults - examples:
     *                         logging a visit uses:          { name, place_id, graphName, id, logged }
     *                         delete a visit in cache uses:  { id, deleted: true }
     *                         delete a visit graph uses:     { loggedVisitId, graphName, deleted: true, }
     */
    onUpdatedModel(updateResults) {
      console.log(JSON.stringify(updateResults, null, 3));

      // interpret update results function
      const getMsg = (updateResults) => {
        const {
          name,
          place_id,
          graphName,
          loggedVisitId,
          id,
          logged,
          deleted,
        } = updateResults;
        const msg = logged
          ? {
              logged: true,
              loggedVisitId: id,
              confirmationColor: 'success',
              confirmationMessage: `<strong>${name} (${place_id})</strong> logged to <strong>${graphName}</strong> graph on visit relationship ID <strong>${id}</strong>`,
            }
          : deleted
          ? {
              deleted: true,
              confirmationColor: loggedVisitId ? 'success' : 'warning',
              confirmationMessage: loggedVisitId
                ? `Visit ID ${loggedVisitId} deleted from ${graphName} graph`
                : 'You are offline. The graph will update when you connect.',
            }
          : 'Neither log nor delete operation results available';
        console.log('sending message to Calendar:', msg);
        return msg;
      };

      // use update results function to set the Calendar prop to display results of log/delete operation
      this.confirmations = getMsg(updateResults);
    },
  },

  mounted() {
    console.log('\tTime.vue mounted');
  },
};
</script>

<style></style>
