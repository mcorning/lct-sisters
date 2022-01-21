<template>
  <v-container fluid>
    <v-card-title>CoVid Early Warning System</v-card-title>
    <v-row>
      <v-col cols="12" md="8"> </v-col>
      <v-col> </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: 'cvewComponent',
  components: {},
  props: {},
  computed: {},
  data() {
    return {
      visits: null,
    };
  },
  methods: {},
  watch: {},
  mounted() {
    console.log('Cvew component mounted:');
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
