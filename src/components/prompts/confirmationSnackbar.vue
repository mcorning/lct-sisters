<template>
  <div>
    <v-snackbar
      v-model="snackbar"
      :timeout="timeout"
      :multi-line="multiLine"
      :dark="dark"
      :centered="centered"
      :top="top"
      :bottom="bottom"
      :left="left"
      :right="right"
      vertical
      color="blue-grey darken-3"
    >
      <div
        v-if="confirmationTitle"
        class="grey--text text--lighten-1 text-subtitle-1 mb-2"
      >
        {{ confirmationTitle }}
      </div>
      <div class="grey--text text--lighten-1 text-body-2 mb-4">
        {{ confirmationMessage }}
      </div>
      <template v-slot:action="{ attrs }">
        <v-btn color="error" text v-bind="attrs" @click="snackbar = false">
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script>
export default {
  name: 'ConfirmationSnackbar',
  props: {
    confirmationTitle: String,
    confirmationMessage: String,
    timeout: {
      type: Number,
      default: -1,
    },
    dark: {
      type: Boolean,
      default: false,
    },
    multiLine: {
      type: Boolean,
      default: true,
    },
    centered: {
      type: Boolean,
      default: false,
    },
    top: {
      type: Boolean,
      default: false,
    },
    bottom: {
      type: Boolean,
      default: false,
    },
    left: {
      type: Boolean,
      default: false,
    },
    right: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return { snackbar: true };
  },
  mounted() {
    console.log('Snackbar mounted');
  },
};
</script>

<style lang="scss" scoped></style>
