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

      <v-card-text>
        <v-btn
          block
          color="primary"
          @click="onVisitPlace({ placeId, gatheringName })"
          >Mark Calendar</v-btn
        >
        <v-row no-gutters align="start">
          <v-col cols="11">
            <div class=" mt-3" @click="toggle">
              {{ showPostions ? 'Hide' : 'Show' }} Positions
            </div>

            <div v-if="showPostions">
              {{ `Lat: ${info.position.lat} Lng: ${info.position.lng}` }}<br />
              {{ `PlaceID:    ${placeId}` }}<br />
              {{ `GlobalCode: ${globalCode}` }}
              }}
            </div>
          </v-col>
          <v-col cols="1">
            <btn-with-tooltip
              tip="Delete this marker from map"
              :click="deleteMarker"
              icon="mdi-delete"
            ></btn-with-tooltip>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import btnWithTooltip from '../misc/btnWithTooltip.vue';
export default {
  components: { btnWithTooltip },
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
