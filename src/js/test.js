import { success, printJson } from '@/utils/helpers';
export const testMixin = {
  name: 'testFunctions',

  methods: {
    // sent by testCard.vue
    testGraph({ query, param }) {
      //  const query = 'MATCH p=()-[*]->() RETURN p';
      console.log(
        'Sending query [param] to graph:',
        query,
        '[',
        printJson(param),
        ']'
      );
      // send message to server
      this.emitFromClient(
        'testGraph',
        { query, param },
        // and handle the callback
        (res) => {
          const { msg, results } = res;
          console.log(success(`${msg}:`, results.join('\n')));
          this.$emit('updatedGraphTest', res);
        }
      );
    },
  },
};
