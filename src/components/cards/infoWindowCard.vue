<template>
  <div>
    <v-card v-if="info">
      <v-card-text class="text-h5 pb-0">{{ name }}</v-card-text>
      <v-card-subtitle
        >{{ address }}<br /><span v-if="info.url" v-html="placeLink"></span
      ></v-card-subtitle>

      <v-card-text>
        <v-btn block color="primary" @click="onVisitPlace(placeId)"
          >Mark Your Calendar</v-btn
        >

        <div class="text-caption">
          {{ `Lat: ${info.position.lat} Lng: ${info.position.lng}` }}<br />
          {{ `PlaceID:    ${placeId}` }}<br />
          {{ `GlobalCode: ${globalCode}` }}
          }}
        </div>
      </v-card-text>
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

  methods: {},

  watch: {},
  mounted() {
    console.log();
  },
};
</script>
