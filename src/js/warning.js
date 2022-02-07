import Setting from '@/models/Setting';
import 'either-async';
import { firstOrNone } from '@/fp/utils';
import { printJson, info } from '@/utils/helpers';

export const warningMixin = {
  name: 'warningMixin',
  methods: {
    onExposureWarning(riskScore, ack) {
      const graphName = this.getPoi().namespace;
      if (!graphName) {
        throw Error('warning.js: onExposureWarning():>> No graphName provided');
      }
      if (!ack) {
        throw Error(
          'warning.js: onExposureWarning():>> No ack function available'
        );
      }

      this.emitFromClient(
        'exposureWarning',
        { graphName, riskScore },
        (results) => {
          if (results.message) {
            ack(results.message);
          } else if (results.error) {
            ack(results.error);
          }
        }
      );
    },

    incrementWarnings() {
      return Setting.incrementWarnings();
    },

    updateSetting(setting) {
      // TODO NOTE: For then() to work up here, Setting.update() must return the $create() Promise.
      Setting.update(setting)
        .toEither()
        .cata({
          ok: (v) =>
            firstOrNone(v).match({
              Some: (value) => {
                console.log(
                  info('Setting.update() results: ', printJson(value))
                );
                this.updateState(value);
              },
              None: () => console.log(`No Settings to update `),
            }),
          error: (err) => {
            // let global error handler take over so we see the error in the snackbar.
            const msg = `Setting.update() had issues: ${err.message}`;
            throw Error(msg);
          },
        });
    },
  },
};
