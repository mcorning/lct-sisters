<template>
  <v-footer app color="primary" class="white--text">
    <State>
      <v-bottom-navigation
        slot-scope="{ state, logVisit, isConnected }"
        color="secondary"
        background-color="primary"
        dark
        grow
      >
        <v-btn @click="open('Spaces', state, logVisit, isConnected)">
          <span>Spaces</span>
          <v-icon>mdi-map-marker</v-icon>
        </v-btn>

        <v-btn
          fab
          color="red"
          class="black--text"
          dark
          @click="open('Warning', state, logVisit, isConnected)"
        >
          <span>Warn</span>
          <v-icon dark> mdi-alert </v-icon></v-btn
        >
        <v-btn @click="open('Calendar', state, logVisit, isConnected)">
          <span>Calendar</span>
          <v-icon>mdi-calendar</v-icon>
        </v-btn>
      </v-bottom-navigation>
    </State>
  </v-footer>
</template>

<script>
import State from '../components/renderless/State.vue';

export default {
  name: 'AppLayoutFooter',
  components: {
    State,
  },
  computed: {
    connection() {
      return this.userID ? 'mdi-lan-connect' : 'mdi-lan-disconnect';
    },
  },
  methods: {
    // TODO NOTE: this design is fairly complex, a sign of bad design. In any case,
    // the parent component (that is the child of the State renderless component),
    // takes what it needs to serve its children (which may be different capabilities).
    // Each button stipulates the capabilities it needs.
    // The open() function passes all the parent components props, even though a button may not need them.
    // NOTE ALSO: we did not pass props to appLayoutFooter because we wrapped this component in State;
    // so to get the State props down here in this method, we pass them on down through method params.
    open(view, state, logVisit, isConnected) {
      const selectedSpace = null;
      this.$router.push({
        name: view,
        params: {
          selectedSpace,
          state,
          logVisit,
          isConnected,
        },
      });
    },
  },
};
</script>

<style scoped>
#nav {
  padding: 30px;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  color: #42b983;
}
</style>
