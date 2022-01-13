<template>
  <v-container>
    <v-sheet
      class="overflow-x:hidden fill-height"
      outlined
      color="grey lighten-1"
      max-width="500"
    >
      <v-container fluid class="fill-height">
        <v-row no-gutters
          ><v-col cols="8">
            <v-card-title class="text-sm-h5 text-xs-subtitle-1"
              >TQR Loyalty Tracking</v-card-title
            >
            <v-card-subtitle>Customer View</v-card-subtitle>
            <v-card-text class="text-caption">
              Your user ID:
              {{ userID }}</v-card-text
            >
          </v-col>
          <v-col v-if="rewardingSponsor" cols="auto" class="text-center">
            <VueQRCodeComponent
              id="qr"
              ref="qr"
              :text="encodedUri"
              error-level="L"
              :size="qrSize"
            >
            </VueQRCodeComponent>
            Sponsor will scan your QR code
          </v-col>
        </v-row>

        <v-row
          ><v-col>
            <v-card color="blue-grey darken-2" class="mx-auto" dark>
              <v-card-title>Active Sponsors: </v-card-title>
              <v-select
                v-model="selectedSponsor"
                :items="activeSponsors"
                label="Select a Sponsor to see Promotions"
                outlined
              ></v-select>
            </v-card>
          </v-col>
        </v-row>
        <v-row
          ><v-col>
            <v-card
              v-model="rewardPoints"
              color="blue-grey darken-2"
              class="mx-auto"
              dark
            >
              <v-card-title>TQR Rewards</v-card-title>
              <div v-if="searchable">
                <v-card-subtitle
                  >Click a Sponsor to claim your reward</v-card-subtitle
                >
                <v-card-text>
                  <v-row>
                    <v-text-field
                      v-model="search"
                      label="Search visited establishments here"
                      dark
                      flat
                      solo-inverted
                      hide-details
                      clearable
                    ></v-text-field>
                    <v-checkbox
                      v-model="caseSensitive"
                      dark
                      hide-details
                      class="text-caption"
                      append-icon="mdi-case-sensitive-alt"
                    ></v-checkbox>
                  </v-row>
                </v-card-text>
                <v-card-text>
                  <v-divider />
                  <v-treeview
                    v-model="tree"
                    :items="items"
                    :search="search"
                    :filter="filter"
                    selectable
                    open-all
                    open-on-click
                    return-object
                    dense
                    dark
                    selected-color="green darken-1"
                    color="green lighten-1"
                  >
                  </v-treeview>
                </v-card-text>
              </div>
              <v-card-text v-else>
                <v-row
                  ><v-col cols="6">
                    <v-select
                      :items="getRewardingSponsors"
                      item-text="biz"
                      item-value="bid"
                      return-object
                      v-model="selectedReward"
                  /></v-col>
                  <v-col>
                    <v-text-field
                      v-model="selectedReward.bid"
                      label="Business ID"
                      readonly
                      dense
                    />
                    <v-text-field
                      v-model="dateFromSid"
                      label="Last visit on"
                      readonly
                      dense
                    />
                    <v-text-field
                      v-model="selectedReward.points"
                      label="Reward Points"
                      readonly
                      dense
                    />
                  </v-col>
                </v-row>
              </v-card-text>
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
        <v-row>
          <v-col>
            <v-card color="blue-grey darken-2" class="mx-auto" dark>
              <v-row>
                <v-col>
                  <v-card-title>Enticements</v-card-title>
                </v-col>
              </v-row>

              <v-carousel
                cycle
                height="200"
                hide-delimiter-background
                show-arrows-on-hover
              >
                <v-carousel-item v-for="(promo, i) in promos" :key="i">
                  <v-sheet dark :color="promo.color" height="100%">
                    <v-row class="fill-height" align="center" justify="center">
                      <v-card-text
                        class="text-center"
                        v-html="promo.msg"
                      ></v-card-text>
                    </v-row>
                  </v-sheet>
                </v-carousel-item>
              </v-carousel>
            </v-card>
          </v-col>
        </v-row>

        <!-- Footer card -->
        <v-row no-gutters justify="space-between" class="mt-2">
          <v-col>
            <span class="text-caption text-left"> TQR Ver: {{ $version }}</span>
          </v-col>

          <v-col cols="1">
            <v-icon
              >{{ isConnected ? 'mdi-lan-connect' : 'mdi-lan-disconnect' }}
            </v-icon>
          </v-col>
        </v-row>
        <v-row no-gutters justify="center">
          <v-col cols="auto">
            <v-card-text v-html="rewardMsg" class="text-caption"></v-card-text
          ></v-col>
        </v-row>
      </v-container>
    </v-sheet>

    <confirmation-snackbar
      v-if="confSnackbar"
      :centered="true"
      :top="true"
      :confirmationTitle="confirmationTitle"
      :confirmationMessage="confirmationMessage"
      :confirmationIcon="local_offer"
      @disapprove="closeSnackbar"
    />
  </v-container>
</template>

<script>
import ConfirmationSnackbar from './prompts/confirmationSnackbar.vue';
import VueQRCodeComponent from 'vue-qr-generator';

import * as easings from 'vuetify/lib/services/goto/easing-patterns';
import { DateTime } from '@/utils/luxonHelpers';
import { getDateFromSid } from '../../srv/utils';
import { printJson, head, isEmpty } from '@/utils/helpers';
export default {
  name: 'CustomerView',
  props: {
    isConnected: Boolean,
    state: Object,
    getRewardPoints: Function,
    earnReward: Function,
    callUpdateRewardPoints: Function,
    rewardMap: Function,
    rewardingSponsors: Function,
  },
  components: {
    VueQRCodeComponent,
    ConfirmationSnackbar,
  },
  computed: {
    dateFromSid() {
      if (isEmpty(this.selectedReward.sid)) {
        return;
      }
      return getDateFromSid(this.selectedReward.sid);
    },
    getRewardingSponsors() {
      const s = this.rewardingSponsors();
      console.log('rewardingSponsors', printJson(s));
      return s;
    },
    userID() {
      return this.$socket.client.auth.userID;
    },

    qrSize() {
      const width = 500;
      const cols = 3;
      return width * (cols / 12);
    },

    rewardingSponsor() {
      // using select
      return this.selectedReward; // using treeview: head(this.tree);
    },

    rewardUri() {
      // TODO extend this for dynamic points taken from Reward
      return `?cid=${this.userID}&points=1`;
    },

    encodedUri() {
      return encodeURI(`${window.location.origin}/sponsor/${this.rewardUri}`);
    },

    rewardMsg() {
      return this.rewardingSponsor
        ? `${this.rewardingSponsor.biz} will redeem your reward using<br/>${this.encodedUri}`
        : 'Still working on earning rewards...';
    },

    colors() {
      return head(this.tree) ? ['amber'] : this.mixedColors;
    },
    filter() {
      return this.caseSensitive
        ? (item, search, textKey) => item[textKey].indexOf(search) > -1
        : undefined;
    },
    settings() {
      return this.state?.settings;
    },

    disableRegistration() {
      return this.biz || this.address;
    },

    // TODO Why is this here?
    decodedUri() {
      const b = encodeURIComponent(this.business);
      return `${window.location.origin}/sponsor/${b}`;
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
      selectedReward: { biz: '', bid: '' },
      searchable: false,
      origin: window.location.origin,
      selectedSponsor: '',
      activeSponsors: [],
      annoyed: false,
      activeNodes: [],
      tree: [],
      search: null,
      caseSensitive: false,
      defaultColors: ['black', 'goldenrod'],
      mixedColors: [
        'indigo',
        'warning',
        'pink darken-2',
        'red lighten-1',
        'deep-purple accent-4',
      ],
      promos: [],
      promotions: [],
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
      confirmationTitle: "A Sponsor's New Promotion",
      confirmationMessage: '',
      confirmationIcon: 'local_offer',
      countries: ['SG', 'UK', 'USA'],

      country: '',

      registered: this.sponsor?.biz ?? false,
      snackBtnText: '',
      snackBarMessage: 'Ready to get started?',
      snackBarActionIndex: 0,
      confirmation: null,
      duration: 300,
      offset: 0,
      easing: 'easeInOutCubic',
      easings: Object.keys(easings),
      items: [],
    };
  },
  sockets: {
    rewardRedeemed() {
      alert('You are redeemed');
    },
    // final step in rewards handshake protocol
    doingBusinessWith({ bid, biz, country, sid }) {
      const msg = `Earned reward points with ${biz} (${bid}) in ${country} `;
      this.confirmationTitle = msg;
      this.confirmationMessage = `Transaction ID: ${sid}`;
      this.confSnackbar = true;
      // now add the bid/name to the items array
      this.getRewardPointsFor(bid);
      // now add the bid to local storage
      this.callUpdateRewardPoints({ bid, biz, sid });
    },

    newPromotion({ biz, promoText }) {
      this.confirmationTitle = "A Sponsor's New Promotion";
      this.confirmationMessage = `<h5>From ${biz}:</h5><span>${promoText}</span>`;
      this.confSnackbar = true;
    },
  },

  methods: {
    offerHandshake({ bid, transaction }) {
      this.emitFromClient(
        'offerHandshake',
        {
          cid: this.userID,
          bid,
          transaction,
        },
        (ack) => console.log('ack :>> ', ack)
      );
    },

    closeSnackbar() {
      this.confSnackbar = false;
      this.getSponsors();
    },

    getRewardPointsFor(bid) {
      const cid = this.userID;
      this.getRewardPoints({ bid, cid }).then((visits) => {
        if (isEmpty(visits)) {
          return;
        }
        let i = 0;
        Object.entries(visits).forEach(([key, value]) => {
          this.items.push({
            name: key,
            children: value.map((v, idx) => {
              return {
                id: `${++i}.${idx}`,
                name: v.dated,
              };
            }),
          });
        });
        console.log('items', this.items);
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

    emitFromClient(eventName, data, ack) {
      this.$socket.client.emit(eventName, data, ack);
    },

    getPromos(biz, rewards = false) {
      this.promos = [];
      const country = this.country;
      console.log(`getPromotions({${biz},${country}}`);
      this.emitFromClient('getPromotions', { biz, country }, (promos) => {
        if (rewards) {
          promos.push({
            business: biz,
            promoText: 'Reward',
            color: 'amber darken-2',
          });
        }
        this.promotions = promos;
        console.log(`promotions`, printJson(this.promotions));
      });
    },

    renderPromos() {
      console.log('this.promotions.length :>> ', this.promotions.length);
      this.promos = this.promotions.length
        ? this.promotions.map((v) => {
            return {
              color: v.color,
              msg: `<h3>At ${v.business}</h3><p class="text-subtitle-2 pt-3">${v.promoText}</p>`,
            };
          })
        : [
            {
              color: 'red',
              msg: `<h3>No enticements from ${this.selectedSponsor} at this time.</h3> Try again, later...`,
            },
          ];
    },

    onEarnReward() {
      const vm = this;
      // see Model.vue
      this.earnReward({
        bid: encodeURIComponent(this.$route.params.id),
        uid: this.userID,
      }).then((rewards) => {
        const dates = rewards.map((v) => this.convertDateTime(v));

        // Jason wanted to wait on mentioning tokens.
        const tokenMsg = `<p>Out of ${rewards.length} visit${
          rewards.length > 1 ? 's' : ''
        }, you are earning <strong> ${
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
    getSponsors() {
      this.emitFromClient('getSponsors', 'usa', (sponsors) => {
        console.log('sponsors :>> ', sponsors);
        this.activeSponsors = isEmpty(sponsors) ? [] : sponsors;
      });
    },
  }, // end of Methods

  watch: {
    // selectedReward(sponsor) {
    //   this.rewardDetails = printJson(sponsor);
    // },
    selectedSponsor(sponsor) {
      this.getPromos(sponsor);
    },
    tree(n, o) {
      if (isEmpty(n)) {
        this.promos = [];
        return;
      }
      console.log('n[0] :>> ', n[0]);
      console.log('o[0] :>> ', o[0]);
      this.getPromos(n[0].biz, true);
    },
    promotions(val) {
      this.renderPromos(val);
    },
  },

  mounted() {
    this.getSponsors();
    // if this url is .../customer/<sponsor uid>
    // the first step is to ensure Sponsor is online with a handshake
    if (this.$route.params.id) {
      const bid = this.$route.params.id;
      this.offerHandshake({ bid, transaction: 'earn points' });
    }
    // TODO refactor if we use local storage for visits
    this.getRewardPointsFor();

    console.log('CUSTOMER mounted');
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
