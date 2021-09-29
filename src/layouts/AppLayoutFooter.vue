<template>
  <v-footer app color="primary" class="white--text">
    <!-- status bar -->
    <div class="center mx-0 my-0">{{ status }}</div>

    <!-- View buttons -->
    <v-bottom-navigation color="secondary" background-color="primary" dark grow>
      <v-btn @click="open('Space')">
        <span>Space</span>
        <v-icon>mdi-map-marker</v-icon>
      </v-btn>

      <v-btn fab color="red" class="black--text" dark @click="open('Warn')">
        <span>Warn</span>
        <v-icon dark> mdi-alert </v-icon></v-btn
      >
      <v-btn @click="open('Time')">
        <span>Time</span>
        <v-icon>mdi-calendar</v-icon>
      </v-btn>
      <v-btn @click="open('Test')">
        <span>Test</span>
        <v-icon>question</v-icon>
      </v-btn>
    </v-bottom-navigation>
  </v-footer>
</template>

<script>
export default {
  name: 'AppLayoutFooter',
  components: {},
  computed: {
    status() {
      const phrase = this.$socket.connected
        ? `You (${'...' + this.$socket.client.auth.userID.slice(12)}) are `
        : 'You are';
      return `${phrase} ${this.$socket.connected ? 'connected' : 'offline'}`;
    },
  },
  methods: {
    // TODO NOTE: an alternative design uses Model here and passes data and functions to props.
    // At this writing, we have Space and Time vue files that wrap the map and calendars in their own Model reference
    // One could argue that the router should be in charge of what view is current and what data that view needs.
    open(view) {
      if (this.$router.currentRoute.name === view) {
        return;
      }
      this.$router.push({
        name: view,
      });
    },
  },
  mounted() {
    console.log('\tAppLayoutFooter mounted');
  },
};
</script>

<style scoped>
.center {
  width: 100%;
  font-size: 0.7em;
  text-align: center;
}

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
