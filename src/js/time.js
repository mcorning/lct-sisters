// import { highlight, success, printJson } from '@/utils/helpers';
import Visit from '@/models/Visit';
export const timeMixin = {
  name: 'timeMixin',
  methods: {
    updateloggedNodeId(data) {
      Visit.updateById(data);
      const msg = {
        logged: true,
        confirmationColor: 'success',
        confirmationMessage: `${name} logged to ${data.useGraphName} on node ${data.loggedNodeId}`,
      };
      this.$emit('updatedModel', msg);
    },

    updateVisit(visit) {
      // TODO NOTE: For then() to work up here, Visit.update() must return the $create() Promise.
      Visit.update(visit).then((visits) => {
        this.updateState(visits);
        this.$router.push({
          name: 'Time',
        });
      });
    },
  },
};
