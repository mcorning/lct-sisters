import { warn, printJson } from '@/utils/helpers';
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
    getRedisGraphs() {
      return this.emitFromClient('getGraphs', null, (graphs) =>
        console.log('graphs :>> ', graphs)
      );
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
      const getPlaceName = (placeID) => {
        console.log(placeID);
        const x = this.getPlaces().find((v) => v.placeID === placeID);
        return x.name;
      };

      // send message to server
      this.emitFromClient(
        'getExposures',
        { graphNames, userID },
        // and handle the callback
        ({ msg, exposures }) => {
          // insert the place names
          exposures.forEach((element) => {
            element.name = getPlaceName(element.placeID);
          });
          console.log('named exposures', exposures);
          this.$emit('exposures', { msg, exposures });
        }
      );
    },

    /** Called by Redis.vue when monitored visitor changes
     * getVisitTimes returns start and end for all used graphs
     * @param {*} userID - either current visitor or a userID selected from all Visitors
     */
    validateVisits(userID) {
      const graphNames = this.getGraphs();
      const vm = this;

      // Phase 2
      // callback for 'getVisitTimes' event
      function compareVisitData(fromGraph) {
        vm.log('Validating Visit Data:');
        vm.log(`    Dates from Graph(s):`);
        vm.log(printJson(fromGraph));
        const localVisits = vm.getVisits();
        vm.log(`    Dates from calendar:`);
        vm.log(printJson(localVisits));
        const userID = vm.$socket.client.auth.userID;

        function deleteAllNodes() {
          fromGraph.forEach((node) => {
            // call upon graph.js
            // but we only need two values from node
            vm.onDeleteNode(node.graphName, node.id);
          });
        }

        // first step
        function qualityCheck() {
          vm.log('Doing a quality control check on your visits:');
          return new Promise((resolve) => {
            // if no local visits, delete all nodes on graph
            if (!localVisits) {
              vm.log(
                '   No local visits. Ensuring there are no visits on graph(s).'
              );
              deleteAllNodes();
              // no need to process further
              resolve(false);
            } else {
              const missingNodesCt = localVisits.length !== fromGraph.length;
              if (missingNodesCt) {
                vm.log(
                  `   Graph is missing visit nodes. Deleting all graph nodes...`
                );
                // to be safe, first delete all nodes
                deleteAllNodes();

                // then add back fresh nodes from localVisits
                vm.log('    ...now adding all local visits to graph(s)');
                localVisits.forEach((visit) => {
                  vm.onLogVisit(visit);
                });
                // no need to process further
                vm.log('QC complete');
                resolve(false);
              }
              // we have no problem with visit/node counts
              // proceed to confirm dates
              resolve(true);
            }
          });
        }
        // second step
        function getDates(proceed) {
          if (proceed) {
            vm.log('Getting local visit dates for all graphs used');
            const dates = localVisits.map((v) => {
              return {
                graphName: v.graphName,
                id: v.loggedVisitId,
                start: v.start,
                end: v.end,
              };
            });
            return { userID, dates };
          }
        }

        //third step
        function confirmDates(dates) {
          if (dates) {
            vm.emitFromClient('confirmDates', dates, (result) => {
              const changed = result.filter((v) => v.propertiesSet > 0).length;
              const msg = changed
                ? `   Needed to fix ${changed} dates.`
                : '   All dates on graph were correct already.';
              vm.log(msg);
            });
          }
        }

        // now ensure that start/end diads are equal
        qualityCheck()
          .then((proceed) => getDates(proceed))
          .then((dates) => confirmDates(dates));
      }

      // Phase 1
      // get visitor's timestamps for each graph used
      this.emitFromClient(
        'getVisitTimes',
        { graphNames, userID },
        compareVisitData
      );
    },
    //#endregion functions called by Redis.vue onSelectionChanged
    log(diagnostic) {
      this.diagnostics.push(diagnostic);
    },
  },
};
