<template>
  <v-container>
    <v-sheet
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
        <!-- <v-row dense justify="center"
          ><v-col>
            <span class="text-caption">
              {{ $route.params.id }}'s Confirmed Address:
              {{ confirmedAddress }}</span
            >
          </v-col></v-row
        > -->
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
              <!-- <v-treeview :items="items"></v-treeview> -->

              <v-card class="mx-auto" max-width="500">
                <v-sheet class="pa-4 primary lighten-2">
                  <v-text-field
                    v-model="search"
                    label="Search Visited Establishments"
                    dark
                    flat
                    solo-inverted
                    hide-details
                    clearable
                    clear-icon="mdi-close-circle-outline"
                  ></v-text-field>
                  <v-checkbox
                    v-model="caseSensitive"
                    dark
                    hide-details
                    label="Case sensitive search"
                  ></v-checkbox>
                </v-sheet>
                <v-card-text>
                  <v-treeview :items="items" :search="search" :filter="filter">
                    <template v-slot:prepend="{ item }">
                      <v-icon
                        v-if="item.children"
                        v-text="
                          `mdi-${
                            item.id === 1 ? 'home-variant' : 'folder-network'
                          }`
                        "
                      ></v-icon>
                    </template>
                  </v-treeview>
                </v-card-text>
              </v-card>

              <!-- <v-simple-table height="300px" dense dark>
                <template v-slot:default>
                  <tbody>
                    <tr v-for="(item, i) in dates" :key="i">
                      <td>{{ item }}</td>
                    </tr>
                  </tbody>
                </template>
              </v-simple-table> -->
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
import * as easings from 'vuetify/lib/services/goto/easing-patterns';
import { DateTime, formatSmallTime } from '@/utils/luxonHelpers';
import { printJson } from '@/utils/helpers';
export default {
  name: 'CustomerView',
  props: {
    isConnected: Boolean,
    state: Object,
    getRewardPoints: Function,
    earnReward: Function,
  },
  computed: {
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

    decodedUri() {
      const b = encodeURIComponent(this.business);
      const d = `${window.location.origin}/sponsor/${b}`;
      return d;
    },

    welcome() {
      const msg = this.isSponsor
        ? 'Welcome to Universal TQR Loyalty Tracking'
        : `Welcome to the ${this.$route.params.id} Community`;

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
      visits: null,
      search: null,
      caseSensitive: false,
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
      items: [
        {
          id: 1,
          name: 'Fika :',
          children: [
            { id: 2, name: formatSmallTime(1640371630838) },
            { id: 3, name: formatSmallTime(1640371630840) },
            { id: 4, name: formatSmallTime(1640371630899) },
          ],
        },
        {
          id: 5,
          name: 'Tomahawk:',
          children: [
            { id: 2, name: formatSmallTime(1640373330938) },
            { id: 3, name: formatSmallTime(1640373330840) },
            { id: 4, name: formatSmallTime(1640373330899) },
          ],
        },
      ],
    };
  },

  methods: {
    onGetRewardPoints() {
      // const vm = this;
      const uid = this.$socket.client.auth.userID;
      this.getRewardPoints({ bid: '', uid }).then((visitedOn) => {
        console.log(printJson(visitedOn));
        // const dates = visitedOn.map((v) => this.convertDateTime(v));
        // this.dates = dates;
        // vm.rewardPointsMessage = `Here ${
        //   dates.length === 1 ? 'is' : 'are'
        // } your ${dates.length} visit${
        //   dates.length > 1 ? 's' : ''
        // } to <strong> ${vm.$route.params.id}</strong>:`;
        // vm.rewardPoints = true;
      });
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

    emitFromClient(eventName, data, ack) {
      this.$socket.client.emit(eventName, data, ack);
    },
  }, // end of Methods

  watch: {
    promotions(val) {
      this.renderPromos(val);
    },
  },

  mounted() {
    if (this.$route.params.id) {
      this.onEarnReward();
    } else {
      this.onGetRewardPoints();
    }

    // TODO refactor to restaurant based promotions (within a country)
    // this.emitFromClient(
    //   'getPromotions',
    //   this.country,
    //   (promos) => (this.promotions = promos)
    // );

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
