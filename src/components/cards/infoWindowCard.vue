<template>
  <div>
    <v-card v-if="marker">
      <v-card-title>{{ name }}</v-card-title>
      <v-card-subtitle v-html="placeLink"></v-card-subtitle>
      <v-card-text>{{ placeId }}</v-card-text>
      <v-card-text>{{ plusCode }}</v-card-text>
      <v-card-text>{{ address }}</v-card-text>
      <v-btn>Visit</v-btn>
      <v-btn>Work</v-btn>
      <v-btn>Share</v-btn>
    </v-card>
  </div>
</template>

<script>
export default {
  props: {
    marker: {
      type: Object,
      require: true,
    },
  },
  computed: {
    name() {
      return this.marker.name;
    },
    placeId() {
      return this.marker?.place_id;
    },
    plusCode() {
      return this.marker?.plus_code;
    },
    placeLink() {
      return `<a href="${this.marker.url}">Show details</a>`;
    },
    address() {
      return this.marker.formatted_address;
    },
  },
  watch: {
    marker() {
      console.log(this.marker);
    },
  },
};
</script>
