<template>
  <div>
    <v-card v-if="info">
      <v-card-text class="text-h6 pb-0">
        <div v-if="!isGathering">{{ name }}</div>
        <v-text-field
          v-else
          v-model="gatheringName"
          label="Enter a name for your gathering"
        />
      </v-card-text>
      <v-card-subtitle
        >{{ address }}<br /><span v-if="info.url" v-html="placeLink"></span
      ></v-card-subtitle>
      <v-card-actions>
        <v-btn
          block
          color="primary"
          @click="onVisitPlace({ placeId, gatheringName })"
          >Mark Calendar</v-btn
        >
      </v-card-actions>
      <v-card-actions>
        <v-btn class=" text-caption " @click="toggle">
          {{ showPostions ? 'Hide' : 'Show' }} Positions
        </v-btn>
        <v-spacer />
        <v-btn @click="deleteMarker">Delete</v-btn>
        <div v-if="showPostions">
          {{ `Lat: ${info.position.lat} Lng: ${info.position.lng}` }}<br />
          {{ `PlaceID:    ${placeId}` }}<br />
          {{ `GlobalCode: ${globalCode}` }}
          }}
        </div>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script>
export default {
  props: {
    info: {
      type: Object,
      require: true,
    },
    onVisitPlace: Function,
  },
  filters: {},

  computed: {
    isGathering() {
      return this.name === 'Gathering';
    },
    latLng: () => {
      return this.info
        ? `Lat: ${this.info.position.lat} Lng:  ${this.info.position.lng}`
        : '';
    },
    name() {
      return this.info.name;
    },
    position() {
      return this.info.position;
    },

    placeId() {
      return this.info.place_id;
    },
    globalCode() {
      // TODO make globalCode the primary index in graph for space nodes
      return this.info.global_code;
    },
    placeLink() {
      return `<a href="${this.info.url}">Show place details on Googlemap</a>`;
    },
    address() {
      return this.info.formatted_address;
    },
  },
  data() {
    return {
      showPostions: false,
      gatheringName: '',
    };
  },
  methods: {
    deleteMarker() {
      this.$emit('deleteMarker');
    },
    toggle() {
      this.showPostions = !this.showPostions;
    },
  },

  watch: {},
  mounted() {
    console.log();
  },
};
</script>
