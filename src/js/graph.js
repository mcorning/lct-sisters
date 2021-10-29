import { highlight, success, printJson } from '@/utils/helpers';
export const graphMixin = {
  name: 'graphHelpers',

  methods: {
    onDeleteNode(loggedVisitId, graphName) {
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

    onLogVisit(visit) {
      console.log(highlight(`App.js: Visit to process: ${printJson(visit)}`));

      const {
        id,
        name,
        place_id,
        start,
        end,
        loggedVisitId,
        graphName,
        interval,
      } = visit;
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
            loggedVisitId: redisResult.id,
            graphName: redisResult.graph,
          };
          console.log('updateVisitOnGraph() data:', data);
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
    updateGraphVisit(param) {
      console.log('query params:', printJson(param));
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
