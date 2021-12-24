<template>
  <v-container>
    <v-sheet
      v-if="isSponsor"
      class="overflow-x:hidden fill-height"
      outlined
      color="grey lighten-1"
      max-width="500"
    >
      <v-container fluid class="fill-height text-center">
        <v-card-title>Universal TQR Loyalty Tracking</v-card-title>

        <v-card-subtitle v-html="message"> </v-card-subtitle>
        <v-card-text class="text-caption">
          Your Google Confirmed Address:
          {{ confirmedAddress }}</v-card-text
        >
        <v-row no-gutters justify="center">
          <v-sheet v-if="isSponsor && !preview" color="blue-grey darken-1">
            <v-form ref="form" v-model="valid" lazy-validation>
              <v-card-text>
                <v-text-field
                  v-model="business"
                  :counter="nameMaxLength"
                  :rules="nameRules"
                  label="Your business name"
                  required
                  clearable
                  dark
                  color="grey lighten-3"
                ></v-text-field>
                <v-text-field
                  v-model="address"
                  :counter="addressMaxLength"
                  :rules="addressRules"
                  label="Your business address"
                  placeholder="Minimum: City [State]"
                  required
                  clearable
                  dark
                  color="grey lighten-3"
                ></v-text-field>
                <v-select
                  v-model="country"
                  :items="countries"
                  :rules="[(v) => !!v || 'Country is required']"
                  label="Country"
                  hint="To help validate your address, select a Country"
                  persistent-hint
                  required
                  dark
                  color="grey lighten-3"
                ></v-select>
              </v-card-text>
              <v-card-text>
                <!-- Promotion Text -->
                <v-textarea
                  v-model="promoText"
                  lines="4"
                  label="Promotion Message"
                  color="grey lighten-3"
                  dark
                ></v-textarea>
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
                </v-checkbox></v-card-text
              >
              <!-- buttons -->
              <v-sheet color="black">
                <v-card-actions>
                  <v-btn
                    text
                    :disabled="!isValid"
                    color="yellow"
                    class="mr-4"
                    @click="getPlaceID"
                  >
                    Confirm
                  </v-btn>

                  <v-btn
                    text
                    color="blue  lighten-3"
                    class="mr-4"
                    @click="reset"
                  >
                    Clear
                  </v-btn>
                  <v-spacer />
                  <v-btn
                    text
                    color="brown lighten-3"
                    class="white--text mr-4"
                    @click="promote"
                  >
                    Promote
                  </v-btn>
                </v-card-actions>
                <v-dialog v-model="dialog" absolute max-width="400" persistent>
                  <v-card>
                    <v-card-title class="text-h5 grey lighten-3">
                      Legal
                    </v-card-title>
                    <v-card-text>
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit,
                      sed do eiusmod tempor incididunt ut labore et dolore magna
                      aliqua. Ut enim ad minim veniam, quis nostrud exercitation
                      ullamco laboris nisi ut aliquip ex ea commodo consequat.
                      Duis aute irure dolor in reprehenderit in voluptate velit
                      esse cillum dolore eu fugiat nulla pariatur. Excepteur
                      sint occaecat cupidatat non proident, sunt in culpa qui
                      officia deserunt mollit anim id est laborum.
                    </v-card-text>
                    <v-divider></v-divider>
                    <v-card-actions>
                      <v-btn
                        text
                        @click="(agreement = false), (dialog = false)"
                      >
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
              </v-sheet>
            </v-form>
          </v-sheet>

          <v-card-text v-if="printing">
            <div id="targetDiv" ref="targetDiv" class="text-center">
              <v-row align="top" justify="center">
                <v-spacer />
                <v-col cols="auto" class="text-center">
                  <VueQRCodeComponent
                    id="qr"
                    ref="qr"
                    :text="decodedUri"
                    error-level="L"
                  >
                  </VueQRCodeComponent>
                </v-col>
                <v-spacer />
              </v-row>
            </div>
          </v-card-text>

          <v-card-actions v-if="printing">
            <v-row>
              <v-btn text color="primary" plain @click="stopPrint"
                >Cancel</v-btn
              >
              <v-spacer />
              <v-btn text color="primary" plain @click="printMe">Print</v-btn>
            </v-row>
          </v-card-actions>

          <confirmation-snackbar
            v-if="confSnackbar"
            :centered="true"
            :top="false"
            :confirmationTitle="confirmationTitle"
            :confirmationMessage="confirmationMessage"
            :confirmationIcon="confirmationIcon"
            :approveString="approveString"
            :disapproveString="disapproveString"
            @approved="onApproved"
            @disapprove="confSnackbar = false"
          />
        </v-row>
      </v-container>
    </v-sheet>

    <!-- customer sheet -->
    <v-sheet
      v-else
      class="overflow-x:hidden fill-height"
      outlined
      color="grey lighten-1"
      max-width="500"
    >
      <!-- <v-card class="d-flex align-center justify-center pa-4 mx-auto"> -->
      <v-container fluid class="fill-height text-center">
        <v-row no-gutters
          ><v-col>
            <v-card-title class="text-subtitle-1"
              >Universal TQR Loyalty Tracking</v-card-title
            >
          </v-col></v-row
        >
        <v-row dense justify="center"
          ><v-col>
            <span class="text-caption">
              {{ $route.params.id }}'s Confirmed Address:
              {{ confirmedAddress }}</span
            >
          </v-col></v-row
        >
        <v-row justify="center"
          ><v-col>
            <v-card v-model="rewardPoints" color="blue-grey darken-3">
              <v-card-title class="white--text text-subtitle-2"
                >Customer {{ $socket.client.auth.userID }}</v-card-title
              >
              <v-card-text
                class="white--text mx-auto"
                v-html="rewardPointsMessage"
              />
              <v-simple-table height="300px" dense dark>
                <template v-slot:default>
                  <tbody>
                    <tr v-for="(item, i) in dates" :key="i">
                      <td>{{ item }}</td>
                    </tr>
                  </tbody>
                </template>
              </v-simple-table>
              <v-card-actions>
                <v-btn
                  v-if="snackBtnText"
                  text
                  color="#00f500"
                  @click="rewardPoints = false"
                >
                  {{ snackBtnText }}
                </v-btn>
                <v-spacer />
                <v-btn text color="yellow" @click="earnTokens"
                  >Earn more tokens</v-btn
                >
              </v-card-actions>
            </v-card>
          </v-col></v-row
        >
        <v-btn text @click="renderPromos">Check for Enticements</v-btn>
        <v-carousel
          cycle
          height="300"
          hide-delimiter-background
          show-arrows-on-hover
        >
          <v-carousel-item v-for="(promo, i) in promos" :key="i">
            <v-sheet :color="colors[i]" height="100%">
              <v-row class="fill-height" align="center" justify="center">
                <v-card-text class="text-h4" v-html="promo"></v-card-text>
              </v-row>
            </v-sheet>
          </v-carousel-item>
        </v-carousel>
      </v-container>
      <!-- </v-card> -->
    </v-sheet>

    <!-- Footer card -->
    <v-card flat max-width="500">
      <v-card-text>
        <v-row align="center" justify="space-between"
          ><v-col cols="10">
            <span class="text-caption text-left">
              TQR Version: {{ $version }}</span
            ></v-col
          >
          <v-spacer />
          <v-col cols="2" align-self="end">
            <v-icon right
              >{{ isConnected ? 'mdi-lan-connect' : 'mdi-lan-disconnect' }}
            </v-icon></v-col
          ></v-row
        >
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
import VueQRCodeComponent from 'vue-qr-generator';
import * as easings from 'vuetify/lib/services/goto/easing-patterns';
import ConfirmationSnackbar from './prompts/confirmationSnackbar.vue';
import { DateTime } from '@/utils/luxonHelpers';
// import { printJson } from '@/utils/helpers';
export default {
  name: 'Sponsor',
  // sponsor is {sid, biz, address}
  props: {
    isConnected: Boolean,
    updateSponsor: Function,
    sponsor: Object,
    earnReward: Function,
  },
  components: { VueQRCodeComponent, ConfirmationSnackbar },
  computed: {
    isValid() {
      return this.business && this.address && this.country;
    },

    disableRegistration() {
      return this.biz || this.address;
    },

    decodedUri() {
      const b = encodeURIComponent(this.business);
      const d = `${window.location.origin}/sponsor/${b}`;
      return d;
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
      return this.sponsor.sid;
    },
    isSponsor() {
      return !this.$route.params.id;
    },

    newSponsor() {
      return !this.isSponsor && !this.sponsorID;
    },
    welcome() {
      const msg = this.isSponsor
        ? 'Welcome to Universal TQR Loyalty Tracking'
        : `Welcome to the ${this.$route.params.id} Community`;

      return msg;
    },
    message() {
      const msg = 'Fill in the form. Confirm your address. Print your QR.';
      // const msg = this.newSponsor
      // ?''
      //   : '';
      return msg;
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
      colors: [
        'indigo',
        'warning',
        'pink darken-2',
        'red lighten-1',
        'deep-purple accent-4',
      ],
      promos: [],
      promotions: '',
      promoText: '',
      agreement: false,
      dialog: false,
      approveString: 'Approve',
      disapproveString: 'Disapprove',
      dates: [],
      preview: false,
      nameMaxLength: 50,
      addressMaxLength: 75,
      valid: true,
      nameRules: [
        (v) => !!v || 'Name is required',
        (v) =>
          (v && v.length <= this.nameMaxLength) ||
          `Name must be less than ${this.nameMaxLength} characters`,
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
      confirmationMessage: '',
      confirmationIcon: 'check',
      countries: ['SG', 'UK', 'USA'],

      business: this.sponsor?.biz ?? '',
      address: this.sponsor?.address ?? '',
      country: this.sponsor?.country??'SG',
      confirmedAddress: this.sponsor?.confirmedAddress ?? '',

      registered: this.sponsor?.biz ?? false,
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
  methods: {
    promote() {
      const promoText = this.promoText;
      const sid = this.sponsorID;
      const biz = this.sponsorName;
      const country = this.country;
      this.emitFromClient('promote', { biz, country, promoText, sid }, (ack) =>
        alert(`Promotion ID: ${ack}`)
      );
    },

    onEarnReward() {
      const vm = this;
      // see Model.vue
      // it sends a message to node/redis returning the visitedOn data
      // it returns any promo text the restaurant has published
      this.earnReward({
        bid: this.$route.params.id,
        uid: this.$socket.client.auth.userID,
      }).then((visitedOn) => {
        const dates = visitedOn.map((v) => this.convertDateTime(v));

        // Jason wanted to wait on mentioning tokens.
        const tokenMsg = `<p>Out of ${
          visitedOn.length
        } visits, you are earning <strong> ${
          vm.$route.params.id
        }</strong> TQR tokens on ${dates.length === 1 ? 'this' : 'these'} ${
          dates.length
        } date${dates.length > 1 ? 's' : ''}:</p>`;
        console.log(tokenMsg);

        this.dates = dates;
        vm.rewardPointsMessage = `Here ${
          dates.length === 1 ? 'is' : 'are'
        } your ${dates.length} visit${
          dates.length > 1 ? 's' : ''
        } to <strong> ${vm.$route.params.id}</strong>:`;
        vm.rewardPoints = true;
      });
    },

    onApproved() {
      const biz = this.business;
      const address = this.address;
      const country = address.slice(address.lastIndexOf(',') + 2);
      const uid = this.$socket.client.auth.userID;
      const confirmedAddress = this.confirmedAddress;
      const promoText = this.promoText;
      console.log(biz, address, country, uid, confirmedAddress, promoText);
      this.updateSponsor({
        biz,
        address,
        country,
        uid,
        confirmedAddress,
        promoText,
      });

      this.confSnackbar = false;
      this.printing = true;
    },

    addSponsor() {
      const biz = this.business;
      const address = this.address;
      const country = address.slice(address.lastIndexOf(',') + 2);
      const uid = this.$socket.client.auth.userID;
      const confirmedAddress = this.confirmedAddress;
      console.log(biz, address, country, uid, confirmedAddress);

      this.updateSponsor({ biz, address, country, uid, confirmedAddress });
      this.registered = true;
      this.$vuetify.goTo(this.$refs.printDiv, this.options);
    },

    renderPromos() {
      if (!this.promotions) {
        return;
      }
      const promoMap = new Map(this.promotions);
      promoMap.forEach((promo) => {
        const promoMap = new Map(promo);
        promoMap.forEach((promo) => {
          this.promos.push(`At ${promo[1]}<p class="pt-3">${promo[3]}</p>`);
        });
      });
    },

    earnTokens() {
      window.open('https://TQRtokens.com', '_blank', 'noopener noreferrer');
    },
    validate() {
      this.$refs.form.validate();
    },
    reset() {
      this.$refs.form.reset();
    },

    convertDateTime(val) {
      console.log('date val', val);
      return new DateTime.fromISO(val).toLocaleString(DateTime.DATE_HUGE);
    },

    printMe() {
      this.preview = true;
      window.print();
    },
    stopPrint() {
      this.preview = false;
    },

    getPlaceID() {
      const address = `${this.business} ${this.address}`;
      const vm = this;
      this.emitFromClient(
        'getPlaceID',
        { address, country: this.country },
        ({ formatted_address, place_id, warning }) => {
          if (warning) {
            vm.confirmationMessage = warning;
            vm.disapproveString = 'OK';
            vm.approveString = null;
            vm.confSnackbar = true;
          } else {
            vm.approveString = 'Approve';
            vm.disapproveString = 'Disapprove';
            vm.confirmedAddress = place_id;
            vm.address = formatted_address;
            vm.confirmationMessage = `<p>Google found this address:<br/> ${formatted_address}
          <p>If <strong>correct</strong>, your place_id is:<br/> ${place_id}</p>
          <p>If not, enter an address with more or different detail.</p>`;
            vm.confSnackbar = true;
          }
        }
      );
    },

    emitFromClient(eventName, data, ack) {
      this.$socket.client.emit(eventName, data, ack);
    },
  }, // end of Methods

  watch: {
    business() {
      this.validate();
    },
    address() {
      this.validate();
    },
    country() {
      this.validate();
    },
    promotions(val) {
      this.renderPromos(val);
    },
    promoText(val) {
      console.log(this.business, val);
    },
  },

  mounted() {
    if (this.$route.params.id) {
      this.onEarnReward();
    } else {
      this.printing = this.confirmedAddress;
    }

    this.emitFromClient(
      'getPromotions',
      this.country,
      (promos) => (this.promotions = promos)
    );

    console.log('SPONSOR mounted');
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
