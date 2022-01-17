<template>
  <v-card>
    <v-card-title class="text-sm-h5">Soteria digital capabilities</v-card-title>
    <v-card-subtitle>These assets are in development currently</v-card-subtitle>
    <v-card outlined>
      <v-card-title>Nonprofit</v-card-title>
      <v-card-text>
        <!-- use router-link component for navigation. -->
        <!-- specify the link by passing the `to` prop. -->
        <!-- `<router-link>` will be rendered as an `<a>` tag by default -->
        <v-btn text>
          <router-link to="/space">Local Contact Tracing</router-link>
        </v-btn>
      </v-card-text>
      <!-- route outlet -->
      <!-- component matched by the route will render here -->
      <router-view></router-view>
    </v-card>
    <v-card outlined class="mt-5" color="grey" dark>
      <v-card-title>Commercial</v-card-title>
      <v-card-text>
        <v-btn text>
          <router-link to="/sponsor">TQR Sponsor</router-link></v-btn
        >
        <v-btn text
          ><router-link to="/customer">TQR Customer</router-link></v-btn
        >
      </v-card-text>
      <!-- route outlet -->
      <!-- component matched by the route will render here -->
      <router-view></router-view>
    </v-card>
    <v-card>
      <v-card-title>Sign up as a Beta Tester</v-card-title>
      <v-card-text>
        <a
          href="mailto:mcorning@soteriaInstitute.org?subject=Add me to your testing team"
          >Apply</a
        ></v-card-text
      >
    </v-card>
    <v-card-subtitle> V {{ $version }} </v-card-subtitle>
  </v-card>
</template>

<script>
export default {
  name: 'Hub',
  props: {},
  components: {},
  computed: {},
  data() {
    return {};
  },

  methods: {},

  watch: {},

  async mounted() {},
};
</script>

<style scoped>
a:link {
  text-decoration: none;
}
</style>
