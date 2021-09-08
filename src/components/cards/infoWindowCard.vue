<template>
  <div>
    <v-card v-if="info">
      <v-card-title>{{ name }}</v-card-title>
      <v-card-subtitle>{{ address }}</v-card-subtitle>
      <v-card-text>
        <v-row no-gutters>
          <v-col cols="3">Postion Data</v-col>
          <v-col>
            <small>
              {{ position | latLng }}<br />
              PlaceID: {{ placeId }}<br />
              GlobalCode: {{ globalCode }}
            </small></v-col
          >
        </v-row>
      </v-card-text>
      <p v-if="info.url" v-html="placeLink"></p>

      <v-btn @click="onVisitPlace(placeId)">Visit</v-btn>
      <v-btn @click="onToWork(placeId)">Work</v-btn>
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
    onToWork: Function,
    onShareGathering: Function,
  },
  filters: {
    latLng: (val) => {
      return `Lat: ${val.lat} Lng:  ${val.lng}`;
    },
  },

  computed: {
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
