<template>
  <!-- to handle the snackbar visibility, we handle the FrameError.reset event -->
  <FrameError :capture="true" @error="showSnackbar" @reset="snackbar = false">
    <!-- NOTE: renderless properties, ironically, are available only to this template (not data, not methods) -->
    <div class="CaptureErrorSnackbar" slot-scope="{ reset }">
      <slot />
      <v-snackbar
        v-model="snackbar"
        :multi-line="multiLine"
        vertical
        :timeout="timeout"
      >
        <!--TODO refactor according to https://codesandbox.io/s/github/vuejs/vuejs.org/tree/master/src/v2/examples/vue-20-dynamic-components?file=/index.html:741-796 -->
        <v-btn-toggle rounded>
          <v-btn @click="value = message">
            Message
          </v-btn>
          <v-btn @click="value = info">
            Info
          </v-btn>
          <v-btn @click="value = stack">
            Stack
          </v-btn>
        </v-btn-toggle>
        <div>{{ value }}</div>
        <template v-slot:action="{ attrs }">
          <v-btn color="red" text v-bind="attrs" @click="reset">
            Reset
          </v-btn>
          <v-btn color="red" text v-bind="attrs" @click="snackbar = false">
            Close
          </v-btn>
        </template>
      </v-snackbar>
    </div>
  </FrameError>
</template>

<script>
import FrameError from './FrameError.vue';

export default {
  props: {
    reset: {
      type: Function,
    },
  },

  components: {
    FrameError,
  },

  computed: {
    message() {
      return this.data?.err.message;
    },
    stack() {
      return this.data?.err.stack;
    },
    info() {
      return this.data?.info || 'info not available';
    },
    vm() {
      return this.data?.vm || 'vm not available';
    },
  },

  data() {
    return {
      data: null,
      multiLine: true,
      snackbar: false, //note: if we use value instead of v-model, the snackbar appears before any errors
      timeout: -1,
      value: '',
    };
  },
  methods: {
    // we are passing in an object so we can destructure at will
    showSnackbar(data) {
      this.data = data;
      this.value = this.message;
      this.snackbar = true;
    },
  },
  watch: {
    value() {
      console.log(this.value);
    },
  },
};
</script>
