import Setting from '@/models/Setting';
import 'either-async';
import { firstOrNone } from '@/fp/utils';
import { getAlerts } from '@/utils/alerts';

export const warningMixin = {
  name: 'warningMixin',
  methods: {
    onExposureWarning(riskScore, ack) {
      const graphName = this.getPoi().namespace;
      if (!graphName) {
        this.$emit('error', 'No graphName provided');
        return;
      }
      if (!ack) {
        this.$emit('error', 'No ack function available');
        return;
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

    test(visits, alerts) {
      getAlerts(visits, alerts);
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
