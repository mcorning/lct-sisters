<template>
  <v-container>
    <v-sheet
      class="overflow-x:hidden fill-height"
      outlined
      color="grey lighten-1"
      max-width="500"
    >
      <v-container v-if="!printingCard" fluid class="fill-height text-center">
        <!-- Header -->
        <v-row justify="space-between">
          <v-col>
            <v-card-title>Universal TQR Loyalty Tracking</v-card-title>

            <v-card-subtitle v-html="message"> </v-card-subtitle>
            <v-card-text class="text-caption">
              Your Google Confirmed Address:
              {{ confirmedAddress }}</v-card-text
            >
          </v-col>
          <v-col cols="auto" class="text-right">
            <VueQRCodeComponent
              id="qr"
              ref="qr"
              :text="decodedUri"
              error-level="L"
              size="128"
            >
            </VueQRCodeComponent>
            <v-btn text color="primary" plain @click="printingCard = true"
              >Preview QR Card</v-btn
            >
          </v-col>
        </v-row>

        <!-- Sponsor Registration Form -->
        <v-row justify="center">
          <v-card color="blue-grey darken-1" dark>
            <v-card-title>Sponsor Registration Form</v-card-title>
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
        </v-row>

        <!-- Promotions -->
        <v-row>
          <v-col>
            <v-card dark color="blue-grey darken-1">
              <v-card-title>{{ sponsorName }} Promotions</v-card-title>
              <v-card-subtitle>
                <v-checkbox
                  model="showAll"
                  label="Include all past promotions"
                ></v-checkbox>
              </v-card-subtitle>
              <v-simple-table>
                <template v-slot:default>
                  <thead>
                    <tr>
                      <th bgcolor="grey">Promotion</th>
                      <th bgcolor="grey">From</th>
                      <th bgcolor="grey">For</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in ps" :key="item.promoText">
                      <td style="text-align: left">{{ item.promoText }}</td>
                      <td style="text-align: left">{{ item.dated }}</td>
                      <td style="text-align: left">{{ item.expires }} days</td>
                    </tr>
                  </tbody>
                </template>
              </v-simple-table>
              <v-card-text>
                <!-- Promotion Text -->
                <v-textarea
                  v-model="promoText"
                  lines="4"
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
                  @click="promote"
                >
                  Promote
                </v-btn>
              </v-card-actions>
            </v-sheet>
          </v-col>
        </v-row>

        <!-- Footer card -->
        <v-card flat max-width="500">
          <v-card-text>
            <v-row align="center" justify="space-between"
              ><v-col>
                <span class="text-caption text-left">
                  TQR Ver: {{ $version }}</span
                ></v-col
              >
              <span class="text-caption">{{ decodedUri }}</span>
              <v-col justify-self="end">
                <v-icon right
                  >{{ isConnected ? 'mdi-lan-connect' : 'mdi-lan-disconnect' }}
                </v-icon></v-col
              ></v-row
            >
          </v-card-text>
        </v-card>
      </v-container>

      <v-card v-else>
        <v-card-text>
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
        <v-card-actions>
          <v-btn text color="primary" plain @click="stopPrint">Cancel</v-btn>
          <v-spacer />
          <v-btn text color="primary" plain @click="printMe">Print</v-btn>
        </v-card-actions>
      </v-card>

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
    </v-sheet>
  </v-container>
</template>

<script>
import VueQRCodeComponent from 'vue-qr-generator';
import * as easings from 'vuetify/lib/services/goto/easing-patterns';
import ConfirmationSnackbar from './prompts/confirmationSnackbar.vue';
import { DateTime } from '@/utils/luxonHelpers';
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
    enticements() {
      const x = this.ps.map((v) => {
        return `Promotion: ${v.promoText}\tOffered: ${v.visitedOn} `;
      });
      return x.join('\n');
    },
    isValid() {
      return this.business && this.address && this.country;
    },

    disableRegistration() {
      return this.biz || this.address;
    },

    decodedUri() {
      const b = encodeURIComponent(this.business);
      return `${window.location.origin}/sponsor/${b}`;
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
      country: this.sponsor?.country ?? 'SG',
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
      const confirmedAddress = this.confirmedAddress;
      const promotionalDays = this.promotionalDays;
      this.emitFromClient(
        'promote',
        { confirmedAddress, biz, country, promoText, promotionalDays, sid },
        () => this.getPromos()
      );
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
    },
    reset() {
      this.$refs.form.reset();
    },

    convertDateTime(val) {
      console.log('date val', val);
      return new DateTime.fromISO(val).toLocaleString(DateTime.DATE_HUGE);
    },

    printMe() {
      this.printingCard = true;
      window.print();
    },
    stopPrint() {
      this.printingCard = false;
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
    getPromos() {
      const biz = this.business;
      const country = this.country;
      this.emitFromClient('getPromotions', { biz, country }, (promos) => {
        console.log(
          'Sponsor.vue promos for',
          'biz:',
          JSON.stringify(promos, null, 2)
        );
        this.ps = promos;
      });
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
    this.getPromos();

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
