<template>
  <v-container>
    <v-sheet
      class="overflow-x:hidden fill-height"
      outlined
      color="grey lighten-1"
      max-width="500"
    >
      <v-container fluid class="fill-height">
        <!-- Header -->
        <v-row no-gutters justify="space-between"
          ><v-col cols="7" sm="8">
            <v-card-title class="text-subtitle-1 text-sm-h5"
              >TQR Loyalty Service</v-card-title
            >
            <v-card-subtitle>Customer View</v-card-subtitle>
            <v-card-text class="text-caption">
              Your Device ID: {{ userID }}</v-card-text
            >
          </v-col>
          <v-col cols="auto" class="text-center">
            <VueQRCodeComponent
              id="qr"
              ref="qr"
              :text="encodedUri"
              error-level="L"
              :size="qrSize"
            >
            </VueQRCodeComponent>
            <span class="text-caption text-sm-body-2">For Redemption</span>
          </v-col>
        </v-row>

        <!-- Promotions -->
        <vcard>
          <v-card-title class="pb-1"
            >Enticements to bring you In...</v-card-title
          >
          <v-row
            ><v-col>
              <v-card color="blue-grey darken-2" class="mx-auto mobile" dark>
                <v-card-title>Active Sponsors: </v-card-title>
                <v-card-text>
                  <v-row>
                    <v-col cols="4">
                      <v-select
                        v-model="country"
                        :items="countries"
                        label="Country"
                        outlined
                    /></v-col>
                    <v-col cols="8">
                      <v-select
                        v-model="selectedSponsor"
                        :items="activeSponsors"
                        item-text="biz"
                        item-value="ssid"
                        return-object
                        label="Check enticements from:"
                        outlined
                      ></v-select>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- Enticements -->
          <v-row>
            <v-col>
              <v-card
                ref="enticements"
                color="blue-grey darken-2"
                class="mx-auto"
                dark
              >
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
                      <v-row
                        class="fill-height"
                        align="center"
                        justify="center"
                      >
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
        </vcard>

        <vcard>
          <v-card-title class="pb-4">...Rewards to bring you back</v-card-title>
          <!-- Rewards -->
          <v-row v-if="hasRewards"
            ><v-col>
              <v-card
                v-model="rewardPoints"
                color="blue-grey darken-2"
                class="mx-auto"
                dark
              >
                <v-card-title>TQR Rewards</v-card-title>
                <v-card-subtitle
                  >Scan Sponsor's QR Code to earn rewards</v-card-subtitle
                >
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
                        v-model="selectedReward"
                        :items="getRewardingSponsors"
                        item-text="biz"
                        item-value="sid"
                        return-object
                        label="Rewarding Sponsors"
                        :hint="selectedRewardSid"
                        persistent-hint
                    /></v-col>
                    <v-col>
                      <v-simple-table>
                        <template v-slot:default>
                          <thead>
                            <tr>
                              <th id="promo" style="bgcolor: grey">
                                Reward ID
                              </th>
                              <th id="from" style="bgcolor: grey">Earned On</th>
                              <th id="promo" style="bgcolor: grey">
                                Sponsor ID
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr
                              v-for="item in sponsorRewards"
                              :key="item.rid"
                              v-touch="{ right: () => deleteReward(item.rid) }"
                            >
                              <td style="text-align: left">{{ item.rid }}</td>
                              <td style="text-align: left">
                                {{ getDateFromRid(item.rid) }}
                              </td>
                              <td style="text-align: left">{{ item.sid }}</td>
                            </tr>
                          </tbody>
                        </template>
                      </v-simple-table>
                    </v-col>
                  </v-row>
                  <v-row no-gutters justify="center">
                    <v-col cols="auto">
                      <v-card-text
                        v-html="rewardMsg"
                        class="text-caption"
                      ></v-card-text
                    ></v-col>
                  </v-row>
                </v-card-text>
                <v-card-actions>
                  <v-spacer />
                  <v-btn text color="yellow" @click="earnTokens"
                    >Earn more tokens</v-btn
                  >
                </v-card-actions>
              </v-card>
            </v-col></v-row
          >
          <v-row v-else>
            <v-card>
              <v-card-title>TQR Rewards Info</v-card-title>
              <v-card-subtitle
                >Here's how you can earn loyalty rewards</v-card-subtitle
              >
              <v-card-text
                >Participating Sponsors have TQR cards in their establishments.
                You earn points when you scan the QR codes.
              </v-card-text>
              <v-card-text>
                This section of the app shows you where you are earning points
                and how many you've accumlated.</v-card-text
              >
              <v-card-text
                >Soon, TQR will enable Sponsors to scan your personal QR code so
                you can to redeem these loyalty points all across your fair
                city.</v-card-text
              >
            </v-card>
          </v-row>
        </vcard>
        <!-- Footer card -->
        <v-row no-gutters justify="space-between" class="pt-5">
          <v-col>
            <span class="text-caption text-left"> TQR Ver: {{ $version }}</span>
          </v-col>

          <v-col cols="1">
            <v-icon
              >{{ isConnected ? 'mdi-lan-connect' : 'mdi-lan-disconnect' }}
            </v-icon>
          </v-col>
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
    rewardingSponsors: Function,
    getSponsorRewards: Function,
    getPointsFromCustomer: Function,
    redeemReward: Function,
    audit: Function,
  },
  components: {
    VueQRCodeComponent,
    ConfirmationSnackbar,
  },
  computed: {
    selectedRewardSid() {
      return `ID: ${this.selectedReward.sid}`;
    },
    sponsorRewards() {
      return this.getSponsorRewards(this.selectedReward.sid);
    },
    hasRewards() {
      return !isEmpty(this.getRewardingSponsors);
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
      const width =
        this.$vuetify.breakpoint.width < 500
          ? this.$vuetify.breakpoint.width
          : 500;
      const cols = 3;
      return width * (cols / 12);
    },

    rewardingSponsor() {
      // using select
      return this.selectedReward; // using treeview: head(this.tree);
    },

    rewardUri() {
      return `?cid=${this.userID}&points=${this.sponsorRewards.length}`;
    },

    encodedUri() {
      return encodeURI(`${window.location.origin}/sponsor/${this.rewardUri}`);
    },

    rewardMsg() {
      return this.rewardingSponsor
        ? `<strong>${this.rewardingSponsor.biz}</strong> will redeem your reward using<br/>${this.encodedUri}`
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
      countries: [],
      country: '',
      toast: false,
      toastText: 'You are redeemed',
      toastButton: 'Thanks',
      selectedReward: { biz: '', sid: '', ssid: '' },
      searchable: false,
      origin: window.location.origin,
      selectedSponsor: { biz: '', uid: '', ssid: '' },
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
    rewardRedeemed(rsid) {
      // remove uid from Reward
      this.redeemReward(rsid);
      this.toastText = `Reward ${rsid} is redeemed.`;
      // TODO extend setting with result of redeem instead of hardwired true
      this.toast = true;
    },
    // final step in rewards handshake protocol
    doingBusinessWith({ rid, sid, biz }) {
      const msg = `Added reward points from`;
      this.confirmationTitle = msg;
      this.confirmationMessage = `${biz} (${sid}) in ${this.country} <br/>Reward Stream ID: ${rid}`;
      this.confSnackbar = true;
      // now add the uid/name to the items array
      this.getRewardPointsFor({ sid });
      // now add the uid to local storage
      this.callUpdateRewardPoints({ rid, sid, biz });
      this.selectedReward = head(this.getRewardingSponsors);
    },

    newPromotion({ biz, promoText }) {
      this.confirmationTitle = "A Sponsor's New Promotion";
      this.confirmationMessage = `<h5>From ${biz}:</h5><span>${promoText}</span>`;
      this.confSnackbar = true;
    },
  },

  methods: {
    getDateFromRid(rid) {
      return getDateFromSid(rid);
    },
    deleteReward() {
      const sid = this.selectedReward.sid;
      // remove uid from Reward
      this.redeemReward(sid)
        .then((result) => {
          this.toastText = `${result.sid} deleted from local storage.`;
          this.toast = true;
        })
        .then(() => (this.selectedReward = { biz: '', sid: '' }))
        .catch((e) => {
          this.toastText = e;
          this.toast = true;
        });
    },
    offerHandshake({ sid, transaction }) {
      this.emitFromClient(
        'offerHandshake',
        {
          cid: this.userID,
          sid,
          transaction,
        },
        (ack) => console.log('ack :>> ', ack)
      );
    },

    closeSnackbar() {
      this.confSnackbar = false;
      this.getSponsors(this.country);
    },

    getRewardPointsFor({ sid }) {
      const cid = this.userID;
      this.getRewardPoints({ sid, cid }).then((visits) => {
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

    getPromos() {
      this.promos = [];
      const ssid = this.selectedSponsor.ssid;
      const country = this.country;
      const key = `tqr:${country}:${ssid}:promos`;
      this.emitFromClient('getPromotions', key, (promos) => {
        this.promotions = promos ?? [];
        console.log(`promotions`, printJson(this.promotions));
      });
    },

    renderPromos() {
      this.promos = this.promotions.length
        ? this.promotions.map((v) => {
            return {
              color: v.color,
              msg: `<h3>At ${v.biz}</h3><p class="text-subtitle-2 pt-3">${v.promoText}</p>`,
            };
          })
        : [
            {
              color: 'red',
              msg: `<h3>No enticements from ${this.selectedSponsor.biz} at this time.</h3> Try again, later...`,
            },
          ];
    },

    onEarnReward() {
      const vm = this;
      // see Model.vue
      this.earnReward({
        uid: this.$route.params.id,
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
    getCountries() {
      const self = this;
      this.emitFromClient('getCountries', null, (countries) => {
        console.log('countries :>> ', printJson(countries));
        self.countries = countries;
        self.countries = [...head(countries)];
        self.country = head(self.countries);
        console.log('country :>> ', self.country);
      });
    },

    getSponsors(country) {
      this.emitFromClient('getSponsors', country, (sponsors) => {
        console.log('sponsors :>> ', printJson(sponsors));
        this.activeSponsors = sponsors;
        this.selectedSponsor = head(this.activeSponsors);
      });
    },
  }, // end of Methods

  watch: {
    country(country) {
      this.getSponsors(country);
    },

    selectedSponsor(sponsor) {
      this.$vuetify.goTo(this.$refs.enticements, this.options);
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
    this.getCountries();
    const sid = this.$route.params.id;
    // if this url is .../customer/<sponsor uid>
    // the first step is to have offerHandshake provide Sponsor with cid
    if (sid) {
      this.offerHandshake({ sid, transaction: 'earn points' });
    }

    this.selectedReward = head(this.getRewardingSponsors);
    console.log('CUSTOMER mounted with Sponsor', this.selectedReward.sid);
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
