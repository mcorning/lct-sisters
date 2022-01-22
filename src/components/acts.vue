<template>
  <v-container fluid>
    <v-card-title>CoVid Early Warning System</v-card-title>
    <pre>{{ visits }}</pre>
    <v-row>
      <v-col cols="12" md="8"> </v-col>
      <v-col> </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: 'acts',
  components: {},
  props: {
    state: Object,
  },
  computed: {
    visits() {
      return this.state.visits;
    },
  },
  data() {
    return {};
  },
  methods: {},
  watch: {},
  mounted() {
    console.log('Act component mounted:');
    console.log(' ');
  },
};
</script>

<style lang="scss" scoped>
.SplitHorizontal {
  width: 100vw;
  height: 50vh;
}
</style>
