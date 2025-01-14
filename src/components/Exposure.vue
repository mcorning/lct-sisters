<template>
  <v-sheet class="overflow-auto fill-height">
    <v-container
      fluid
      class="fill-height"
      :class="checkEmergency"
      v-if="hasVisits && (isConnected || isDebugging)"
    >
      <v-card color="secondary" class="white--text mx-auto my-12">
        <v-row align="center"
          ><v-col>
            <v-card-title class="headline">Exposure Warnings</v-card-title>
            <v-card-subtitle class="white--text"
              >Dated: {{ dated }}</v-card-subtitle
            ></v-col
          >

          <v-col cols="2">
            <v-btn color="primary" icon @click="open('Monitor')">
              <v-icon>mdi-monitor-dashboard</v-icon>
            </v-btn>
            <v-btn icon @click="openDiagnostics = true"
              ><v-icon>history</v-icon></v-btn
            >
          </v-col>
        </v-row>
        <v-divider />
        <v-card-text class="my-0 pt-1">
          <v-row no-gutters align="center" justify="center">
            <v-col cols="auto">
              <v-card-text class="pb-1">
                Select one or more reasons for this warning:
              </v-card-text>
              <v-list shaped dense>
                <v-list-item-group v-model="warnings" multiple mandatory>
                  <template v-for="(option, i) in WarningOptions">
                    <v-divider
                      v-if="!option.text"
                      :key="`divider-${i}`"
                    ></v-divider>

                    <v-list-item
                      v-else
                      :key="`option-${i}`"
                      :value="option"
                      active-class="deep-purple--text text--accent-4"
                    >
                      <v-list-item-icon>
                        <v-icon v-text="option.icon"></v-icon>
                      </v-list-item-icon>
                      <v-list-item-content>
                        <v-list-item-title
                          v-text="option.text"
                        ></v-list-item-title>
                      </v-list-item-content>
                    </v-list-item>
                  </template>
                </v-list-item-group>
              </v-list>
            </v-col>
          </v-row>
          <v-row no-gutters
            ><v-col>
              <span
                >Warning weight: <strong>{{ score }}</strong> dBs</span
              >
              <v-progress-linear
                v-model="pctWeight"
                :color="getWarningColor"
                height="25"
                >Relative Risk: &nbsp;
                <strong>{{ pctWeightString }}</strong>
              </v-progress-linear>
            </v-col></v-row
          >
          <v-row no-gutters>
            <v-col cols="4">
              <v-select
                v-model="vaccinationStatus"
                :items="numberOfShots"
                label="Doses:"
              >
              </v-select>
            </v-col>
            <v-col sm="4">
              <v-checkbox
                v-model="wearsMask"
                color="deep-purple accent-4"
                label="Wears Mask?"
                hide-details="auto"
              ></v-checkbox
            ></v-col>
            <v-col sm="4">
              <v-checkbox
                v-model="recentFluShot"
                color="deep-purple accent-4"
                label="Recent FluShot?"
                hide-details="auto"
              ></v-checkbox
            ></v-col>
          </v-row>
          <v-row no-gutters
            ><v-col
              ><v-card-text
                class="my-0 py-0"
                v-html="message"
              ></v-card-text> </v-col
          ></v-row>
        </v-card-text>
        <v-divider />
        <v-sheet color="primary">
          <v-card-actions class="pt-0">
            <v-row no-gutters
              ><v-col
                ><v-card-title
                  ><span class="white--text">Send</span></v-card-title
                ></v-col
              >
            </v-row>
            <v-row>
              <v-col>
                <v-btn color="green lighten-2" text @click="warnThem(true)"
                  >A DRILL</v-btn
                >
                <v-spacer />
                <v-btn color="orange lighten-1" text @click="warnThem()"
                  >A Warning</v-btn
                >
                <v-spacer />
                <v-btn color="grey" text @click="returnToSpaces"
                  >Nothing</v-btn
                ></v-col
              >
            </v-row>
          </v-card-actions>
        </v-sheet>
      </v-card>
    </v-container>
    <v-card v-else :color="getColor(isConnected)">
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
    <v-sheet v-if="openDiagnostics" no-gutters>
      <v-card flat>
        <v-btn
          color="primary"
          absolute
          top
          right
          icon
          @click="openDiagnostics = false"
          ><v-icon>close</v-icon></v-btn
        >
        <v-btn plain text @click="emailDiagnostics" large class="mt-3"
          >Diagnostics</v-btn
        >
        <v-card-text>
          <pre>{{ diagnostics }}</pre>
        </v-card-text>
      </v-card>
    </v-sheet>
    <confirmation-snackbar
      v-if="confSnackbar"
      :centered="true"
      :top="true"
      :confirmationTitle="confirmationTitle"
      :confirmationMessage="confirmationMessage"
      :confirmationIcon="confirmationIcon"
      @disapprove="confSnackbar = false"
    />
  </v-sheet>
</template>

<script>
import { formatTime } from '../utils/luxonHelpers';

import ConfirmationSnackbar from './prompts/confirmationSnackbar.vue';

export default {
  name: 'Exposure',
  props: {
    isConnected: Boolean,
    state: Object,
    hasVisits: Boolean,
    visitCount: Number,
    logVisits: Function,
    onExposureWarning: Function,
    setVaccinationStatus: Function,
    emergency: Boolean,
    addWarnings: Function,
  },
  components: {
    ConfirmationSnackbar,
  },

  computed: {
    diagnosticOutput() {
      return this.diagnostics.join('\n');
    },
    checkEmergency() {
      if (!this.openDiagnostics) {
        return 'Calendar';
      }
      return this.$vuetify.breakpoint.mdAndUp ? 'EmergencyW' : 'EmergencyH';
    },
    getWarningColor() {
      if (this.pctWeight === 0) {
        return 'green';
      }
      if (this.pctWeight < 25) {
        return 'amber';
      }
      if (this.pctWeight < 75) {
        return 'orange';
      }
      return 'red';
    },

    pctWeight() {
      return (this.weight / this.totalWeight) * 100;
    },
    pctWeightString() {
      return `${Math.round(this.pctWeight)}%`;
    },

    totalWeight() {
      return this.WarningOptions.filter((v) => v.weight).reduce((a, c) => {
        return a + c.weight;
      }, 0);
    },

    weight() {
      return this.warnings.reduce((a, c) => {
        return a + c.weight;
      }, 0);
    },

    dated() {
      return formatTime();
    },

    score() {
      console.log('Wt:', this.weight, 'e:', this.epsilon);
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
            this.recentFluShot
              ? 'especially since your recent flu shot'
              : 'unless the same symptoms come from a different disease like the flu'
          }.`;
          break;
        case 8:
          msg = `Since you show symptoms AND you see an alert, you may be in a vulnerable community. <br/>You can send an alert now, then get tested; or you can wait for your test results to ensure your symptoms are from COVID (and not the flu) before warning others of exposure.`;
          break;
        case 9: // either 3+6 or 2+6+1
          msg = `${
            this.vaccinationStatus
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
            this.vaccinationStatus
              ? 'you may be an asymptomatic carrier -- espcially since you are vaccinated.'
              : 'you may be an asymptomatic carrier.'
          }`;
          break;
        case 16:
          msg = `You are more likely to have COVID if you test positive AND show symptoms. <br/>${
            this.recentFluShot
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
            this.vaccinationStatus
              ? '<br/>As a <strong>breakthrough</strong> case, we hope your illness is mild and your recovery is quick.'
              : ''
          }`;
      }

      return msg;
    },
  },

  data() {
    return {
      openDiagnostics: this.emergency,
      diagnostics: [],

      numberOfShots: [0, 1, 2, 3],
      vaccinationStatus: null,
      isDebugging: true,
      ready: false,
      confirmationTitle: '',
      confirmationMessage: '',
      confirmationIcon: '',
      confSnackbar: false,
      // trick when using compound predicate for dialog (note we use :value not v-model when using compound predicates)
      dialog: true,
      snackbar: true,

      alignmentsItems: ['start', 'center', 'end', 'baseline', 'stretch'],
      alignment: 'center',
      dense: false,
      justifyItems: ['start', 'center', 'end', 'space-around', 'space-between'],
      justify: 'center',
      recentFluShot: true,
      wearsMask: true,
      epsilon: 0,
      menu: false,
      menu2: false,
      warnings: [],
      WarningOptions: [
        {
          icon: 'mdi-biohazard',
          text: 'I tested positive for COVID-19',
          weight: 10,
          type: 'primary',
        },
        {
          icon: 'mdi-biohazard',
          text: 'I present COVID symptoms',
          type: 'primary',
          weight: 6,
        },
        { text: '' },
        {
          icon: 'mdi-medical-bag',
          text: 'I was near a COVID carrier',
          type: 'secondary',
          weight: 3,
        },

        {
          icon: 'mdi-medical-bag',
          text: 'LCT warned me of exposure',
          type: 'secondary',
          weight: 2,
        },
      ],
    };
  },

  methods: {
    emailDiagnostics() {
      window.location = `mailto:mcorning@soteriaInstitute.org?subject=Diagnostics&body=Paste copied text here, please.}`;
    },
    log(diagnostic) {
      this.diagnostics.push(diagnostic);
    },
    open(view) {
      if (this.$router.currentRoute.name === view) {
        return;
      }
      this.$router.push({
        name: view,
      });
    },

    deleteDate() {
      this.epsilon = 0;
    },

    getColor(isconnected) {
      return isconnected ? 'yellow' : 'orange';
    },
    onError(error) {
      // let the global error handler pick up and display this error
      // TODO refactor error handling and put code in a util
      const msg = `Space.vue error message: ${error.message}`;
      throw Error(msg);
    },

    returnToSpaces() {
      this.$router.push({
        name: 'Space',
      });
    },

    warnThem(isADrill = false) {
      const reliability = isADrill ? 0 : this.pctWeight;
      console.log(
        this.state.vaccinationStatus || 'no vaccination date',
        this.state.recentFluShot || 'no flu shot date'
      );

      this.dialog = true;
      console.log(this.score, this.pctWeight);

      // we are getting warnings from the graph with this function
      this.onExposureWarning(
        {
          score: this.score,
          reliability,
        },
        (results) => {
          const alertsToSend = Object.values(results).flat();
          console.log(
            'exposureWarnings',
            JSON.stringify(alertsToSend, null, 3)
          );
          const visits = alertsToSend.length === 1 ? 'place' : 'places';
          console.log(
            `${this.$socket.client.auth.userID} sent exposure alerts to ${alertsToSend.length} ${visits}`
          );

          let places;
          switch (alertsToSend.length) {
            case 0:
              this.confirmationMessage =
                'Good news! You exposed no one else at the places you visited.';
              this.confirmationIcon = 'thumb_up_alt';
              break;
            case 1:
              this.confirmationMessage = `Thanks. You sent an exposure alert to ${alertsToSend[0].placeID} warning them that the virus is lurking in your community.`;
              this.confirmationIcon = 'cloud_done';
              break;

            default:
              places = alertsToSend.map((v) => v.placeID);
              this.confirmationMessage = `Well done. You sent exposure alerts that the virus is lurking in your community to ${
                alertsToSend.length
              } ${visits}: ${places.join(
                '<br/> '
              )}. <p>Soon, there will be no where for those virions to hide...</p>`;
              this.confirmationIcon = 'cloud_done';
              break;
          }

          this.confirmationTitle = 'Results of Exposure Warning';
          this.confSnackbar = true;
        }
      );
    },
  }, // end methods:

  filters: {
    monthYear: (val) => {
      if (val) {
        const parts = val.split('-');
        return `Month: ${parts[1]} Year: ${parts[0]}`;
      }
    },
  },

  watch: {
    openDiagnostics(val) {
      console.log(val);
    },
    ready() {
      console.log('Ready');
    },
    vaccinationStatus() {
      console.log(this.vaccinationStatus);
      this.setVaccinationStatus(this.vaccinationStatus);

      this.epsilon = this.vaccinationStatus ? 1 : 0;
      console.log('score:', this.score);
    },
    score() {
      console.log('score:', this.score);
    },
  },

  mounted() {
    this.ready = true;
    const query = this.$route.query;
    this.openDiagnostics = query.d && query.d === '1';
  },
};
</script>

<style lang="scss" scoped>
.EmergencyW {
  width: 50vw;
  height: 88vh;
}
.EmergencyH {
  width: 100vw;
  height: 50vh;
}
</style>
