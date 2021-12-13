<template>
  <div>
    <v-snackbar
      v-model="x"
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
      <v-row align="center"
        ><v-col cols="2"
          ><v-icon large>{{ confirmationIcon }}</v-icon>
        </v-col>
        <v-col cols="10">
          <div
            v-if="confirmationTitle"
            class="grey--text text--lighten-1 text-subtitle-1 mb-2"
          >
            {{ confirmationTitle }}
          </div>
          <div
            class="grey--text text--lighten-1 text-body-2 mb-4"
            v-html="confirmationMessage"
          ></div>
          <v-card-actions>
            <v-btn absolute bottom left color="error" text @click="disapprove">
              Close
            </v-btn>
            <v-btn
              v-if="canApprove"
              absolute
              bottom
              right
              color="success"
              text
              @click="approve"
            >
              ok
            </v-btn>
          </v-card-actions>
        </v-col>
      </v-row>
    </v-snackbar>
  </div>
</template>

<script>
export default {
  name: 'ConfirmationSnackbar',
  props: {
    confirmationTitle: String,
    confirmationMessage: String,
    confirmationIcon: String,
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
    canApprove: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return { x: true };
  },
  methods: {
    approve() {
      this.$emit('approved');
    },
    disapprove() {
      this.$emit('disapprove');
    },
  },
  watch: {},
  mounted() {
    console.log('Snackbar mounted');
  },
};
</script>

<style lang="scss" scoped></style>
