<template>
  <v-dialog
    v-model="dialog"
    :max-width="options.width"
    :style="{ zIndex: options.zIndex }"
    @keydown.enter="agree"
    @keydown.esc="cancel"
  >
    <v-card dark class="overflow-hidden">
      <v-row align="center" justify="space-around">
        <v-col class="text-center" cols="2">
          <span class="group pa-10 ">
            <v-icon color="yellow" x-large>{{ options.icon }}</v-icon>
          </span></v-col
        >
        <v-col cols="8 text-left pt-8">
          <h4 class="pt-2">{{ title }}</h4>
          <v-card-subtitle
            v-show="!!message"
            class="pa-4 "
            v-html="message"
          ></v-card-subtitle>
        </v-col>
      </v-row>

      <v-card-actions class="pt-3">
        <v-spacer></v-spacer>
        <template v-for="(btn, index) in options.buttons">
          <v-btn
            v-if="btn"
            :key="index"
            tile
            :color="btn.color"
            class="body-2 "
            :outlined="btn.outlined"
            @click.native="answer(btn.agree)"
          >
            {{ btn.label }}
          </v-btn>
        </template>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'modernDialog',

  computed: {},
  data() {
    return {
      dialog: false,
      resolve: null,
      reject: null,
      message: null,
      title: null,
      options: {
        color: 'grey',
        width: 450,
        zIndex: 200,
        noconfirm: false,
      },
    };
  },
  props: {
    customOptions: {
      type: Object,
    },
  },
  methods: {
    answer(agree) {
      console.log(agree);
      this.dialog = false;
      this.resolve(agree);
    },

    // options is an object with name-value pairs (as opposed to props)
    // NOTE: if the caller set a buttons array element to null
    // that element will not appear withe the remaining buttons
    open(title, message, options) {
      this.dialog = true;
      this.title = title;
      this.message = message;
      this.options = { ...this.options, ...options };

      return new Promise((resolve, reject) => {
        this.resolve = resolve;
        this.reject = reject;
      });
    },
    cancel() {
      this.resolve(0);
      this.dialog = false;
    },
    agree() {
      this.resolve(1);
      this.dialog = false;
    },
  },

  watch: {},

  mounted() {
    // window.addEventListener('keydown', this.handleKeydown);
    this.options = { ...this.options, ...this.customOptions };
  },
};
</script>
<style>
.group {
  display: flex;
  flex: 1;
  justify-content: space-around;
}
</style>
