<template>
  <v-container fluid>
    <v-card class="mx-auto">
      <v-card-title>Redis Monitor</v-card-title>

      <v-divider></v-divider>

      <v-row>
        <!-- Visitor table -->
        <v-col v-if="hasVisitors">
          <v-card-title><h6>Visitor Exposure Warning</h6></v-card-title>
          <v-card-subtitle
            >See how many others would be at risk if you sent an Exposure
            Warning</v-card-subtitle
          >
          <v-card-title>
            <v-text-field
              v-model="search"
              append-icon="mdi-magnify"
              label="Search"
              single-line
              hide-details
            ></v-text-field>
          </v-card-title>
          <v-data-table
            v-model="selected"
            :search="search"
            :headers="visitorHeaders"
            :items="visitors"
            :single-select="singleSelect"
            show-select
            dense
            mobile-breakpoint
          >
          </v-data-table>
        </v-col>

        <!-- Exposures table -->
        <v-col>
          <v-card-subtitle
            >These visitors shared the same spacetime with the selected visitor:
            {{ selectedUserID.userID }}</v-card-subtitle
          >

          <v-data-table
            v-if="hasExposures"
            :headers="exposureHeaders"
            :items="exposures"
            group-by="userID"
            ><template v-slot:[`item.start`]="{ item }">
              <v-subheader v-text="getDate(item.start)" /> </template
          ></v-data-table>
        </v-col>
      </v-row>
    </v-card>
  </v-container>
</template>

<script>
// Redis.vue calls this card
export default {
  name: 'testCard',
  props: { visitors: Object, exposures: Object },
  components: {},

  computed: {
    selectedUserID() {
      const userID = this.selected.length > 0 ? this.selected[0] : '';
      return userID;
    },
    hasVisitors() {
      return Object.keys(this.visitors).length > 0;
    },
    hasExposures() {
      return Object.keys(this.exposures).length > 0;
    },
  },

  data() {
    return {
      singleSelect: true,
      selected: [{ userID: this.$socket.client.auth.userID }],
      visitorHeaders: [
        {
          text: 'ID',
          align: 'start',
          value: 'userID',
        },
      ],
      exposureHeaders: [
        {
          text: 'Exposed Visitor ID',
          align: 'start',
          value: 'userID',
        },

        { text: 'Visit Started', value: 'start' },
        { text: 'Space', value: 'space' },
      ],
      search: this.$socket.client.auth.userID,

      pVal: '',
      snackbar: false,
      selectedItemIndex: null,
      param: {},
      items: [
        {
          query: 'matchQuery',
          label: 'UserIDs of everybody on the graph',
          paramName: '',
        },
        {
          query: 'matchAllSpacesQuery',
          label: 'Name(s) of visited space(s)',
          paramName: '',
        },

        {
          query: 'matchNamedPathsQuery',
          label: 'All visitors exposed by this visitor',
          paramName: '',
        },
      ],
      ready: false,
    };
  },

  methods: {
    getDate(ms) {
      return new Date(ms).toString();
    },
  },

  watch: {
    visitors(n) {
      console.log('visitors in testCard.vue', n);
    },
    exposures(n) {
      console.log('exposures in testCard.vue', JSON.stringify(n, null, 3));
    },
    selected() {
      console.log(JSON.stringify(this.selected, null, 3));
      if (this.selectedUserID) {
        this.$emit('selectedChanged', this.selectedUserID);
      }
    },
  },
  created() {},

  beforeUnmount() {},

  mounted() {
    this.$emit('selectedChanged', this.selectedUserID);
    console.log('\tTESTCARD mounted');
  },
};
</script>

<!-- <v-card-title>Welcome to LCT-{{ nsp }}</v-card-title>
      <v-card-subtitle>A COVID Early Warning System</v-card-subtitle>
      <v-card-text>
        LCT is our community's way of getting back to work safely. This means we
        can balance the risk of infection against the risk of bankruptcy.
      </v-card-text>
      <v-card-text
        >How? By depriving the virus of time to replicate and mutate. As soon as
        you show symptoms or test positive, LCT sends alerts to all your tracked
        visits. Each of those alerted users, in turn, alerts their own tracked
        visits. An entire small community or large organization can get tested
        and treated orders of magnitude faster than with conventional
        time-consuming contract tracing.
      </v-card-text>
      <v-card-text class="text-center">{{ welcomeMessage }}</v-card-text> -->
