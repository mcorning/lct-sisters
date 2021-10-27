import { success, warn, printJson } from '@/utils/helpers';
import { nullable } from 'pratica';

export const redisMixin = {
  name: 'redisMonitor',

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

    deleteVisitNode(node) {
      const query = {
        loggedVisitId: node.id, // use the same name as the delete query does on RedisGraph
        graphName: node.graphName,
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

    /**
     * Synchronize local storage with Redisgraph
     * Redisgraph will be invalid if, while offline, we remove one, more, or all events
     * @param {*} fromGraph
     * nodes from Redis graph
     */
    compareVisitData(fromGraph) {
      console.log('Validating Visit Data');
      console.log(warn('fromGraph:', printJson(fromGraph)));
      const localVisits = this.getVisits();

      // if no local visits, delete all nodes on graph
      if (!localVisits) {
        fromGraph.forEach((node) => {
          this.deleteVisitNode(node);
        });
        return;
      }
      // else ensure each graph visit is found in localstorage...
      const orphanNodes = fromGraph.reduce((a, c) => {
        console.log('graph edge.id:', c.id);
        const deletGraphNode =
          localVisits.find((v) => v.loggedVisitId === c.id) ?? true;
        console.log('deletGraphNode', deletGraphNode);
        console.log('a', a);
        if (deletGraphNode) {
          a.push(c);
        }
        return a;
      }, []);

      // ...otherwise delete the graphed event
      if (orphanNodes) {
        console.log(
          warn(`deleting ${orphanNodes.length ?? 0} orphaned graph events`)
        );
        orphanNodes.forEach((node) => {
          this.deleteVisitNode(node);
        });
      } else {
        console.log(success('Your graph has only valid visits'));
      }

      // now ensure that start/end diads are equal
      const userID = this.$socket.client.auth.userID;
      const dates = localVisits.map((v) => {
        return { id: v.loggedVisitId, start: v.start, end: v.end };
      });
      const data = { userID, dates };
      this.emitFromClient('confirmDates', data, (result) =>
        console.log(result)
      );
    },

    /**
     * Called by Redis.vue when monitored visitor changes
     * getVisitTimes returns start and end for all used graphs
     */
    validateVisits(userID = this.$socket.client.auth.userID) {
      const graphNames = this.getGraphs();
      this.emitFromClient(
        'getVisitTimes',
        { graphNames, userID },
        this.compareVisitData
      );
    },
    //#endregion Lab

    getGraphs() {
      // visits can have more than one graphName
      return nullable(this.getVisits().map((v) => v.graphName)).cata({
        Just: (names) => names,
        Nothing: () => console.log(warn(`No visits`)),
      });
    },
    // sent by testCard.vue to get userID for all visitors' in a (set of) given graph(s)
    getVisitors() {
      const send = (graphNames) =>
        // send message to server
        this.emitFromClient(
          'getVisitors',
          graphNames,
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

      nullable(this.getVisits().map((v) => v.graphName)).cata({
        Just: (graphNames) => send(graphNames),
        Nothing: () => console.log(warn(`No visits`)),
      });
    },

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

    getVisitTimes(userID) {
      this.emitFromClient(
        'getVisitTimes',
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
