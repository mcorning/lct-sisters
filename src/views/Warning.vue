<template>
  <Model @error="onError">
    <div slot-scope="{ isConnected, state }">
      <v-sheet class="overflow-auto fill-height">
        <v-dialog v-model="dialog" persistent min-width="320" max-width="400">
        </v-dialog>

        <v-card
          v-if="state.visits.length && isConnected"
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
          </v-card-text>
          <v-divider class="mx-4"></v-divider>
          <v-card-title class="justify-end pb-0 pt-1"
            >Send warning?</v-card-title
          >

          <v-card-actions>
            <v-spacer />
            <v-checkbox v-model="vaccinated">I am fully vaccinated</v-checkbox>
            <v-btn color="warning lighten-2" text @click="warnThem">Yes</v-btn>
            <v-btn color="green lighten-2" text @click="returnToSpaces"
              >No</v-btn
            >
          </v-card-actions>
        </v-card>

        <v-card :color="getColor(isConnected)" v-else>
          <v-card-title class="headline">Exposure Warnings</v-card-title>
          <v-card-subtitle>
            Oops,
            {{
              isConnected
                ? 'there is nobody to warn'
                : 'you are not connected to the server'
            }}.</v-card-subtitle
          >
          <div v-if="isConnected">
            <v-card-text>
              Exposure warnings are based on visits logged to the server.
            </v-card-text>
            <v-card-text>
              Your browser has no record of any visits, yet. You will be able to
              warn your community after you:
              <ol>
                <li>pick a location on the map</li>
                <li>mark your calendar with a date and time</li>
                <li>and log your calendar event on the LCT server</li>
              </ol>
            </v-card-text>
            <v-card-text>
              The server will alert other visitors who shared a space with you.
              Otherwise, the server sends no alerts.
            </v-card-text>
          </div>
          <div v-else>
            <v-card-text
              >Get an internet connection, and try again, please.</v-card-text
            >
          </div>
          <v-card-actions>
            <v-spacer />
            <v-btn text @click="returnToSpaces">OK</v-btn>
          </v-card-actions>
        </v-card>
      </v-sheet>
    </div>
  </Model>
</template>

<script>
import Model from '@/components/renderless/Model.vue';

import { formatTime } from '../utils/luxonHelpers';

export default {
  name: 'Warning',

  components: {
    Model,
  },

  computed: {
    dated() {
      return formatTime();
    },
  },

  data() {
    return {
      vaccinated: false,
      dialog: false,
      model: 0,
      WarningOptions: [
        {
          icon: 'mdi-alert',
          text: 'I tested positive for COVID-19',
          weight: 9,
        },
        {
          icon: 'mdi-medical-bag',
          text: 'I present COVID symptoms',
          weight: 7,
        },
        {
          icon: 'mdi-account-group',
          text: 'I was near a COVID carrier',
          weight: 5,
        },

        {
          icon: 'mdi-account-alert',
          text: 'LCT warned me of exposure',
          weight: 4,
        },
      ],
    };
  },
  methods: {
    getColor(isconnected) {
      return isconnected ? 'yellow' : 'orange';
    },
    onError(error) {
      // let the global error handler pick up and display this error
      error.message = `Space.vue error message: ${error.message}`;
      throw error;
    },

    returnToSpaces() {
      this.$router.push({
        name: 'Space',
      });
    },

    warnThem() {
      this.dialog = true;
      const reason = this.WarningOptions[this.model].text;
      console.log(reason);
      this.$emit('exposureWarning', reason);
    },
  },
  created() {},
};
</script>

<style lang="scss" scoped></style>
