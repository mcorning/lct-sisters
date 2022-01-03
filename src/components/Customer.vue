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
          ><v-col>
            <v-card-title>TQR Loyalty Tracking</v-card-title>
            <v-card-subtitle
              >Here are you recent visits to TQR supporting
              establishments:</v-card-subtitle
            >
          </v-col></v-row
        >

        <v-row
          ><v-col>
            <v-card
              v-model="rewardPoints"
              color="blue-grey darken-3"
              class="mx-auto"
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
                    label="Case sensitive"
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
        <v-card-text class="text-h5">Enticements</v-card-text>

        <v-carousel
          cycle
          height="200"
          hide-delimiter-background
          show-arrows-on-hover
          dark
        >
          <v-carousel-item v-for="(promo, i) in promos" :key="i">
            <v-sheet dark :color="colors[i]" height="100%">
              <v-row class="fill-height" align="center" justify="center">
                <v-card-text v-html="promo"></v-card-text>
              </v-row>
            </v-sheet>
          </v-carousel-item>
        </v-carousel>
      </v-container>
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
import { DateTime } from '@/utils/luxonHelpers';
import { printJson, isEmpty } from '@/utils/helpers';
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
      return `${window.location.origin}/sponsor/${b}`;
    },

    welcome() {
      return this.isSponsor
        ? 'Welcome to Universal TQR Loyalty Tracking'
        : `Welcome to the ${this.$route.params.id} Community`;
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
      activeNodes: [],
      tree: [],
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
      items: [],
    };
  },

  methods: {
    onGetRewardPoints() {
      const uid = this.$socket.client.auth.userID;
      this.getRewardPoints({ bid: '', uid }).then((visits) => {
        console.log('Visits:>>', printJson(visits));
        this.items = visits.map((visit, i) => {
          const biz = visit[0].replace(/_/g, ' ');
          return {
            id: i,
            name: biz,
            children: visit[1].map((v, idx) => {
              return {
                id: `${i}.${idx}`,
                name: v.visitedOn,
                biz,
              };
            }),
          };
        });
        console.log('Items', printJson(this.items));
      });
    },

    onEarnReward() {
      const vm = this;
      // see Model.vue
      // it sends a message to node/redis returning the visitedOn data
      // it returns any promo text the restaurant has published
      this.earnReward({
        bid: this.$route.params.id.replace(/ /g, '_'),
        uid: this.$socket.client.auth.userID,
      }).then((visitedOn) => {
        const dates = visitedOn.map((v) => this.convertDateTime(v));

        // Jason wanted to wait on mentioning tokens.
        const tokenMsg = `<p>Out of ${visitedOn.length} visit${
          visitedOn.length > 1 ? 's' : ''
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
    getPromos(biz) {
      this.promos = [];
      const country = this.country;
      console.log(`getPromotions({${biz},${country}}`);
      this.emitFromClient('getPromotions', { biz, country }, (promos) => {
        this.promotions = promos;
        console.log(`promotions`, this.promotions);
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
          this.promos.push(
            `<h4>At ${p[1]}</h4><p class="text-subtitle-2 pt-3">${p[3]}</p>`
          );
        });
      });
    },
  }, // end of Methods

  watch: {
    tree(n, o) {
      if (isEmpty(n)) {
        this.promos = [];
        return;
      }
console.log('n[0] :>> ', n[0]);      this.getPromos(n[0].biz);
    },
    promotions(val) {
      if (isEmpty(val)) {
        console.log(`No promotions yet from ${this.tree[0].name}`);
        return;
      }
      this.renderPromos(val);
    },
  },

  mounted() {
    if (this.$route.params.id) {
      this.onEarnReward();
    }
    this.onGetRewardPoints();

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
