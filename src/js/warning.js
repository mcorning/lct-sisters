// import { highlight, success, printJson } from '@/utils/helpers';
import Setting from '@/models/Setting';
// import '@/fp/monads/EitherAsync';
import 'either-async';
import { firstOrNone } from '@/fp/utils';

export const warningMixin = {
  name: 'warningMixin',
  methods: {
    updateSetting(setting) {
      // TODO NOTE: For then() to work up here, Setting.update() must return the $create() Promise.
      Setting.update(setting)
        .toEither()
        .cata({
          ok: (v) =>
            firstOrNone(v).match({
              Some: (value) => {
                console.log('Setting.update() results: ', value);
                this.updateState(value);
              },
              None: () => console.log(`There is no Settings to update `),
            }),
          error: (err) => {
            // let global error handler take over so we see the error in the snackbar.
            err.message = +'Setting.update() had issues';
            throw err;
          },
        });
    },
  },
};
