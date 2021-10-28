import { success, warn, printJson } from '@/utils/helpers';
import { nullable } from 'pratica';

/**
 *
 */
export const redisMixin = {
  name: 'redisMonitor',

  methods: {
    /**
     *
     * @returns all graphNames Visitor used in their events
     */
    getGraphs() {
      // Each visit can have its own graphName
      return nullable(this.getVisits().map((v) => v.graphName)).cata({
        Just: (names) => [...new Set(names)],
        Nothing: () => console.log(warn(`No visits`)),
      });
    },

    /** Called by Redis.vue
     * @returns userID for all visitors' in a (set of) given graph(s)
     */
    getVisitors() {
      const graphNames = this.getGraphs();
      // send message to server
      this.emitFromClient(
        'getVisitors',
        graphNames,
        // and pass results on to the callback in Monitor.vue
        ({ msg, visitors }) => {
          this.$emit('visitors', { msg, visitors });
        }
      );
    },

    //#region functions called by Redis.vue onSelectionChanged
    getExposures(userID) {
      const graphNames = this.getGraphs();
      if (!graphNames) {
        return;
      }
      // send message to server
      this.emitFromClient(
        'getExposures',
        { graphNames, userID },
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

    /** Called by Redis.vue when monitored visitor changes
     * getVisitTimes returns start and end for all used graphs
     * @param {*} userID - either current visitor or a userID selected from all Visitors
     */
    validateVisits(userID = this.$socket.client.auth.userID) {
      const graphNames = this.getGraphs();
      const vm = this;

      function compareVisitData(fromGraph) {
        console.log('Validating Visit Data');
        console.log(warn('fromGraph:', printJson(fromGraph)));
        const localVisits = vm.getVisits();
        const userID = vm.$socket.client.auth.userID;

        function deleteAllNodes() {
          fromGraph.forEach((node) => {
            // call upon graph.js
            vm.onDeleteNode(node);
          });
        }

        function getDates(proceed) {
          if (proceed) {
            const dates = localVisits.map((v) => {
              return { id: v.loggedVisitId, start: v.start, end: v.end };
            });
            return { userID, dates };
          }
        }

        function qualityCheck() {
          return new Promise((resolve) => {
            // if no local visits, delete all nodes on graph
            if (!localVisits) {
              deleteAllNodes();
              resolve(false);
            } else {
              const missingNodesCt = localVisits.length !== fromGraph.length;
              if (missingNodesCt) {
                console.log(`Graph is missing ${missingNodesCt} visit nodes`);
                // to be safe, first delete all nodes
                deleteAllNodes();

                // then add back fresh nodes from localVisits
                localVisits.forEach((visit) => {
                  vm.onLogVisit(visit);
                });
                resolve(false);
              }
              // proceed to confirm dates
              resolve(true);
            }
          });
        }

        function confirmDates(dates) {
          vm.emitFromClient('confirmDates', dates, (result) =>
            console.log(printJson(result))
          );
        }

        // now ensure that start/end diads are equal
        qualityCheck()
          .then((proceed) => getDates(proceed))
          .then((dates) => confirmDates(dates));
      }

      this.emitFromClient(
        'getVisitTimes',
        { graphNames, userID },
        compareVisitData
      );
    },
    //#endregion functions called by Redis.vue onSelectionChanged
  },
};
