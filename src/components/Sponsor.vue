<template>
  <v-container>
    <v-sheet
      class="overflow-x:hidden fill-height"
      outlined
      color="grey lighten-1"
      max-width="600"
    >
      <v-container v-if="!printingCard" fluid class="fill-height">
        <!-- Header -->
        <v-row no-gutters justify="space-between">
          <v-col cols="7" sm="8">
            <v-card-title class="text-subtitle-1 text-sm-h4"
              >TQR Loyalty Service</v-card-title
            >

            <v-card-subtitle>Sponsor View </v-card-subtitle>
            <v-card-text class="text-caption">
              Your Device ID:
              {{ userID }} <br />
              Your Stream ID:
              {{ sponsorID }}
            </v-card-text>
          </v-col>
          <v-col cols="auto">
            <VueQRCodeComponent
              id="qr"
              ref="qr"
              :text="encodedUri"
              error-level="L"
              :size="qrSize"
            >
            </VueQRCodeComponent>
            <v-btn
              text
              plain
              class="text-caption text-sm-body-1"
              @click="printingCard = true"
              color="green darken-4"
              >For Rewards</v-btn
            ></v-col
          >
        </v-row>

        <!-- Sponsor Registration Form -->
        <v-row justify="center">
          <v-col cols="12">
            <v-card color="blue-grey darken-1" dark>
              <v-card-title>Sponsor Registration Form</v-card-title>
              <v-form ref="form" v-model="valid" lazy-validation>
                <v-card-text>
                  <v-text-field
                    v-model="business"
                    :counter="nameMaxLength"
                    required
                    :rules="nameRules"
                    label="Your business name"
                    clearable
                    dark
                    color="grey lighten-3"
                    @blur="saveBiz"
                  ></v-text-field>
                  <!-- Normal rendering of address-->
                  <div v-if="address">
                    <v-text-field
                      class="mt-5"
                      v-model="address"
                      label="Your official address"
                      dark
                      readonly
                      color="grey lighten-3"
                      :hint="place_id"
                      persistent-hint
                    ></v-text-field>
                  </div>

                  <!-- Registration form -->
                  <div v-else>
                    <v-text-field
                      class="mt-5"
                      v-model="anAddress"
                      label="Find this address"
                      dark
                      :rules="[(v) => !!v || 'Address is required']"
                      color="grey lighten-3"
                      :hint="place_id"
                      persistent-hint
                    ></v-text-field>
                    <v-combobox
                      v-model="city"
                      :items="cities"
                      label="City"
                      required
                      :rules="[(v) => !!v || 'City is required']"
                      clearable
                      dark
                      color="grey lighten-3"
                    ></v-combobox>

                    <v-combobox
                      v-model="countryAbbr"
                      :items="countries"
                      :rules="countryRules"
                      required
                      label="Country Abbreviation"
                      hint="Select (or enter) a two character Country"
                      persistent-hint
                      clearable
                      dark
                      color="grey lighten-3"
                    ></v-combobox>
                  </div>
                </v-card-text>
                <!-- Legal -->
                <v-card-text>
                  <v-checkbox v-model="agreement" dark required>
                    <template v-slot:label>
                      I agree to the&nbsp;
                      <a href="#" @click.stop.prevent="dialog = true"
                        >Terms of Service</a
                      >
                      &nbsp;and&nbsp;
                      <a href="#" @click.stop.prevent="dialog = true"
                        >Privacy Policy</a
                      >*
                    </template>
                  </v-checkbox>
                </v-card-text>
                <!-- Buttons -->
                <v-sheet color="black">
                  <v-card-actions>
                    <v-btn
                      v-if="registered && !address"
                      text
                      color="yellow"
                      class="mr-4"
                      @click="register"
                    >
                      Register Sponsor
                    </v-btn>
                    <v-spacer />
                    <v-btn
                      text
                      color="blue  lighten-3"
                      class="mr-4"
                      @click="reset"
                    >
                      Clear
                    </v-btn>
                  </v-card-actions>
                </v-sheet>
              </v-form>
            </v-card>
          </v-col>
        </v-row>

        <!-- Promotions -->
        <v-row>
          <v-col>
            <v-card dark color="blue-grey darken-1">
              <v-card-title>{{ business }} Promotions</v-card-title>
              <v-card-subtitle>
                Swipe right to delete selected promotion
              </v-card-subtitle>
              <v-simple-table>
                <template v-slot:default>
                  <thead>
                    <tr>
                      <th id="promo" style="bgcolor: grey">Promotion</th>
                      <th id="from" style="bgcolor: grey">From</th>
                      <th id="for" style="bgcolor: grey">Days</th>
                      
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="item in ps"
                      :key="item.promoText"
                      v-touch="{ right: () => deletePromo(item.promoText) }"
                    >
                      <td style="text-align: left">{{ item.promoText }}</td>
                      <td style="text-align: left">{{ item.dated }}</td>
                      <td style="text-align: left">
                        {{ promotionalDays }} 
                      </td>
                    </tr>
                  </tbody>
                </template>
              </v-simple-table>
              <v-card-text>
                <!-- Promotion Text -->
                <v-textarea
                  v-model="promoText"
                  lines="2"
                  label="New Promotion Message"
                  color="grey lighten-3"
                  dark
                  outlined
                ></v-textarea>
                <v-text-field
                  v-model="promotionalDays"
                  label="Offer expires"
                  placeholder="(Days)"
                />
              </v-card-text>
            </v-card>

            <!-- buttons -->
            <v-sheet color="black">
              <v-card-actions>
                <v-spacer />
                <v-btn
                  :disabled="!promoText"
                  text
                  color="brown lighten-3"
                  class="white--text mr-4"
                  @click="addPromo"
                >
                  Promote
                </v-btn>
              </v-card-actions>
            </v-sheet>
          </v-col>
        </v-row>

        <!-- Loyalists -->
        <v-row
          ><v-col>
            <v-card dark color="blue-grey darken-1">
              <v-card-title>{{ business }} Loyalists</v-card-title>
              <v-card-subtitle>
                These customers are earning loyalty reward points
              </v-card-subtitle>
              <v-simple-table>
                <template v-slot:default>
                  <thead>
                    <tr>
                      <th id="promo" style="bgcolor: grey">Customer ID</th>
                      <th id="from" style="bgcolor: grey">Points</th>
                      <th id="for" style="bgcolor: grey">Last Visit</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in loyalists" :key="item.cid">
                      <td style="text-align: left">{{ item.cid }}</td>
                      <td style="text-align: left">{{ item.points }}</td>
                      <td style="text-align: left">
                        {{ getFormattedDateTime(item.dated) }}
                      </td>
                    </tr>
                  </tbody>
                </template>
              </v-simple-table>
            </v-card>
          </v-col></v-row
        >

        <!-- Footer card -->
        <v-row dense justify="space-between">
          <v-col cols="11">
            <span class="text-caption text-left"> TQR Ver: {{ $version }}</span>
          </v-col>

          <v-col cols="1">
            <v-icon right
              >{{ isConnected ? 'mdi-lan-connect' : 'mdi-lan-disconnect' }}
            </v-icon>
          </v-col>
        </v-row>
        <v-row no-gutters justify="center">
          <v-col cols="auto">
            <span class="text-caption">{{ userAgent }}</span></v-col
          ></v-row
        >
        <v-row no-gutters justify="center">
          <v-col cols="auto">
            <span class="text-caption"
              >Customers earn rewards using: <br />{{ encodedUri }}</span
            ></v-col
          ></v-row
        >
      </v-container>

      <!-- QR Card Printout -->
      <div v-else>
        <div id="targetDiv" ref="targetDiv" class="text-center">
          <v-card>
            <v-card-title
              >Earn {{ business }} Customer Loyalty Rewards</v-card-title
            >
            <v-card-subtitle
              >To earn those rewards, scan the {{ business }} QR code
              here</v-card-subtitle
            >
            <v-card-text>
              <v-row align="top" justify="center">
                <v-spacer />
                <v-col cols="auto" class="text-center">
                  <VueQRCodeComponent
                    id="qr"
                    ref="qr"
                    :text="encodedUri"
                    error-level="L"
                  >
                  </VueQRCodeComponent>
                </v-col>
                <v-spacer />
              </v-row>
              <v-row
                ><v-col>
                  <v-card-text class="text-caption">
                    <p class="mb-1">Or enter this URL in your browser:</p>
                    <v-tooltip top>
                      <template v-slot:activator="{ on, attrs }">
                        <input
                          v-bind="attrs"
                          v-on="on"
                          @mousedown="copyState = false"
                          @focus="$event.target.select()"
                          ref="clone"
                          readonly
                          :value="encodedUri"
                          size="45"
                        />
                      </template>
                      <span>{{ copyMsg }}</span>
                    </v-tooltip>
                    <v-tooltip top>
                      <template v-slot:activator="{ on, attrs }">
                        <v-btn
                          v-bind="attrs"
                          v-on="on"
                          @click="copy"
                          icon
                          color="blue-grey darken-2"
                        >
                          <v-icon>mdi-content-copy</v-icon>
                        </v-btn>
                      </template>
                      <span>Copy selected text</span>
                    </v-tooltip>
                  </v-card-text></v-col
                ></v-row
              >
            </v-card-text>
          </v-card>
        </div>

        <v-card-actions>
          <v-btn text color="blue-grey darken-2" plain @click="stopPrint"
            >Cancel</v-btn
          >
          <v-spacer />
          <v-btn text color="blue-grey darken-2" plain @click="printMe"
            >Print</v-btn
          >
        </v-card-actions>
      </div>

      <v-dialog v-model="dialog" absolute max-width="400" persistent>
        <v-card>
          <v-card-title class="text-h5 grey lighten-3"> Legal </v-card-title>
          <v-card-text>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat. Duis aute irure dolor in
            reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
            pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
            culpa qui officia deserunt mollit anim id est laborum.
          </v-card-text>
          <v-divider></v-divider>
          <v-card-actions>
            <v-btn text @click="(agreement = false), (dialog = false)">
              No
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn
              class="white--text"
              color="deep-purple accent-4"
              @click="(agreement = true), (dialog = false)"
            >
              Yes
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <confirmation-snackbar
        v-if="confSnackbar"
        :centered="centered"
        :bottom="bottom"
        :confirmationTitle="confirmationTitle"
        :confirmationSubtitle="confirmationSubtitle"
        :confirmationMessage="confirmationMessage"
        :confirmationIcon="confirmationIcon"
        :approveString="approveString"
        :disapproveString="disapproveString"
        :timeout="timeout"
        @approved="approved"
        @disapprove="confSnackbar = false"
      />
    </v-sheet>
    <v-snackbar v-model="toast">
      {{ toastText }}
      <template v-slot:action="{ attrs }">
        <v-btn color="pink" text v-bind="attrs" @click="toast = false">
          {{ toastButton }}
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script>
import VueQRCodeComponent from 'vue-qr-generator';
import * as easings from 'vuetify/lib/services/goto/easing-patterns';
import ConfirmationSnackbar from './prompts/confirmationSnackbar.vue';
import { DateTime, formatTime } from '@/utils/luxonHelpers';
import { printJson, info, isEmpty, head, success } from '@/utils/helpers';

export default {
  name: 'Sponsor',
  // sponsor is {ssid, biz, address}
  props: {
    isConnected: Boolean,
    updateSponsor: Function,
    sponsor: Object,
    earnReward: Function,
    audit: Function,
  },
  components: { VueQRCodeComponent, ConfirmationSnackbar },
  computed: {
    place_id() {
      return `Place ID: ${this.confirmedAddress}`;
    },

    userAgent() {
      return navigator.userAgent;
    },
    copyMsg() {
      // copyState starts out false
      // so first hover over says, "Click to select text then copy"
      // copy() toggles copyState to true
      // second hover says, "Text copied"
      return this.copyState ? 'Text copied' : 'Click to select text then copy';
    },
    userID() {
      return this.$socket.client.auth.userID;
    },
    qrSize() {
      const width =
        this.$vuetify.breakpoint.width < 600
          ? this.$vuetify.breakpoint.width
          : 600;
      const cols = 3;
      return width * (cols / 12);
    },

    enticements() {
      const x = this.ps.map((v) => {
        return `Promotion: ${v.promoText}\tOffered: ${v.visitedOn} `;
      });
      return x.join('\n');
    },

    disableRegistration() {
      return this.biz || this.address;
    },

    encodedUri() {
      return this.isConnected
        ? encodeURI(`${window.location.origin}/customer/${this.userID}`)
        : 'You are not online yet.';
    },
    sponsorName() {
      return this.sponsor.biz || this.business;
    },
    sponsorAddress() {
      return this.sponsor.address;
    },
    sponsorCountry() {
      return this.sponsor.country;
    },
    sponsorID() {
      return this.ssid || this.sponsor.ssid;
    },
    isSponsor() {
      return !this.$route.params.id;
    },

    message() {
      return 'Fill in the form. Confirm your address. Print your QR.';
    },

    options() {
      return {
        duration: this.duration,
        offset: this.offset,
        easing: this.easing,
      };
    },
  },

  data() {
    return {
      anAddress: '',
      loyalists: [],
      registered: false,
      // registered: this.sponsor?.biz ?? false,
      ssid: '',
      centered: false,
      bottom: false,
      timeout: -1,
      selectedPromo: null,
      toast: false,
      toastText: 'They are redeemed',
      toastButton: 'Close',
      copyState: false,
      cid: '',
      transaction: '',
      approval: '',
      printingCard: false,
      promotionalDays: 7,
      showAll: false,
      tree: [],
      items: [],
      colors: [
        'indigo',
        'warning',
        'pink darken-2',
        'red lighten-1',
        'deep-purple accent-4',
      ],
      ps: [],
      undo: null,
      promos: [],
      promotions: '',
      promoText: '',
      agreement: false,
      dialog: false,
      approveString: 'Approve',
      disapproveString: 'Disapprove',
      dates: [],
      nameMaxLength: 50,
      addressMaxLength: 75,
      valid: true,
      nameRules: [
        (v) => !!v || 'Name is required',
        (v) =>
          (v && v.length <= this.nameMaxLength) ||
          `Name must be less than ${this.nameMaxLength} characters`,
      ],
      countryRules: [
        (v) => !!v || 'Country is required',
        (v) =>
          (v && v.length === 2) ||
          `Country must be two characters (and will be lowercase)`,
      ],
      addressRules: [
        (v) =>
          !!v ||
          'Google may require some part of address to find this location',
        (v) =>
          (v && v.length <= this.addressMaxLength) ||
          `Name must be less than ${this.addressMaxLength} characters`,
      ],
      email: '',
      emailRules: [
        (v) => !!v || 'E-mail is required',
        (v) => /.+@.+\..+/.test(v) || 'E-mail must be valid',
      ],

      rewardPoints: false,
      rewardPointsMessage: '',
      confSnackbar: false,
      confirmationTitle: 'Address Confirmation',
      confirmationSubtitle: '',
      confirmationMessage: '',
      confirmationIcon: 'check',

      business: this.sponsor?.biz ?? '',
      address: this.sponsor?.address ?? '',
      countries: '',
      country: this.sponsor?.country ?? '',
      countryAbbr: '',
      city: '',
      // TODO REFACTOR: follow the lead on countries and make this array dynamic
      cities: ['Manchester', 'Sisters', 'Singapore'],
      confirmedAddress: this.sponsor?.confirmedAddress ?? '',

      snackBtnText: '',
      snackBarMessage: 'Ready to get started?',
      snackBarActionIndex: 0,
      confirmation: null,
      printing: false,
      duration: 300,
      offset: 0,
      easing: 'easeInOutCubic',
      easings: Object.keys(easings),
    };
  },

  sockets: {
    shakeHands({ cid, transaction }) {
      this.cid = cid;
      this.transaction = transaction;
      this.approval = 'addReward';
      this.confirmationTitle = 'Granting Reward Points';
      this.confirmationMessage = `Customer ${cid} wants to ${transaction}`;
      this.approveString = 'Approve';
      this.confSnackbar = true;
    },
  },

  methods: {
    saveBiz() {
      if (this.address && confirm('Save to local storage?')) {
        this.updateSponsor({ biz: this.business });
      }
    },
    getFormattedDateTime(val) {
      return formatTime(Number(val));
    },

    compactCityOrState(cityOrState, tails) {
      const heads = head(cityOrState);

      const headsAndTails = [...heads, ...tails];
      const set = [...new Set(headsAndTails)];
      console.log('set', printJson(set));
      return set;
    },

    getCountries() {
      this.emitFromClient('getCountries', null, (countries) => {
        const tails = ['sg', 'uk', 'us'];
        this.countries = this.compactCityOrState(countries, tails);
      });
    },
    getCities() {
      this.emitFromClient('getCities', null, (cities) => {
        const tails = ['Manchester', 'Sisters', 'Singapore'];
        this.cities = this.compactCityOrState(cities, tails);
      });
    },
    approved() {
      switch (this.approval) {
        case 'addReward':
          this.addReward();
          break;
        case 'addSponsor':
          this.addSponsor();
          break;
        case 'undo':
          if (isEmpty(this.undo)) {
            return;
          }
          this.confSnackbar = false;
          // add undo back to stream
          this.promoText = this.undo.promoText;
          this.addPromo();
          break;

        default:
          alert(`Cannot handle approval value of ${this.approval}`);
          break;
      }
    },
    // TODO REFACTOR: this should be a guard on the Sponsor model
    checkForCityState() {
      const startOfCountry = this.address.lastIndexOf(',') + 2;
      const cityStateCandidate = this.address.slice(startOfCountry);
      return cityStateCandidate.includes('Singapore')
        ? 'sg'
        : cityStateCandidate.slice(0, 2).toLowerCase();
    },

    addSponsor() {
      this.registered = true;
      // if the confirmation is for rewards, don't process new/updated sponsor
      if (this.confSnackbar === 2) {
        this.confSnackbar = false;
        return;
      }
      const uid = this.userID;
      const biz = this.business.trim();
      const country = this.checkForCityState();
      const key = `tqr:${country.slice(0, 2).toLowerCase()}`;
      console.log(info('addSponsor() key :>> ', key));

      this.emitFromClient(
        'addSponsor',
        {
          key,
          biz,
          uid,
        },
        (ssid) => {
          this.ssid = ssid;
          const address = this.address;
          const confirmedAddress = this.confirmedAddress;
          const userAgent = navigator.userAgent;
          // when a browser becomes a Sponsor,
          // settings gets a ssid
          this.updateSponsor({
            id: 1,
            biz,
            country,
            uid,
            ssid,
            address,
            confirmedAddress,
            userAgent,
            tag: 'sponsore.vue:addSponsor()',
          });
          this.confSnackbar = false;
          this.printing = true;
        }
      );
    },

    addReward() {
      if (isEmpty(this.sponsor)) {
        alert('Houston, we have a problem. Please reload me.');
        return;
      }
      // Sponsor has to be online to approve Reward
      this.confSnackbar = false;

      const country = this.sponsorCountry;
      // back to server
      this.emitFromClient('addReward', {
        country,
        ssid: this.sponsorID,
        cid: this.cid,
        sid: this.userID,
        biz: this.business,
        transaction: this.transaction,
      });
      // nothing else for Sponsor to do
    },

    addPromo() {
      if (!this.isConnected) {
        alert('You are not online yet.');
        return;
      }
      const { country, ssid, biz } = this.sponsor;
      // const key = `tqr:${country}:${ssid}:promos`;
      const promoText = this.promoText;
      console.log(info('addPromo()  :>> ', country, ssid, biz, promoText));

      this.emitFromClient('addPromo', { country, ssid, biz, promoText }, () =>
        this.getPromos()
      );
    },

    deletePromo(promo) {
      this.undo = this.ps.find((v) => v.promoText === promo);
      const country = this.sponsorCountry;

      this.confirmationTitle = 'Undo';
      this.confirmationMessage = `Undo ${promo} deletion?`;
      this.approval = 'undo';
      this.approveString = 'Yes';
      this.disapproveString = 'No';
      this.centered = true;
      this.bottom = true;
      this.timeout = 5000;
      this.confSnackbar = true;
      this.emitFromClient(
        'deletePromo',
        {
          country,
          biz: this.sponsor.biz,
          ssid: this.sponsorID,
          sid: this.undo.ssid,
        },
        (ct) => {
          console.log(`${ct} entry deleted`);
          this.getPromos();
        }
      );
    },

    getPromos() {
      const { country, ssid } = this.sponsor;

      console.log(info('getPromos() key :>> ', country, ssid));
      this.emitFromClient('getPromos', { country, ssid }, (promos) => {
        console.log('Sponsor.vue promos for', 'biz:', printJson(promos));
        this.ps = promos;
      });
    },

    renderPromos() {
      if (!this.promotions) {
        return;
      }
      const promosMap = new Map(this.promotions);
      promosMap.forEach((promo) => {
        const promoMap = new Map(promo);
        promoMap.forEach((p) => {
          this.promos.push(`At ${p[1]}<p class="pt-3">${p[3]}</p>`);
        });
      });
      console.log([...promosMap]);
    },

    earnTokens() {
      window.open('https://TQRtokens.com', '_blank', 'noopener noreferrer');
    },
    validate() {
      this.$refs.form.validate();
      const x =
        isEmpty(this.city) ||
        isEmpty(this.countryAbbr) ||
        isEmpty(this.business);

      // if any field is empty, we are not registered
      this.registered = !x;
    },
    reset() {
      this.$refs.form.reset();
      this.registered = false;
      this.updateSponsor({
        id: 1,
        biz: '',
        country: '',
        ssid: '',
        address: '',
        confirmedAddress: '',
        tag: 'sponsore.vue:reset()',
      });
    },

    convertDateTime(val) {
      console.log('date val', val);
      return new DateTime.fromISO(val).toLocaleString(DateTime.DATE_HUGE);
    },

    copy() {
      this.$refs.clone.focus();
      navigator.clipboard.writeText(this.$refs.clone.value);
      this.copyState = true;
    },
    printMe() {
      this.printingCard = true;
      window.print();
    },
    stopPrint() {
      this.printingCard = false;
    },

    register() {
      // const address = `${this.business} ${this.city}`;
      const address = `${this.business} ${this.anAddress}`;

      const vm = this;
      this.emitFromClient(
        'getPlaceID',
        { address, country: this.countryAbbr },
        // formatted_address and place_id come from getPlaceID()
        // warning comes from confirmPlaceID(). e.g., 'Cannot find an address based on your input.'
        ({ formatted_address, place_id, warning }) => {
          if (warning) {
            vm.confirmationMessage = warning;
            vm.disapproveString = 'OK';
            vm.approveString = null;
            vm.confSnackbar = true;
          } else {
            vm.approval = 'addSponsor';
            vm.approveString = 'Approve';
            vm.disapproveString = 'Disapprove';
            vm.confirmedAddress = place_id;
            vm.address = formatted_address;
            vm.confirmationMessage = `<p>Google found this address:<br/> ${formatted_address}
          <p>If <strong>correct</strong>, your place_id is:<br/> ${place_id}</p>
          <p>If not, enter an address with more or different detail.</p>`;
            vm.confSnackbar = true;
          }
          // user now (Dis)Approves new Sponsor
        }
      );
    },

    emitFromClient(eventName, data, ack) {
      this.$socket.client.emit(eventName, data, ack);
    },

    redeemReward({ cid, points }) {
      this.emitFromClient(
        'redeemReward',
        { country: this.sponsor.country, ssid: this.sponsor.ssid, cid, points },
        (ack) => {
          this.toastText = ack;
          this.toast = true;
        }
      );
    },

    getLoyalists(ssid) {
      const country = this.country;
      this.emitFromClient('getLoyalists', { country, ssid }, (loyalists) => {
        this.loyalists = loyalists;
        console.log('loyalists :>> ', printJson(loyalists));
      });
    },
  }, // end of Methods

  watch: {
    undo(val) {
      console.log('undo val :>> ', val);
    },
    business() {
      this.validate();
    },
    address() {
      this.validate();
    },
    city() {
      this.validate();
    },
    countryAbbr() {
      this.validate();
    },
    promotions(val) {
      this.renderPromos(val);
    },
    registered(n, o) {
      console.log(info('registered val (n/o) :>> ', n, o));
    },
  },

  mounted() {
    // if this.sponsor is empty, enable registration
    this.registered = !isEmpty(this.sponsor.address);

    // to fill in items for the country combobox (if needed)
    this.getCountries();
    // the only way for a Sponsor to redeem rewards is to scan the Customer's QR
    // this means the handshake with the Customer starts with the Sponsor here:
    if (!isEmpty(this.$route.query)) {
      // the query includes the Customer's uid
      // the Sponsor will ensure that the specified Customer is on the other end of the call
      // this means that only the original Customer can claim the reward, not some phone with
      // a different uid impersonating the original Customer.
      // the query includes a list of SIDS for each visit the Customer and Sponsor logged mutually.
      this.redeemReward(this.$route.query);
    } else {
      this.printing = this.confirmedAddress;
    }
    // TODO REFACTOR: this way of handling ssid stinks
    // NOTE: this.sponsor gets its data from local storage
    this.ssid = this.sponsor.ssid;
    if (this.ssid) {
      this.getPromos();
      this.getLoyalists(this.ssid);
    }

    console.log(success(`\tSPONSOR ${this.sponsorID} mounted`));
  },
};
</script>

<style lang="scss" scoped>
@media print {
  body * {
    visibility: hidden;
  }
  #targetDiv,
  #targetDiv * {
    visibility: visible;
    border: none;
  }
}
/* unvisited link */
a:link {
  color: #ccc;
}
/* visited link */
a:visited {
  color: #095484;
}
/* mouse over link */
a:hover {
  color: #8ebf42;
}
/* selected link */
a:active {
  color: #800000;
}
</style>
