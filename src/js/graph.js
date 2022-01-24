import { highlight, success, printJson, getOnHours } from '@/utils/helpers';
export const graphMixin = {
  name: 'graphHelpers',

  methods: {
    // called by redis.js
    onDeleteNode(graphName, loggedVisitId) {
      const query = {
        loggedVisitId,
        graphName,
      };
      console.log('query to delete node on graph:', printJson(query));
      // send message to server
      this.emitFromClient(
        'deleteVisit',
        query,
        // and handle the callback
        (results) => {
          console.log(
            success('deleteVisitOnGraph results:', printJson(results))
          );
          this.$emit('updatedModel', {
            loggedVisitId,
            graphName,
            deleted: true,
          });
        }
      );
    },

    // called by onLogVisit() below
    updateVisitOnGraph(query) {
      console.log('query to update graph:', printJson(query));
      return new Promise((resolve, reject) => {
        // send message to server
        this.emitFromClient(
          'logVisit',
          query,
          // and handle the callback
          (results) => {
            console.log(
              success('updateVisitOnGraph results:', printJson(results))
            );
            if (results.error) {
              reject(results);
            } else {
              resolve(results);
            }
          }
        );
      });
    },

    onLogVisit(visit) {
      // TODO this should be an either-async
      return new Promise((resolve, reject) => {
        console.log(highlight(`App.js: Visit to process: ${printJson(visit)}`));
        const graphName = visit.graphName
          ? visit.graphName
          : prompt(
              'Unexpected state: we have no graph. Please enter your City and State'
            );

        const { id, name, place_id, start, end, loggedVisitId, interval } =
          visit;

        const { on, hours } = getOnHours(start, end);

        const query = {
          username: this.username,
          userID: this.$socket.client.auth.userID,
          selectedSpace: name,
          place_id,
          start,
          end,
          date: new Date(start).toDateString(),
          interval,
          loggedVisitId,
          graphName,
          on,
          hours,
        };
        console.log(highlight(`App.js: Visit query: ${printJson(query)}`));

        // send the visit to the server
        this.updateVisitOnGraph(query)
          .then((redisResult) => {
            if (!(redisResult.id && redisResult.id >= 0)) {
              throw new Error(`Redis could not log Visit to  ${name}`);
            }
            const graphData = {
              name,
              visitId: id,
              loggedVisitId: redisResult.id,
              graphName: redisResult.graphName,
              color: 'primary',
            };
            console.log('updateVisitOnGraph() graphData:', graphData);
            resolve(graphData);
          })
          .catch((err) => {
            reject(err);
          });
      });
    },

    // called by event edit process
    updateGraphVisit(param) {
      console.log('Incoming query params:', printJson(param));
      return new Promise((resolve, reject) => {
        // send message to server
        try {
          this.emitFromClient(
            'updateVisit',
            param,
            // and handle the callback
            (result) => {
              console.log(success('updateGraphVisit() results:', result.msg));
              resolve(result);
            }
          );
        } catch (error) {
          reject(error);
        }
      });
    },
  },
};
