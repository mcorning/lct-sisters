<template>
  <v-footer app color="primary" class="white--text">
    <State>
      <v-bottom-navigation
        slot-scope="{ state }"
        color="secondary"
        background-color="primary"
        dark
        grow
      >
        <v-btn @click="open('Spaces', state)">
          <span>Spaces</span>
          <v-icon>mdi-map-marker</v-icon>
        </v-btn>

        <v-btn
          fab
          color="red"
          class="black--text"
          dark
          @click="open('Warning', state)"
        >
          <span>Warn</span>
          <v-icon dark> mdi-alert </v-icon></v-btn
        >
        <v-btn @click="open('Calendar', state)">
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
    open(view, state) {
      const selectedSpace = null;
      this.$router.push({
        name: view,
        params: { selectedSpace, state },
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
