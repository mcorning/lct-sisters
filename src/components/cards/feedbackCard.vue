<template>
  <v-container>
    <!-- Add to Home Screen and PWA update 
        or general purpose-->
    <v-snackbar
      v-model="snackWithButtons"
      bottom
      right
      timeout="-1"
      height="100px"
    >
      {{ snackWithBtnText }}
      <template v-slot:action="{ attrs }">
        <v-btn text color="#00f500" v-bind="attrs" @click.stop="act">
          {{ snackBtnText }}
        </v-btn>
        <v-btn icon class="ml-4" @click="snackWithButtons = false">
          <v-icon>close</v-icon>
        </v-btn>
      </template>
    </v-snackbar>
    <!-- likert -->
    <v-dialog v-model="dialog" max-width="400px">
      <template v-slot:activator="{ on, attrs }">
        <v-btn color="primary" dark v-bind="attrs" v-on="on" block tile>
          <small>Feedback</small>
        </v-btn>
      </template>
      <v-card flat class="overflow-hidden">
        <v-card-title>Feedback</v-card-title>
        <v-card-subtitle>Help us make LCT better</v-card-subtitle>
        <v-card-text>
          You can send the LCT devs email with issues, questions, or
          suggestions.
          <br />
          If you use the thumbs up icon, you can send tell them you value their
          work.
          <br />
          The rating bar sends its own email with the rating in the subject.
        </v-card-text>
        <v-card-actions>
          <v-row align="center">
            <v-col cols="2">
              <v-btn text @click="emailDev(true)">
                <v-icon color="primary" left> mdi-thumb-up </v-icon></v-btn
              ></v-col
            >
            <v-col cols="7">
              <v-rating
                v-model="rating"
                background-color="primary lighten-2"
                color="primary"
                class="text-center"
              ></v-rating
            ></v-col>
            <v-col cols="2">
              <v-btn text @click="emailDev(false)">
                <v-icon color="primary" right> mdi-thumb-down </v-icon></v-btn
              ></v-col
            >
          </v-row>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
export default {
  name: 'ConfirmDlg',
  data() {
    return {
      snackBtnText: '',
      snackWithBtnText: '',
      snackWithButtons: false,
      action: '',
      devs: 'mcorning@soteriaInstitute.org',

      dialog: false,
      resolve: null,
      reject: null,
      message: null,
      title: null,
      options: {
        color: 'grey lighten-3',
        width: 400,
        zIndex: 200,
        noconfirm: false,
      },
    };
  },

  methods: {
    act() {
      if (this.action === 'refresh') {
        this.refreshApp();
      } else {
        this.add2HomeScreen();
      }
    },
    // footer method
    emailDev(good) {
      switch (good) {
        case true:
          this.$emit('userFeedback', 'BZ');
          window.location = `mailto:${this.devs}?subject=LCT user says, 'BZ'`;
          break;
        case false:
          this.$emit('userFeedback', 'Boo');
          window.location = `mailto:${this.devs}?subject=LCT user says, 'Boo'`;
          break;
        default:
          this.$emit('userFeedback', `${this.rating}-Stars`);
          window.location = `mailto:${this.devs}?subject=LCT gets ${this.rating}-Star feedback`;
      }
    },

    open(title, message, options) {
      this.dialog = true;
      this.title = title;
      this.message = message;
      this.options = Object.assign(this.options, options);
      return new Promise((resolve, reject) => {
        this.resolve = resolve;
        this.reject = reject;
      });
    },
    agree() {
      this.resolve(true);
      this.dialog = false;
    },
    cancel() {
      this.resolve(false);
      this.dialog = false;
    },

    handleKeydown(ev) {
      console.log('key/action', ev.code);

      switch (ev.code) {
        case 'KeyY':
        case 'Enter':
          this.dialog = false;

          return true;

        case 'KeyN':
        case 'Escape':
          this.dialog = false;

          return false;
      }
    },
  },
  mounted() {
    window.addEventListener('keydown', this.handleKeydown);
  },
};
</script>
