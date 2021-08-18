<template>
  <div>
    <v-card v-if="data">
      <v-card-title>{{ name }}</v-card-title>
      <v-card-subtitle v-html="placeLink"></v-card-subtitle>
      <v-card-text
        >{{ address }} <br />
        <small>
          {{ plusCode }}<br />
          {{ placeId }}
        </small>
      </v-card-text>
      <v-btn>Visit</v-btn>
      <v-btn>Work</v-btn>
      <v-btn>Share</v-btn>
    </v-card>
  </div>
</template>

<script>
export default {
  props: {
    data: {
      type: Object,
      require: true,
    },
  },
  computed: {
    name() {
      return this.data.name;
    },
    placeId() {
      return this.data?.place_id;
    },
    plusCode() {
      return this.data?.plus_code.global_code;
    },
    placeLink() {
      return `<a href="${this.data.url}">Show details</a>`;
    },
    address() {
      return this.data.formatted_address;
    },
  },
  watch: {
    data() {
      console.log(this.data);
    },
  },
};
</script>
