<template>
  <v-container fluid>
    <v-card>
      <div v-if="isSponsor && !preview">
        <v-form ref="form" v-model="valid" lazy-validation>
          <v-card-title class="text-subtitle-2">{{ welcome }}</v-card-title>
          <v-card-subtitle>
            Version: {{ $version }} <br />Confirmed Address:
            {{ confirmedAddress }}</v-card-subtitle
          >
          <v-card-text v-html="message"> </v-card-text>
          <v-divider />
          <v-card-text>
            <v-text-field
              v-model="business"
              :counter="nameMaxLength"
              :rules="nameRules"
              label="Your business name"
              required
              clearable
            ></v-text-field>
            <v-text-field
              v-model="address"
              :rules="addressRules"
              label="Your business address"
              placeholder="Minimum: City [State]"
              required
              clearable
            ></v-text-field>
            <v-select
              v-model="country"
              :items="countries"
              :rules="[(v) => !!v || 'Item is required']"
              label="Country"
              required
            ></v-select>
          </v-card-text>
          <v-card-actions>
            <v-btn
              :disabled="!valid"
              color="success"
              class="mr-4"
              @click="getPlaceID"
            >
              Validate Address
            </v-btn>

            <v-btn color="error" class="mr-4" @click="reset">
              New Sponsor
            </v-btn>
          </v-card-actions>
        </v-form>
      </div>

      <v-card-text v-if="printing">
        <div id="targetDiv" ref="targetDiv" class="text-center">
          <v-row align="center">
            <v-spacer />
            <v-col cols="12" class="text-center">
              <p>
                Scan this QR code to access our
                <strong>{{ business }} Loyalty Rewards</strong>.
              </p>
              <p>
                Each time you scan our code, you earn points for future
                discounts.
              </p>
              <p>We use no personal identifying information.</p></v-col
            >
            <v-spacer />
          </v-row>
          <v-row align="top">
            <v-spacer />
            <v-col cols="12" class="text-center">
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
          <v-btn text color="primary" plain @click="stopPrint">Cancel</v-btn>
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
        approveString="Approve"
        disapproveString="Disapprove"
        @approved="onApproved"
        @disapprove="confSnackbar = false"
      />
    </v-card>
    <v-sheet class="overflow-auto fill-height  ">
      <v-container fluid class="fill-height text-center ">
        <v-card-title>Universal Loyalty Tracking</v-card-title>
        <v-card-subtitle>
          Version: {{ $version }} <br />Confirmed Address:
          {{ confirmedAddress }}</v-card-subtitle
        >
        <v-card v-model="rewardPoints" color="blue-grey darken-3">
          <v-card-title class="white--text">Well Done, {{$socket.client.auth.userID}}</v-card-title>
          <v-card-subtitle
            class="white--text mx-auto"
            v-html="rewardPointsMessage"
          />
          <v-card-actions>
            <v-btn
              v-if="snackBtnText"
              text
              color="#00f500"
              @click="rewardPoints = false"
            >
              {{ snackBtnText }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-container></v-sheet
    >
  </v-container>
</template>

<script>
import VueQRCodeComponent from 'vue-qr-generator';
import * as easings from 'vuetify/lib/services/goto/easing-patterns';
import ConfirmationSnackbar from './prompts/confirmationSnackbar.vue';
import { DateTime } from '@/utils/luxonHelpers';
// import { printJson } from '@/utils/helpers';
export default {
  name: 'SponsorView',
  // sponsor is {sid, biz, address}
  props: {
    isConnected: Boolean,
    updateSponsor: Function,
    sponsor: Object,
    earnReward: Function,
  },
  components: { VueQRCodeComponent, ConfirmationSnackbar },
  computed: {
    disableRegistration() {
      return this.biz || this.address;
    },

    decodedUri() {
      const b = encodeURIComponent(this.business);
      const d = `${window.location.origin}/sponsor/${b}`;
      return d;
    },
    sponsorName() {
      return this.sponsor.biz;
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
        ? 'Welcome to Universal Loyalty Tracking'
        : `Welcome to the ${this.$route.params.id} Community`;

      return msg;
    },
    message() {
      const msg = this.newSponsor
        ? 'Enter your Business Name and Address. Validate your address with Google. Print your Loyalty QR.'
        : '';
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
      preview: false,
      nameMaxLength: 30,
      addressMaxLength: 50,
      valid: false,
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
      confirmationIcon: 'question_mark',
      countries: ['SG', 'UK', 'USA'],

      business: this.sponsor?.biz ?? '',
      address: this.sponsor?.address ?? '',
      country: this.sponsor?.country ?? '',
      confirmedAddress: this.sponsor?.confirmedAddress ?? '',

      registered: this.sponsor?.biz ?? false,
      snackBtnText: 'ok',
      snackBarMessage: 'Ready to get started?',
      snackBarActionIndex: 0,
      confirmation: null,
      // showMe: false,
      printing: false,
      duration: 300,
      offset: 0,
      easing: 'easeInOutCubic',
      easings: Object.keys(easings),
    };
  },
  methods: {
    validate() {
      this.$refs.form.validate();
    },
    reset() {
      this.$refs.form.reset();
    },

    convertDateTime(val) {
      console.log('date val', val);
      return new DateTime.fromISO(val).toLocaleString(DateTime.DATETIME_MED);
    },
    onEarnReward() {
      const vm = this;
      this.earnReward({
        bid: this.$route.params.id,
        uid: this.$socket.client.auth.userID,
      }).then((visitedOn) => {
        const dates = visitedOn.map((v) => this.convertDateTime(v));
        const msg = `<p>You are earning <strong> ${
          vm.$route.params.id
        }</strong> Reward points with these ${
          dates.length
        } visits:</p>${dates.join('<br/>')}`;
        console.log('rewards:', msg);
        vm.rewardPointsMessage = msg;
        vm.rewardPoints = true;
      });
    },
    onApproved() {
      const biz = this.business;
      const address = this.address;
      const country = address.slice(address.lastIndexOf(',') + 2);
      // TODO update country from address
      const oid = this.$socket.client.auth.userID;
      const confirmedAddress = this.confirmedAddress;
      console.log(biz, address, country, oid, confirmedAddress);
      this.updateSponsor({
        biz,
        oid,
        address,
        country,
        confirmedAddress,
      });

      this.confSnackbar = false;
      this.printing = true;
    },

    printMe() {
      this.preview = true;
      window.print();
    },
    stopPrint() {
      this.preview = false;
      // this.printing = false;
    },

    getPlaceID() {
      const address = `${this.business} ${this.address}`;
      const vm = this;
      this.emitFromClient(
        'getPlaceID',
        { address, country: this.country },
        ({ formatted_address, place_id }) => {
          vm.confirmedAddress = place_id;
          vm.address = formatted_address;
          vm.confirmationMessage = `<p>Google found this address:<br/> ${formatted_address}
          <p>If <strong>correct</strong>, your place_id is:<br/> ${place_id}</p> 
          <p>If not, enter an address with more detail.</p>`;
          vm.confSnackbar = true;
        }
      );
    },
    emitFromClient(eventName, data, ack) {
      this.$socket.client.emit(eventName, data, ack);
    },
    // closeSnackbar() {
    //   this.showMe = false;
    // },
    addSponsor() {
      // get the Stream ID for the biz and the ID of the biz owner
      const biz = this.business;
      const address = this.address;
      // TODO update country from address
      const oid = this.$socket.client.auth.userID;
      const confirmedAddress = this.confirmedAddress;
      console.log(biz, address, oid, confirmedAddress);

      this.updateSponsor({ biz, oid, address, confirmedAddress });
      this.registered = true;
      this.$vuetify.goTo(this.$refs.printDiv, this.options);
    },

    
  },
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
  },

  mounted() {
    if (this.$route.params.id) {
      this.onEarnReward();
    } else {
      this.printing = this.confirmedAddress;
      // set valid false here so the Register btn is disabled
      this.valid = false;
    }
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
</style>
