<template>
  <v-container fluid>
    <v-card class="mx-auto">
      <v-card-title>Redis Monitor</v-card-title>

      <!-- <v-card-text>
        <v-row>
          <v-col>
            <v-list nav dense>
              <v-subheader>Diagnostic Queries</v-subheader>
              <v-list-item-group v-model="selectedItemIndex" color="primary">
                <v-list-item v-for="(item, i) in items" :key="i">
                  <v-list-item-content>
                    <v-list-item-title
                      >{{ item.label }} [{{
                        item.paramName || 'no parameter'
                      }}]</v-list-item-title
                    >
                  </v-list-item-content>
                </v-list-item>
              </v-list-item-group>
            </v-list>
          </v-col>
        </v-row>
      </v-card-text> 

      <v-divider></v-divider> -->
      <v-row>
        <!-- Visitor table -->
        <v-col cols="3" v-if="hasVisitors">
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
            :headers="visitorHeaders"
            :items="visitors"
            :search="search"
            :single-select="singleSelect"
            show-select
          >
          </v-data-table>
        </v-col>

        <!-- Exposures table -->
        <v-col v-if="hasVisitors">
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
            :headers="exposureHeaders"
            :items="exposures"
            :search="search"
            group-by="userID"
            ><template v-slot:[`item.start`]="{ item }">
              <v-subheader v-text="getDate(item.start)" /> </template
          ></v-data-table>
        </v-col>
        <!-- Spaces table -->
        <!-- <v-col cols="3">
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
            :headers="spaceHeaders"
            :items="queryResults"
            :search="search"
          ></v-data-table>
        </v-col> -->
      </v-row>
    </v-card>
  </v-container>
</template>

<script>
export default {
  name: 'testCard',
  props: { visitors: Object, exposures: Object },
  components: {},

  computed: {
    selectedItem() {
      return this.items[this.selectedItemIndex];
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
      selected: [],
      // spaceHeaders: [
      //   {
      //     text: 'Space name',
      //     align: 'start',
      //     sortable: true,
      //     value: 'name',
      //   },

      //   { text: 'ID', value: 'id' },
      // ],
      visitorHeaders: [
        {
          text: 'Visitor ID',
          align: 'start',
          sortable: true,
          value: 'userID',
        },
      ],
      exposureHeaders: [
        {
          text: 'Exposed Visitor ID',
          align: 'start',
          sortable: true,
          value: 'userID',
        },

        { text: 'Visit Started', value: 'start' },
        { text: 'Space', value: 'space' },
      ],
      search: '',

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
        // {
        //   query: 'matchWithParamsQuery',
        //   label: 'Who was with this visitor',
        //   paramName: 'userID',
        // },

        // {
        //   query: 'matchAllNodesQuery',
        //   label: 'Number of visitor and space nodes on the graph',
        //   paramName: '',
        // },
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
      console.log('exposures in testCard.vue', n);
    },

    // selectedItemIndex() {
    //   const { query, paramName } = this.selectedItem;
    //   console.log(JSON.stringify(this.selectedItem, null, 3));

    //   const pVal = this.selected[0]?.userID
    //     ? this.selected[0]?.userID
    //     : prompt(`What ${paramName} are you looking for?`);

    //   const param = pVal ? { [paramName]: pVal } : {};
    //   const payload = { query, param };
    //   console.log(JSON.stringify(payload, null, 3));

    //   this.getVisitors(payload);
    // },
  },
  created() {},

  beforeUnmount() {},

  mounted() {
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
