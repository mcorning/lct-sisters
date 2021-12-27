<template>
  <v-footer app dark color="primary" class="white--text">
    <v-btn color="primary" plain absolute bottom left @click="open('Sponsor')">
    </v-btn>
    <v-btn color="primary" plain @click="open('Customer')"> </v-btn>
    <!-- status bar -->

    <!-- View buttons -->

    <!-- <v-bottom-navigation
      v-model="value"
      color="secondary"
      background-color="primary"
      dark
      shift
    > -->
    <!-- <span class="center mx-0 my-0">{{ status }}</span>-->
    <v-spacer />

    <v-btn plain value="Space" @click="open('Space')">
      <span class="mr-3">Space</span>
      <v-icon>mdi-map-marker</v-icon>
    </v-btn>
    <v-spacer />

    <v-tooltip bottom>
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          v-bind="attrs"
          v-on="on"
          fab
          value="Warn"
          class="red"
          @click="open('Warn')"
        >
          <v-icon>mdi-alert</v-icon>
        </v-btn>
      </template>
      <span
        >If you test positive, warn others they may be exposed to COVID
      </span>
    </v-tooltip>
    <v-spacer />

    <v-btn plain value="Time" @click="open('Time')">
      <v-icon>mdi-calendar</v-icon>
      <span class="ml-3">Time</span>
    </v-btn>
    <v-spacer />
    <!-- </v-bottom-navigation> -->
  </v-footer>
</template>

<script>
export default {
  name: 'AppLayoutFooter',
  computed: {
    status() {
      const phrase = this.$socket.connected
        ? `You (${'...' + this.$socket.client.auth.userID.slice(12)}) are `
        : 'You are';
      return `${phrase} ${
        this.$socket.connected
          ? `connected on socket: ${this.$socket.client.id}`
          : 'offline'
      }`;
    },
  },
  data() {
    return {
      value: '',
    };
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
    this.value = this.$router.currentRoute.name;
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
