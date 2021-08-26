// import { highlight, success, printJson } from '@/utils/helpers';
import Setting from '@/models/Setting';
export const warningMixin = {
  name: 'warningMixin',
  methods: {
    updateSetting(setting) {
      // TODO NOTE: For then() to work up here, Visit.update() must return the $create() Promise.
      const results = Setting.update(setting);
      console.log('Setting.update() results: ', results);
      this.updateState(results);
    },
  },
};
