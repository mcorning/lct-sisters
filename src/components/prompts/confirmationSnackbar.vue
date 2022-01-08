<template>
  <div>
    <v-snackbar
      v-model="showSnackbar"
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
          ><v-icon x-large>{{ icon }}</v-icon>
        </v-col>
        <v-col cols="10">
          <v-card-title
            v-if="confirmationTitle"
            class="grey--text text--lighten-1 mb-2"
          >
            {{ confirmationTitle }}
          </v-card-title>
          <v-card-subtitle
            v-if="confirmationSubtitle"
            class="grey--text text--lighten-1 mb-2"
          >
            {{ confirmationSubtitle }}
          </v-card-subtitle>
          <v-card-text
            class="grey--text text--lighten-1 text-body-2 mb-4"
            v-html="confirmationMessage"
          ></v-card-text>
          <v-card-actions>
            <v-btn absolute bottom left color="error" text @click="disapprove">
              {{ disapproveString }}
            </v-btn>
            <v-btn
              v-if="approveString"
              absolute
              bottom
              right
              color="success"
              text
              @click="approve"
            >
              {{ approveString }}
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
    
    confirmationSubtitle: {
      type: String,
      default: '',
    },
    confirmationIcon: {
      type: String,
      default: '',
    },
    approveString: {
      type: String,
      default: '',
    },
    disapproveString: {
      type: String,
      default: 'Close',
    },
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
  computed: {
    icon() {
      return this.confirmationIcon || this.$parent.confirmationIcon;
    },
  },
  data() {
    return { showSnackbar: false };
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
    this.showSnackbar = true;
    console.log('Snackbar mounted');
  },
};
</script>

<style lang="scss" scoped></style>
