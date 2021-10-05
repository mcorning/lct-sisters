import { success, printJson } from '@/utils/helpers';
export const testMixin = {
  name: 'testFunctions',

  methods: {
    // sent by testCard.vue
    getVisitors() {
      // send message to server
      this.emitFromClient(
        'getVisitors',
        null,
        // and handle the callback
        (res) => {
          const { msg, results } = res;
          if (Array.isArray(results)) {
            console.log(success(`${msg}:`));
            results.forEach(element => {
              console.log(printJson(element));
            });
          } else {
            console.log(success(`${msg}:`, results));
          }
          this.$emit('visitors', res);
        }
      );
    },
  },
};