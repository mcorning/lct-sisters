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
            place: loggedVisitId,
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
        start: start,
        end: end,
        date: new Date(start).toDateString(),
        interval: interval,
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
    updateVisitOnGraphWithParm(query, param) {
      // example param: {id:'134345'}
      console.log('query to update graph:', printJson(query));
      console.log('query params:', printJson(param));
      return new Promise((resolve, reject) => {
        // send message to server
        try {
          this.emitFromClient(
            'updateVisit',
            { query, param },
            // and handle the callback
            (results) => {
              console.log(
                success(
                  'updateVisitOnGraphWithParm() results:',
                  printJson(results)
                )
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
