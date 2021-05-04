<template>
  <v-sheet class="overflow-auto fill-height">
    <v-dialog v-model="dialog" persistent min-width="320">
      <v-card
        v-if="visits && visits.length"
        color="primary"
        class="white--text"
      >
        <v-card-title class="headline">Exposure Warnings</v-card-title>
        <v-card-subtitle class="white--text"
          >Dated: {{ dated }}</v-card-subtitle
        >
        <v-card-subtitle class="white--text pb-1"
          >You will warn {{ visits.length }}
          {{ visits.length == 1 ? 'Room' : 'Rooms' }}</v-card-subtitle
        >
        <v-card-text min-width="320" class="px-0">
          <!-- <v-card min-width="320"> -->
          <v-list>
            <v-list-item-group v-model="model" mandatory color="primary">
              <v-list-item v-for="(option, i) in WarningOptions" :key="i">
                <v-list-item-icon>
                  <v-icon v-text="option.icon"></v-icon>
                </v-list-item-icon>

                <v-list-item-content>
                  <v-list-item-title v-text="option.text"></v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list-item-group>
          </v-list>
          <!-- </v-card> -->
        </v-card-text>
        <v-divider class="mx-4"></v-divider>
        <v-card-title class="justify-end pb-0 pt-1">Send warning?</v-card-title>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="warning lighten-2" text @click="warnThem()">Yes</v-btn>
          <v-btn color="green lighten-2" text @click="returnToSpaces">No</v-btn>
        </v-card-actions>
      </v-card>

      <v-card v-else>
        <v-card-title class="headline">Exposure Warnings</v-card-title>
        <v-card-subtitle> Oops, there is nobody to warn.</v-card-subtitle>
        ><v-card-text>
          1) Be sure you have selected the correct nickname </v-card-text
        ><v-card-text>
          2) Check your Visits (you need at least one Entered record before you
          can warn a Room)</v-card-text
        >
        <v-card-actions>
          <v-btn text @click="dialog = false">OK</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-sheet>
</template>

<script>
import Visit from '@/models/Visit';
import { success, error, printJson } from '../utils/colors';
import { formatTime } from '../utils/luxonHelpers';

export default {
  name: 'Warning',

  computed: {
    dated() {
      return formatTime();
    },

    visits() {
      const v = Visit.all();
      return v;
    },
  },

  data() {
    return {
      dialog: true,
      model: 1,
      WarningOptions: [
        {
          icon: 'mdi-alert',
          text: 'I tested positive for COVID-19',
        },
        {
          icon: 'mdi-account-alert',
          text: 'LCT warned me of exposure',
        },
        {
          icon: 'mdi-account-group',
          text: 'I was near a COVID carrier',
        },
        {
          icon: 'mdi-medical-bag',
          text: 'I present COVID symptoms',
        },
        {
          icon: 'mdi-arm-flex',
          text: 'This is an LCT Drill...',
        },
      ],
    };
  },
  methods: {
    returnToSpaces() {
      this.$emit('returnToSpaces');
    },

    warnThem() {
      this.dialog = false;
      const reason = this.WarningOptions[this.model].text;
      console.log(reason);
      this.$emit('exposureWarning', reason);
    },
  },
  created() {
    Visit.$fetch()
      .then((all) => {
        console.log(all);
        // this.show = this.SPACES;
        this.overlay = false;
        console.log(success('Visits'), printJson(this.visits));
      })
      .catch((e) => console.log(error(`Error in roomCard: ${e}`)));
  },
};
</script>

<style lang="scss" scoped></style>
