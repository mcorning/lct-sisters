// import { highlight, success, printJson } from '@/utils/helpers';
import Visit from '@/models/Visit';
import '@/fp/monads/EitherAsync';
import { allOrNone, firstOrNone } from '@/fp/utils';

export const timeMixin = {
  name: 'timeMixin',
  methods: {
    updateloggedNodeId(data) {
      Visit.updateLoggedNodeId(data)
        .toEither()
        .cata({
          ok: (results) => {
            const msg = {
              logged: true,
              confirmationColor: 'success',
              confirmationMessage: `${results.visitId} logged to ${results.graphName} on node ${data.loggedNodeId}`,
            };
            this.$emit('updatedModel', msg);
          },
          error: (results) => {
            console.log(results, 'Issues in setupGeocoder()');
          },
        });
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
                console.log('updateVisit().cata:', v);
                this.$router.push({
                  name: 'Time',
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
