<template>
  <v-dialog v-model="dialog" max-width="320px">
    <v-card flat class="overflow-hidden">
      <v-btn icon absolute top right text @click="$emit('endFeedback')"
        ><v-icon>close</v-icon>
      </v-btn>

      <v-card-title>Feedback</v-card-title>
      <v-card-subtitle>Help us make LCT better</v-card-subtitle>
      <v-card-text>
        <p>
          You can send the LCT devs email with issues, questions, or
          suggestions.
        </p>
        <p>
          If you use the thumbs up icon, you can send tell them you value their
          work.
        </p>
        <p>
          The rating bar sends its own email with the rating in the subject.
        </p>
      </v-card-text>
      <v-card-actions>
        <v-row align="center" dense>
          <v-col cols="1" class="text-center">
            <v-btn text @click="emailDev(true)">
              <v-icon color="primary" center> mdi-thumb-up </v-icon></v-btn
            ></v-col
          >
          <v-col cols="9" class="text-center">
            <v-btn @click="emailDev()" plain>
              <v-rating
                v-model="rating"
                background-color="primary lighten-2"
                color="primary"
              ></v-rating></v-btn
          ></v-col>
          <v-col cols="1" class="text-center">
            <v-btn text @click="emailDev(false)">
              <v-icon color="primary" center> mdi-thumb-down </v-icon></v-btn
            ></v-col
          >
        </v-row>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'ConfirmDlg',
  data() {
    return {
      rating: 0,
      devs: 'mcorning@soteriaInstitute.org',
      dialog: true,
    };
  },

  methods: {
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
  },
  mounted() {},
};
</script>
