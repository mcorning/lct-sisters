<template>
  <v-card class="mx-auto">
    <v-row dense
      ><v-col cols="12" sm="8">
        <!-- TODO use these breakpoints all over the app -->
        <v-card-title class="text-subtitle-1 text-sm-h5">
          CoVid Early Warning System
        </v-card-title>
        <v-card-subtitle>(CVEW)</v-card-subtitle>
      </v-col>
      <v-col>
        <v-card-subtitle class="text-subtitle-2 text-sm-subtitle-1"
          >Your ID: {{ search }}</v-card-subtitle
        >
      </v-col></v-row
    >

    <v-divider></v-divider>

    <v-row>
      <!-- Visitor list -->
      <v-col cols="12" md="3">
        <v-card-title><h6>Participation</h6></v-card-title>
        <v-card-subtitle>Other visitors on graphs you use</v-card-subtitle>
        <v-card-text class="text-caption"
          >The Visitor was in these geographic areas. Each area lists all the
          visitors in that space. The Virus Exposures section limits visitors
          who shared the same spacetime.</v-card-text
        >
        <v-list>
          <v-list-group
            v-for="item in visitors"
            :key="item.title"
            v-model="item.active"
            prepend-icon="mdi-graphql"
            no-action
            @click="selectID"
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
        <v-card-title><h6>Virus Exposures</h6></v-card-title>
        <v-card-subtitle>{{ exposureMessage }}</v-card-subtitle>
        <v-card-text class="text-caption">{{ exposureCaption }}</v-card-text>
        <v-data-table
          v-if="hasExposures"
          :headers="exposureHeaders"
          :items="exposures"
          group-by="name"
          show-group-by
          sort-by="userID"
          mobile-breakpoint
        >
          <template v-slot:[`item.name`]="{ item }">
            <v-subheader v-text="item.name" />
          </template>
          <template v-slot:[`item.userID`]="{ item }">
            <v-subheader v-text="item.userID" />
          </template>
          <template v-slot:[`item.date`]="{ item }">
            <v-subheader v-text="item.date" />
          </template>
          <template v-slot:[`item.start`]="{ item }">
            <v-subheader v-text="formatTime(item.start)" />
          </template>
          <template v-slot:[`item.end`]="{ item }">
            <v-subheader v-text="formatTime(item.end)" />
          </template>
        </v-data-table>
      </v-col>
    </v-row>
  </v-card>
</template>

<script>
import { formatSmallTime } from '@/utils/luxonHelpers';
import { printJson } from '@/utils/helpers';

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
    exposureMessage() {
      return this.hasExposures
        ? `Other visitors shared the same spacetimes with visitor: ${this.search}}`
        : 'Nobody to warn yet...';
    },
    exposureCaption() {
      return this.hasExposures
        ? `These people will see an exposure alert if you hit the Big Red Button.`
        : '';
    },
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
      exposureHeaders: [
        { text: 'Place Name', value: 'name' },
        { text: 'Place', value: 'placeID' },
        { text: 'ID', value: 'userID' },
        { text: 'Date', value: 'date' },
        { text: 'Start', value: 'start', groupable: false },
        { text: 'End', value: 'end', groupable: false },
      ],
      selected: [{ userID: this.$socket.client.auth.userID }],

      search: this.$socket.client.auth.userID,
    };
  },

  methods: {
    formatTime(ms) {
      return formatSmallTime(ms);
    },
    selectID(e) {
      console.log(e);
    },
  },

  watch: {
    visitors(n) {
      console.log('visitors in redisCard.vue', JSON.stringify(n, null, 3));
    },
    exposures(n) {
      console.log('exposures in redisCard.vue', printJson(n));
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
    console.log('\tREDISCARD mounted');
  },
};
</script>
<style></style>
