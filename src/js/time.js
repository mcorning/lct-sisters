// import { highlight, success, printJson } from '@/utils/helpers';
import Visit from '@/models/Visit';

// import '@/fp/monads/EitherAsync';
import 'either-async';

import { allOrNone, firstOrNone } from '@/fp/utils';

export const timeMixin = {
  name: 'timeMixin',
  methods: {
    // TODO isn't the only diff between update and updateById is that the latter includes a value for the ID prop
    // called by RedisGraph callback
    updateLoggedVisitId({ visitId, place, graphName, id, logged }) {
      // console.log('redisResult', redisResult);
      // const { id, place, logged } = redisResult;

      // this is the Promisified/EitherAsync version with a single resolve() condition and two reject() opportunities
      if (!logged || id < 0) {
        alert(`Redis could not log Visit to  ${place}`);
        return;
      }

      // const { graphName, visitId } = redisResult;
      const data = {
        visitId,
        loggedVisitId: id,
        graphName,
        color: 'primary', // use parameter if we need a different color for Sandbox graph
      };
      console.log('updateVisitOnGraph() data:', data);

      // this is the original EitherAsync used by the pre refactored Model.visitLogged()
      Visit.updateLoggedVisitId(data)
        .toEither()
        .cata({
          ok: console.log,
          error: (results) =>
            console.log(
              'error updating Visit entity',
              JSON.stringify({
                results,
                isConnected: this.isConnected,
              })
            ),
        });
    },

    updateLoggedVisitIdOld({ redisResult, resolve, reject }) {
      console.log('redisResult', redisResult);
      const { id, place, logged } = redisResult;

      // this is the Promisified/EitherAsync version with a single resolve() condition and two reject() opportunities
      if (!logged || id < 0) {
        reject(`Redis could not log Visit to  ${place}`);
      }
      const { graphName, visitId } = redisResult;
      const data = {
        visitId: visitId,
        loggedVisitId: id,
        graphName,
        color: 'primary', // use parameter if we need a different color for Sandbox graph
      };
      console.log('updateVisitOnGraph() data:', data);

      // this is the original EitherAsync used by the pre refactored Model.visitLogged()
      Visit.updateLoggedVisitId(data)
        .toEither()
        .cata({
          ok: (results) => resolve(results),
          error: (results) =>
            reject({
              results,
              isConnected: this.isConnected,
            }),
        });
    },

    deleteVisit(id) {
      return Visit.delete(id);
    },

    updateVisit(visit) {
      // TODO NOTE: For then() to work up here, Visit.update() must return the $create() Promise.
      Visit.update(visit)
        .toEither()
        .map((visits) =>
          allOrNone(visits).match({
            Some: (value) => {
              console.log(JSON.stringify(value, null, 3));
              return value;
            },
            None: () => console.log(`There is no visit to update `),
          })
        )
        .cata({
          ok: (v) =>
            firstOrNone(v).match({
              Some: (v) => {
                console.log('updateVisit().cata:');
                const query = { ...v };
                console.log(query);
                this.$router.push({
                  name: 'Time',
                  params: query,
                });
              },
              None: () => console.log(`NOOP`),
            }),
          error: (err) => {
            // let global error handler take over so we see the error in the snackbar.
            err.message += 'Visit.update() had issues';
            throw err;
          },
        });
    },
  },
};
