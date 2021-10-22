import { success, warn, printJson } from '@/utils/helpers';
export const testMixin = {
  name: 'testFunctions',

  methods: {
    //#region Lab
    verifyData(data) {
      const visits = this.getVisits();

      const fromGraph = data
        .map((v) => v.edges)
        .flatMap((v) => v)
        .map((v) => {
          return {
            id: v.id,
            start: v.properties.start,
            end: v.properties.end,
          };
        });

      console.log('fromGraph:', JSON.stringify(fromGraph, null, 3));
      console.log('visits:', JSON.stringify(visits, null, 3));
      // bind the two arrays by id/loggedVisitId
    },

    getVisitedPaths() {
      const userID = this.selectedUserID || this.$socket.client.auth.userID;
      this.emitFromClient('getVisitedPaths', userID, this.verifyData);
    },

    validateVisitsX() {
      // TODO Alert: rewire dynamic graphs
      const graphName = this.$defaultGraphName;
      const userID = this.selectedUserID || this.$socket.client.auth.userID;
      this.emitFromClient('validateVisits', userID, (visitedIDs) => {
        const visits = this.getVisits();
        console.log(JSON.stringify(visits, null, 3));
        console.log('visitedIDs:', JSON.stringify(visitedIDs, null, 3));
        visitedIDs.forEach((id) => {
          const exists = visits.find((v) => v.loggedVisitId === id);
          console.log(`Visit ${id} ${exists ? 'exists' : 'does not exist'}`);
          if (!exists) {
            const query = {
              loggedVisitId: id, // use the same name as the delete query does on RedisGraph
              graphName,
            };
            this.emitFromClient(
              'deleteVisit',
              query,
              // and handle the callback
              (results) => {
                console.log(`loggedVisitId ${results} deleted from graph`);
              }
            );
          }
        });
      });
    },

    deleteVisitNode(loggedVisitId) {
      const query = {
        loggedVisitId, // use the same name as the delete query does on RedisGraph
        graphName: this.$defaultGraphName,
      };
      this.emitFromClient(
        'deleteVisit',
        query,
        // and handle the callback
        (results) => {
          console.log(`loggedVisitId ${results} deleted from graph`);
        }
      );
    },

    compareVisitData(fromGraph) {
      console.log('Validating Visit Data');
      console.log(warn('fromGraph:', printJson(fromGraph)));
      const localVisits = this.getVisits();
      // ensure old visits get their loggedVisitId converted to proper numeric value
      console.log(
        warn(
          'localStorage:',
          printJson(
            localVisits.map((v) => {
              return {
                id: v.loggedVisitId,
                start: v.start,
                end: v.end,
              };
            })
          )
        )
      );
      // ensure each graph visit is stored locally...
      const orphanNodes = fromGraph.map((edge) => {
        console.log('edge.id:', edge.id);
        const graphNodeInLocalStorage = localVisits.find(
          (v) => v.loggedVisitId === edge.id
        );
        return !graphNodeInLocalStorage ? edge.id : null;
      });
      // ...otherwise delete the graphed event
      if (orphanNodes) {
        console.log(warn(`deleting ${orphanNodes} orphaned graph events`));
        orphanNodes.forEach((id) => {
          this.deleteVisitNode(id);
        });
      } else {
        console.log(success('Your graph has only valid visits'));
      }
    },

    //#endregion Lab
    validateVisits(userID = this.$socket.client.auth.userID) {
      this.emitFromClient('getVisitedSpaces', userID, this.compareVisitData);
    },

    // sent by testCard.vue
    getVisitors() {
      // send message to server
      this.emitFromClient(
        'getVisitors',
        null,
        // and handle the callback
        (res) => {
          const { msg, results } = res;
          if (Array.isArray(results)) {
            console.log(success(`${msg}:`));
            results.forEach((element) => {
              console.log(printJson(element));
            });
          } else {
            console.log(success(`${msg}:`, results));
          }
          this.$emit('visitors', res);
        }
      );
    },

    getExposures(userID) {
      // send message to server
      this.emitFromClient(
        'getExposures',
        userID,
        // and handle the callback
        (res) => {
          const { msg, results } = res;
          if (Array.isArray(results)) {
            console.log(success(`${msg}:`));
            results.forEach((element) => {
              console.log(printJson(element));
            });
          } else {
            console.log(success(`${msg}:`, results));
          }
          this.$emit('exposures', res);
        }
      );
    },

    getVisitedSpaces(userID) {
      this.emitFromClient(
        'getVisitedSpaces',
        userID,
        // and handle the callback
        (res) => {
          const { msg, results } = res;
          if (Array.isArray(results)) {
            console.log(success(`${msg}:`));
            results.forEach((element) => {
              console.log(printJson(element));
            });
          } else {
            console.log(success(`${msg}:`, results));
          }
          this.$emit('spaces', res);
        }
      );
    },
  },
};
