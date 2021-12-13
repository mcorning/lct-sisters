<template>
  <v-container fluid>
    <v-card max-width="500">
      <v-form ref="form" v-model="valid" lazy-validation>
        <v-card-title class="text-subtitle-2">{{ welcome }}</v-card-title>
        <v-card-text v-html="message"> </v-card-text>
        <v-divider />
        <v-card-text>
          <v-text-field
            v-model="business"
            :counter="30"
            :rules="nameRules"
            label="Your business name"
            required
            clearable
          ></v-text-field>
          <v-text-field
            v-model="address"
            :rules="nameRules"
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
            Validate Business
          </v-btn>

          <v-btn color="error" class="mr-4" @click="reset">
            Reset Form
          </v-btn>
        </v-card-actions>
      </v-form>

      <div v-if="registered">
        <v-card-title class="text-h6"
          >To see a preview of your QR card...</v-card-title
        >
        <v-card-subtitle>...press the Print button below</v-card-subtitle>
      </div>
      <div ref="printDiv">
        <v-card-text v-if="registered" class="text-center">
          <div id="targetDiv" ref="targetDiv" class="text-center">
            <v-card-text v-html="message"> </v-card-text>
            <v-row v-if="printing"
              ><v-col
                ><p>
                  Scan this QR code to access our
                  <strong>{{ business }} Customer Rewards</strong> app.
                </p>
                <p>
                  Each time you access the app, you earn points for future
                  discounts.
                </p></v-col
              ></v-row
            >
            <v-row>
              <v-spacer />
              <v-col class="text-center">
                <VueQRCodeComponent
                  id="qr"
                  ref="qr"
                  :text="decodedUri"
                  error-level="L"
                >
                </VueQRCodeComponent>
              </v-col>
              <v-spacer />
              {{ decodedUri }}
            </v-row>
          </div>

          <v-card-actions v-if="printing">
            <v-row>
              <v-btn text color="primary" plain @click="printing = false"
                >Cancel</v-btn
              >
              <v-spacer />
              <v-btn text color="primary" plain @click="printMe">Print</v-btn>
            </v-row>
          </v-card-actions>
        </v-card-text>
      </div>
      <confirmation-snackbar
        v-if="confSnackbar"
        :centered="true"
        :top="false"
        :confirmationTitle="confirmationTitle"
        :confirmationMessage="confirmationMessage"
        :confirmationIcon="confirmationIcon"
        :canApprove="true"
        @approved="onApproved"
        @disapprove="confSnackbar = false"
      />

      <v-snackbar
        v-model="showMe"
        centered
        timeout="-1"
        height="100px"
        color="blue-grey darken-3"
      >
        <v-card-text v-html="snackBarMessage" />
        <v-btn
          v-if="snackBtnText"
          text
          color="#00f500"
          @click.stop="snackBarAction"
        >
          {{ snackBtnText }}
        </v-btn>
      </v-snackbar>

      <v-snackbar
        v-model="rewardPoints"
        centered
        top
        timeout="-1"
        color="blue-grey darken-3"
        vertical
        multi-line
      >
        <v-card-title class="text-subtitle-1">Well Done</v-card-title>
        <v-card-text v-html="rewardPointsMessage" />
        <!-- <template v-slot:action="{ attrs }"> -->
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
        <!-- </template> -->
      </v-snackbar>
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
  name: 'SponsorView',
  // sponsor is {sid,biz}
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
    snackBarAction() {
      const action =
        this.snackBarActionIndex === 0 ? this.addSponsor : this.closeSnackbar;
      return action;
    },
    decodedUri() {
      const d = `${window.location.origin}/sponsor/${this.business}`;
      return d;
    },
    sponsorName() {
      return this.sponsor.biz;
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
      const msg = this.$route.params.id
        ? `Welcome to the ${this.$route.params.id} Community`
        : 'Welcome to our Community of Communities';

      return msg;
    },
    message() {
      const msg = this.newSponsor
        ? 'You can now connect with your customers while protecting their privacy.'
        : 'You join our community without sharing any personal identifying information. This gives us the ability to communicate opportunities and news about us.';
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
      valid: false,
      name: '',
      nameRules: [
        (v) => !!v || 'Name is required',
        (v) => (v && v.length <= 10) || 'Name must be less than 10 characters',
      ],
      email: '',
      emailRules: [
        (v) => !!v || 'E-mail is required',
        (v) => /.+@.+\..+/.test(v) || 'E-mail must be valid',
      ],
      select: null,
      items: ['Item 1', 'Item 2', 'Item 3', 'Item 4'],
      checkbox: false,

      rewardPoints: false,
      rewardPointsMessage: '',
      confSnackbar: false,
      confirmationTitle: 'Address Confirmation',
      confirmationMessage: '',
      confirmationIcon: 'question_mark',
      place_id: '',
      countries: ['SG', 'UK', 'US'],
      country: '',
      business: this.sponsor?.biz ?? '',
      address: '',
      registered: this.sponsor?.sid ?? false,
      snackBtnText: 'ok',
      snackBarMessage: 'Ready to get started?',
      snackBarActionIndex: 0,
      confirmation: null,
      showMe: false,
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
        const msg = `<p>You are earning ${
          vm.$route.params.id
        } Reward points with these visits:</p>${dates.join('<br/>')}`;
        console.log('rewards:', msg);
        vm.rewardPointsMessage = msg;
        vm.rewardPoints = true;
      });
    },
    onApproved() {
      this.confSnackbar = false;
      this.addSponsor();
    },
    onPrintQR() {
      this.printing = true;
    },
    printMe() {
      //  this.preview = true;
      window.print();
    },

    getPlaceID() {
      const address = `${this.business} ${this.address}`;
      const vm = this;
      this.emitFromClient(
        'getPlaceID',
        { address, country: this.country },
        ({ formatted_address, place_id }) => {
          vm.place_id = place_id;
          vm.confirmationMessage = `<p>Google found this address based on what you entered:<br/> ${formatted_address}
          <p>If this is <strong>correct</strong>, your business place_id is: ${place_id}.</p> 
          <p>If not, enter an address with more detail.</p>`;
          vm.confSnackbar = true;
        }
      );
    },
    emitFromClient(eventName, data, ack) {
      this.$socket.client.emit(eventName, data, ack);
    },
    closeSnackbar() {
      this.showMe = false;
    },
    addSponsor() {
      // get the Stream ID for the biz and the ID of the biz owner
      const biz = this.business;
      const oid = this.$socket.client.auth.userID;
      const place_id = this.place_id;
      console.log(biz, oid, place_id);

      const eventName = 'addSponsor';
      this.emitFromClient(eventName, { biz, oid, place_id }, (sid) => {
        this.updateSponsor({ biz, sid, place_id });
        this.snackBarMessage = `Your Sponsor ID: ${sid}`;
        this.snackBarActionIndex = 1;
        this.showMe = true;
        this.registered = true;
      });

      this.showMe = false;
      this.$vuetify.goTo(this.$refs.printDiv, this.options);
    },

    addVisit() {
      const sid = this.$route.params.id;
      const uid = this.$socket.client.auth.userID;

      if (!sid || !uid) {
        console.log(
          `Insufficient parameters: sid provided ${sid} uid provided ${uid}`
        );
        return;
      }

      const eventName = 'addVisit';
      // get the Stream ID for the biz and the ID of the biz owner
      console.log(sid, uid);
      this.emitFromClient(eventName, { sid, uid }, (res) => {
        this.snackBarMessage = res;
        this.snackBarActionIndex = 1;
        this.showMe = true;
      });

      this.registered = true;
      this.showMe = false;
      this.$vuetify.goTo(this.$refs.printDiv, this.options);
    },

    getVisits() {
      const biz = this.business;

      if (!biz) {
        console.log(`Missing biz`);
        return;
      }

      const eventName = 'getVisits';
      // get the Stream ID for the biz and the ID of the biz owner
      console.log(biz);
      this.emitFromClient(eventName, biz, (res) => {
        this.snackBarMessage = res;
        this.snackBarActionIndex = 1;
        this.showMe = true;
      });

      this.registered = true;
      this.showMe = false;
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
    }
    console.log('SPONSOR mounted');
    // set valid false here so the Register btn is disabled
    this.valid = false;
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
