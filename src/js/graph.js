import { highlight, success, printJson } from '@/utils/helpers';
export const graphMixin = {
  name: 'graphHelpers',

  methods: {
    onLogVisit(visit) {
      console.log(highlight(`App.js: Visit to process: ${printJson(visit)}`));

      const { id, name, start, end, loggedNodeId, graphName, interval } = visit;
      const query = {
        username: this.username,
        userID: this.$socket.client.userID,
        selectedSpace: name,
        start: start,
        end: end,
        date: new Date(start).toDateString(),
        interval: interval,
        loggedNodeId,
        graphName,
      };
      console.log(highlight(`App.js: Visit query: ${printJson(query)}`));

      // send the visit to the server
      this.updateVisitOnGraph(query)
        .then((redisResult) => {
          if (!redisResult.logged || !redisResult.id) {
            throw new Error(`Redis could not log Visit to  ${name}`);
          }
          const data = {
            visitId: id,
            loggedNodeId: redisResult.id,
            useGraphName: redisResult.graph,
          };
          console.log('updateVisitOnGraph() data:', data);

          // moved to time.js
          // Visit.updateById(data);
          // const msg = {
          //   logged: true,
          //   confirmationColor: 'success',
          //   confirmationMessage: `${name} logged to ${data.useGraphName} on node ${data.loggedNodeId}`,
          // };
          // this.$emit('updatedModel', msg);
        })
        .catch((err) => {
          this.$emit('error', err);
        });
    },

    updateVisitOnGraph(query) {
      console.log('query to update graph:', printJson(query));
      return new Promise((resolve, reject) => {
        // send message to server
        try {
          this.emitFromClient(
            'logVisit',
            query,
            // and handle the callback
            (results) => {
              console.log(
                success('updateVisitOnGraph results:', printJson(results))
              );
              resolve(results);
            }
          );
        } catch (error) {
          reject(error);
        }
      });
    },
  },
};
