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

          <v-card-title
            ><h6>Your userID: {{ selected }}</h6></v-card-title
          >
          <v-card-title><h6>Other visitors on these graph(s)</h6></v-card-title>
          <v-list>
            <v-list-group
              v-for="item in visitors"
              :key="item.title"
              v-model="item.active"
              prepend-icon="mdi-graphql"
              no-action
            >
              <template v-slot:activator>
                <v-list-item-content>
                  <v-list-item-title v-text="item.title"></v-list-item-title>
                </v-list-item-content>
              </template>

              <v-list-item v-for="child in item.items" :key="child.title">
                <v-list-item-content>
                  <v-list-item-title v-text="child.title"></v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list-group>
          </v-list>
        </v-col>

        <!-- Exposures table -->
        <v-col>
          <v-card-subtitle
            >Other visitors shared the same spacetimes with visitor:
            {{ selectedUserID.userID }}</v-card-subtitle
          >
          <v-data-table
            v-if="hasExposures"
            :headers="exposureHeaders"
            :items="exposures"
            group-by="placeID"
          >
            <template v-slot:[`item.userID`]="{ item }">
              <v-subheader v-text="item.userID" />
            </template>
            <template v-slot:[`item.start`]="{ item }">
              <v-subheader v-text="getDate(time.start)" />
              <v-subheader v-text="getTime(item.start)" />
            </template>
            <template v-slot:[`item.end`]="{ item }">
              <v-subheader v-text="getTime(item.end)" />
            </template>
          </v-data-table>
        </v-col>
      </v-row>
    </v-card>
    <v-row
      ><v-col>hasVisitors:{{ hasVisitors }}</v-col
      ><v-col>hasExposures:{{ hasExposures }}</v-col></v-row
    >
  </v-container>
</template>

<script>
import { DateTime, formatSmallTime } from '@/utils/luxonHelpers';

// Redis.vue calls this card
// visitors
// exposures
export default {
  name: 'redisCard',
  props: {
    visitors: Object,
    exposures: Object,
    getVisits: Function,
    visitExists: Function,
  },
  components: {},

  computed: {
    selectedUserID() {
      const userID = this.selected.length > 0 ? this.selected[0].userID : '';
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
      ready: false,
      selected: [{ userID: this.$socket.client.auth.userID }],

      search: this.$socket.client.auth.userID,
    };
  },

  methods: {
    getDate(ms) {
      const dt = new DateTime()
        .fromMillis(ms)
        .toLocaleString(DateTime.DATE_SHORT);
      return dt;
    },

    getTime(ms) {
      try {
        const dt = formatSmallTime(ms);
        console.log('dt', dt);
        return dt;
      } catch (e) {
        console.error(e);
        return '';
      }
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
    console.log('selectedUserID:', this.selectedUserID);
    console.log('socket userID:', this.$socket.client.auth.userID);
    this.$emit('selectedChanged', this.selectedUserID);
    this.ready = true;
    console.log('\tTESTCARD mounted');
  },
};
</script>
