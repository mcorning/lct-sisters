import { highlight, success, printJson } from '@/utils/helpers';
export const graphMixin = {
  name: 'graphHelpers',

  methods: {
    // called by onLogVisit() below
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

    onLogVisit(visit) {
      return new Promise((resolve, reject) => {
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
            const graphData = {
              name,
              visitId: id,
              loggedVisitId: redisResult.id,
              graphName: redisResult.graph,
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
