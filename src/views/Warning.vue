<template>
  <Model @error="onError">
    <div
      slot-scope="{
        isConnected,
        hasVisits,
        visitCount,
        hasUnloggedVisits,
        logVisits,
      }"
    >
      <v-sheet class="overflow-auto fill-height">
        <!-- unlogged Visits -->
        <v-snackbar :value="!hasUnloggedVisits && snackbar"
          >No unlogged visits
          <template v-slot:action="{ attrs }">
            <v-btn color="red" text v-bind="attrs" @click="snackbar = false">
              Close
            </v-btn>
          </template>
        </v-snackbar>
        <v-dialog
          :value="hasUnloggedVisits && dialog"
          persistent
          min-width="320"
          max-width="400"
        >
          <v-card dark>
            <v-card-title>Loged Visits Status</v-card-title>
            <v-card-subtitle
              >You have {{ hasUnloggedVisits }} visits to log to the
              server</v-card-subtitle
            >
            <v-card-text>
              You have missed any <strong>LCT Exposure Alerts</strong> sent by
              visitors to your unlogged public places. However, if you log these
              visits now, anbody who shared space with you will get your alerts.
            </v-card-text>
            <v-card-actions>
              <v-btn @click="logVisits">Yes</v-btn>
              <v-btn @click="dialog = false">No</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
        <!-- End unlogged Visits -->

        <!-- " -->
        <v-card
          v-if="hasVisits && (isConnected || isDebugging)"
          color="secondary"
          class="white--text"
        >
          <v-card-title class="headline">Exposure Warnings</v-card-title>
          <v-card-subtitle class="white--text"
            >Dated: {{ dated }}</v-card-subtitle
          >
          <v-card-text class="white--text pb-1">
            {{ visitCount == 1 ? 'Public place' : 'Public places' }}
            warned: {{ visitCount }}</v-card-text
          >

          <v-divider />
          <v-row no-gutters>
            <v-col>
              <v-menu
                ref="menu"
                v-model="menu"
                :close-on-content-click="false"
                :return-value.sync="lastVaccinationDate"
                transition="scale-transition"
                offset-y
                max-width="290px"
                min-width="290px"
              >
                <template v-slot:activator="{ on, attrs }">
                  <v-text-field
                    :value="lastVaccinationDate | monthYear"
                    label="Vaccinated "
                    prepend-icon="event"
                    readonly
                    clearable
                    v-bind="attrs"
                    v-on="on"
                    @click:clear="deleteDate"
                  ></v-text-field>
                </template>
                <v-date-picker
                  v-model="lastVaccinationDate"
                  type="month"
                  no-title
                  scrollable
                >
                  <v-spacer></v-spacer>
                  <v-btn text color="primary" @click="menu = false"
                    >Cancel</v-btn
                  >
                  <v-btn
                    text
                    color="primary"
                    @click="$refs.menu.save(lastVaccinationDate)"
                    >OK</v-btn
                  >
                </v-date-picker>
              </v-menu></v-col
            >
            <v-col cols="auto">
              <v-checkbox
                v-model="wearsMask"
                color="deep-purple accent-4"
                label="Masks"
                hide-details="auto"
              ></v-checkbox
            ></v-col>
            <v-col>
              <v-menu
                ref="menu2"
                v-model="menu2"
                :close-on-content-click="false"
                :return-value.sync="lastFluShot"
                transition="scale-transition"
                offset-y
                max-width="290px"
                min-width="290px"
              >
                <template v-slot:activator="{ on, attrs }">
                  <v-text-field
                    :value="lastFluShot | monthYear"
                    label="Last flu shot "
                    prepend-icon="event"
                    readonly
                    clearable
                    v-bind="attrs"
                    v-on="on"
                  ></v-text-field>
                </template>
                <v-date-picker
                  v-model="lastFluShot"
                  type="month"
                  no-title
                  scrollable
                >
                  <v-spacer></v-spacer>
                  <v-btn text color="primary" @click="menu2 = false"
                    >Cancel</v-btn
                  >
                  <v-btn
                    text
                    color="primary"
                    @click="$refs.menu2.save(lastFluShot)"
                    >OK</v-btn
                  >
                </v-date-picker>
              </v-menu></v-col
            >
          </v-row>
          <v-row no-gutters>
            <v-col>
              <v-row no-gutters>
                <v-col>
                  <v-card-text class="pb-1">
                    Select one or more reasons for this warning:
                  </v-card-text>
                  <v-list shaped>
                    <v-list-item-group v-model="model" multiple mandatory>
                      <template v-for="(option, i) in WarningOptions">
                        <v-divider
                          v-if="!option"
                          :key="`divider-${i}`"
                        ></v-divider>

                        <v-list-item
                          v-else
                          :key="`option-${i}`"
                          :value="option"
                          active-class="deep-purple--text text--accent-4"
                        >
                          <template v-slot:default="{ active }">
                            <v-list-item-icon>
                              <v-icon v-text="option.icon"></v-icon>
                            </v-list-item-icon>
                            <v-list-item-content>
                              <v-list-item-title
                                v-text="option.text"
                              ></v-list-item-title>
                            </v-list-item-content>

                            <v-list-item-action>
                              <v-checkbox
                                :input-value="active"
                                color="deep-purple accent-4"
                              ></v-checkbox>
                            </v-list-item-action>
                          </template>
                        </v-list-item>
                      </template>
                    </v-list-item-group>
                  </v-list>
                </v-col>
              </v-row>
            </v-col>
            <v-col>
              <v-row>
                <v-col>
                  <v-card-text
                    class="mt-5"
                    v-html="message"
                  ></v-card-text> </v-col
              ></v-row>
              <v-row>
                <v-col>
                  <v-card-text class="white--text"
                    >Warning weight: <strong>{{ score }}</strong> dBs
                    <v-progress-linear
                      v-model="pctWeight"
                      :color="getWarningColor"
                      height="25"
                    >
                      <strong>{{ pctWeight }}%</strong>
                    </v-progress-linear></v-card-text
                  >
                </v-col>
              </v-row>
            </v-col>
          </v-row>

          <v-divider />
          <v-card-title class="justify-end pb-0 pt-1"
            >Send warning?</v-card-title
          >

          <v-card-actions>
            <v-spacer />
            <v-btn color="red darken-2" text @click="warnThem">Yes</v-btn>
            <v-btn color="green darken-2" text @click="returnToSpaces"
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
    getWarningColor() {
      if (this.pctWeight < 25) return 'amber';
      if (this.pctWeight < 75) return 'orange';
      return 'red';
    },

    pctWeight() {
      return (this.weight / this.totalWeight) * 100;
    },

    totalWeight() {
      return this.WarningOptions.reduce((a, c) => {
        return a + c.weight;
      }, 0);
    },

    weight() {
      return this.model.reduce((a, c) => {
        return a + c.weight;
      }, 0);
    },

    dated() {
      return formatTime();
    },
    score() {
      console.log(this.weight, this.epsilon);
      return this.weight + this.epsilon;
    },

    message() {
      // from 2, 3, 6, 10 (plus 1 for vaccination) we derive these scenarios:
      let msg;
      switch (this.score) {
        case 2:
          msg = `If you received and LCT exposure alert, you SHOULD get tested immediately. If you are positive, hit the Warn button and take care of yourself.`;
          break;
        case 3:
          msg = `If you were near someone who tested positive AND you received an LCT Exposure Alert, you really MUST get tested, and act accordingly.`;
          break;
        case 4:
          msg = `Since you are vaccinated, you may not need to warn others that you have been close to a carrier, especially if you wear a mask.`;
          break;
        case 5:
          msg = `Being near someone who tested positive for COVID is weak evidence that you are carrying the virus now, too. `;
          break;
        case 6:
        case 7:
          msg = `Showing COVID symptoms is strong evidence of infection, ${
            this.lastFluShot
              ? 'especially since your recent flu shot'
              : 'unless the same symptoms come from a different disease like the flu'
          }.`;
          break;
        case 8:
          msg = `Since you show symptoms AND you see an alert, you may be in a vulnerable community. <br/>You can send an alert now, then get tested; or you can wait for your test results to ensure your symptoms are from COVID (and not the flu) before warning others of exposure.`;
          break;
        case 9: // either 3+6 or 2+6+1
          msg = `${
            this.lastVaccinationDate
              ? 'You are vaccinated, but it looks like you live in an active COVID zone. Get tested to ensure you are a breakthrough case, and warn others if true'
              : "Testing positive after contact with a carrier is a reliable signal of exposure (inspite of the test's non-zero False Positive rate)"
          }.`;
          break;
        case 10:
          msg = `Testing positive is the most reliable signal of exposure (given the test's non-zero False Positive rate).`;
          break;
        case 11:
          msg = `You tested positive after your vaccination. Because you have a breakthrough infection, you SHOULD hit the <strong>Warn</strong> button as an symptomatic carrier. Wear a mask at all times.`;
          break;
        case 12:
          msg = `If you tested positive AND received an LCT Exposure Alert, you may be vulnerable to high community spread. Thank you for warning others of this likelyhood.`;
          break;
        case 13:
          msg = `If you tested positive AND you think you got the virus from somebody else, you you have evidence of community spread. Thank you for warning others of this likelyhood.`;
          break;
        case 14:
          msg = `You tested positive AND you think you got the virus from somebody else. <br/>${
            this.wearsMask
              ? 'You MUST keep wearing your mask. To be safe, '
              : 'You are asymptomatic, so wear a mask. In the meantime,'
          } you SHOULD alert others of exposure.`;
          break;
        case 15:
          msg = `You have almost checked all the boxes. Since you are not showing symptoms, yourself,  ${
            this.lastVaccinationDate
              ? 'you may be an asymptomatic carrier -- espcially since you are vaccinated.'
              : 'you may be an asymptomatic carrier.'
          }`;
          break;
        case 16:
          msg = `You are more likely to have COVID if you test positive AND show symptoms. <br/>${
            this.lastFluShot
              ? 'Since you had a flu shot recently, your symptoms are less likely from the flu and more likely from COVID'
              : 'However, without a recent flu shot, your symptoms might not be due to COVID (especially if the COVID test had a high False Positive rate)'
          }.`;
          break;
        case 17:
          msg = `${
            this.wearsMask ? 'Inspite of wearing a mask, you' : 'You'
          } are an at-risk <strong>breakthrough</strong> case. You MUST warn others of exposure. Then take care of yourself.`;
          break;
        case 18:
        case 19:
          msg = `Not only are you highly like to have infected others (some of who infected you), you are evidence of high community spread (especially if you also receive more exposure alerts yourself).`;
          break;
        case 21:
          msg = `${
            this.wearsMask ? 'Inspite of wearing a mask, you' : 'You'
          } are in the middle of the pandemic of the unvaccinated. It's not too late. <br/>You MUST warn others of exposure. Then take care of yourself.`;
          break;
        case 22:
          msg = `${
            this.wearsMask ? 'Inspite of wearing a mask, you' : 'You'
          } are an at-risk <strong>breakthrough</strong> case. Evidence suggests you are in an area with a high rate of community spread.<br/>You MUST warn others of exposure. Then take care of yourself.`;
          break;
        default:
          msg = `You have checked all the boxes: Your exposure warning couldn't be more reliable. <br/> You MUST hit the <strong>Warn</strong> button, and then take care of yourself. ${
            this.lastVaccinationDate
              ? '<br/>As a <strong>breakthrough</strong> case, we hope your illness is mild and your recovery is quick.'
              : ''
          }`;
      }

      return msg;
    },
  },

  data() {
    return {
      // trick when using compound predicate for dialog (note we use :value not v-model when using compound predicates)
      dialog: true,
      snackbar: true,

      isDebugging: false,
      alignmentsItems: ['start', 'center', 'end', 'baseline', 'stretch'],
      alignment: 'center',
      dense: false,
      justifyItems: ['start', 'center', 'end', 'space-around', 'space-between'],
      justify: 'center',

      wearsMask: true,
      epsilon: 0,
      lastFluShot: null,
      lastVaccinationDate: null,
      menu: false,
      menu2: false,
      vaccinated: false,
      model: [],
      WarningOptions: [
        {
          icon: 'mdi-alert',
          text: 'I tested positive for COVID-19',
          weight: 10,
        },
        {
          icon: 'mdi-medical-bag',
          text: 'I present COVID symptoms',
          weight: 6,
        },
        {
          icon: 'mdi-account-group',
          text: 'I was near a COVID carrier',
          weight: 3,
        },

        {
          icon: 'mdi-account-alert',
          text: 'LCT warned me of exposure',
          weight: 2,
        },
      ],
    };
  },
  methods: {
    checkModel(hasUnloggedVisits) {
      this.dialog = hasUnloggedVisits;
      return hasUnloggedVisits;
    },

    deleteDate() {
      this.epsilon = 0;
    },

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

  filters: {
    monthYear: (val) => {
      if (val) {
        const parts = val.split('-');
        return `Month: ${parts[1]} Year: ${parts[0]}`;
      }
      return;
    },
  },

  watch: {
    lastVaccinationDate() {
      console.log(this.lastVaccinationDate);
      this.epsilon = this.lastVaccinationDate ? 1 : 0;
      console.log('score:', this.score);
    },
    score() {
      console.log('score:', this.score);
    },
  },

  mounted() {
    console.log('\tWarning.vue mounted');
  },
};
</script>

<style lang="scss" scoped></style>
