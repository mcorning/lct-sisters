<template>
  <State @stateAvailable="onStateAvailable">
    <!-- Step 2: include all and only properties from State render() function... -->
    <div slot-scope="{ state, funcx, logVisit, isConnected }">
      <!-- Step 3: ...pass on all properties to slotted components -->
      <v-container>
        <pre>isConnected {{ isConnected }}</pre>

        <pre>funcx {{ funcx }}</pre>
        <pre>logVisit {{ logVisit }}</pre>
        <pre>State {{ state }}</pre>
      </v-container>
    </div>
  </State>
</template>

<script>
import State from '@/components/renderless/State.vue';

export default {
  name: 'Calendar',
  components: {
    State,
  },
  // mixins: [eventDialog],

  // TODO Remember this is the last step in wiring renderless components (see App.vue)
  // Step 4: take one or more properties exposed by State render() function
  // props: {
  //   test: Boolean,
  //   isConnected: Boolean,
  //   state: { type: Object, required: true },
  //   funcx: { type: Function, required: true },
  //   logVisit: { type: Function, required: true },
  //   graphName: String, // changes to graph come from App.js
  // },
  data() {
    return {
      ready: false,
    };
  },
  methods: {
    onStateAvailable(f) {
      console.log('onStateAvailable for all components');
      console.log(f({ action: 'test' }));
    },
  },
  watch: {
    ready() {
      console.log('stop');
    },
  },
  mounted() {
    this.ready = true;
  },
};
</script>
