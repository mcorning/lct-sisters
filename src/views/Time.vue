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
        earnReward,
        getVisitByID,
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
        :earnReward="earnReward"
        :getVisitByID="getVisitByID"
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
    earnReward: Function,
  },
  components: {
    Calendar,
    Model,
  },
  computed: {},

  data() {
    return { confirmations: null };
  },
  methods: {
    logged(loggedVisitId) {
      return loggedVisitId >= 0;
    },

    onError(error) {
      // let the global error handler pick up and display this error
      const msg = `Time.vue error message: ${error.message}`;
      throw Error(msg);
    },

    /** Event handler that composes a confirmation message when user changes a visit
     *
     * @param updateResults - examples:
     *                         logging a visit uses:          { name, place_id, graphName, id, logged }
     *                         delete a visit in cache uses:  { id, deleted: true }
     *                         delete a visit graph uses:     { loggedVisitId, graphName, deleted: true, }
     */
    onUpdatedModel(val) {
      console.log(val);
      console.log(' ');
      this.confirmations = val;
    },
    onUpdatedModelOld({
      name,
      place_id,
      graphName,
      loggedVisitId,
      id,
      logged,
      deleted,
      shared,
    }) {
      console.log('\nIn onUpdatedModel(');
      console.log(
        JSON.stringify(
          {
            name,
            place_id,
            graphName,
            loggedVisitId,
            id,
            logged,
            deleted,
            shared,
          },
          null,
          3
        )
      );
      console.log(')');
      // interpret update results function
      const getMsg = ({
        name,
        place_id,
        graphName,
        loggedVisitId,
        id,
        logged,
        deleted,
      }) => {
        const msg = logged(loggedVisitId)
          ? `<strong>${name} (${place_id})</strong> logged to <strong>${graphName}</strong> graph on visit relationship ID <strong>${id}</strong>`
          : deleted
          ? `Visit ID ${loggedVisitId} deleted from ${graphName} graph`
          : 'You are offline. The graph will update when you connect.';

        //  :'Neither log nor delete operation results available'

        console.log('sending message to Calendar:', msg);
        return msg;
      };

      // use update results function to set the Calendar prop to display results of log/delete operation
      const msg = getMsg({
        name,
        place_id,
        graphName,
        loggedVisitId,
        id,
        logged,
        deleted,
      });
      this.confirmations = {
        name,
        deleted,
        shared,
        logged,
        loggedVisitId,
        msg,
      };
    },
  },

  mounted() {
    console.log('\tTime.vue mounted');
  },
};
</script>

<style></style>
