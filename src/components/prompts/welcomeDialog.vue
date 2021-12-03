<template>
  <v-dialog v-model="dialog" max-width="333">
    <v-card>
      <v-card-title class="text-subtitle-1 wrapMe">
        Welcome to the COVID Early Warning System
      </v-card-title>

      <v-card-text>
        To get started, we need to know where to start, literally. Enter the
        name of your City and State or Country in the Search box above.
      </v-card-text>
      <v-card-title>Terms and Conditions</v-card-title>
      <v-card-text
        >Care for your neighbor. Use LCT wherever you go. If you know (or
        suspect) you have contracted Covid, press the Big Red Button.
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>

        <v-btn color="green darken-1" text @click="dialog = false">
          Disagree
        </v-btn>

        <v-btn color="green darken-1" text @click="proceed">
          Agree
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'welcomeDialog',
  props: {
    namespace: {
      type: String,
      default: '',
    },
    getNamespace: Function,
    setNamespace: Function,
  },
  data() {
    return {
      dialog: false,
      nsp: this.namespace,
    };
  },
  methods: {
    proceed() {
      this.dialog = false;
      this.setNamespace(this.nsp);
    },
  },
  watch: {},
  mounted() {
    console.log('namespace', this.namespace);

    const nsp = this.getNamespace();
    console.log('namespace', nsp);
    this.dialog = !nsp;
  },
};
</script>

<style lang="scss" scoped>
.wrapMe {
  overflow-x: auto;
  white-space: pre-wrap;
  white-space: -moz-pre-wrap;
  white-space: -pre-wrap;
  white-space: -o-pre-wrap;
  word-wrap: break-word;
}
</style>
