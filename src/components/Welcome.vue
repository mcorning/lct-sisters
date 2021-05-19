<template>
  <div>
    <v-row align="center" justify="center">
      <v-spacer></v-spacer>
      <v-col cols="12">
        <v-card max-width="320">
          <v-card-title>Welcome to LCT-{{ nsp }}</v-card-title>
          <v-card-subtitle
            >Local Contact Tracing can deprive the virus of time to replicate
            and mutate.
          </v-card-subtitle>

          <v-card-text>
            LCT is our community's way of getting back to work safely. This
            means we can balance the risk of infection against the risk of
            bankruptcy.
          </v-card-text>
          <v-card-text class="text-center">{{ welcomeMessage }}</v-card-text>

          <v-card-actions>
            <myCard @go="onGo"></myCard>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
export default {
  name: 'Welcome',

  components: {
    myCard: () => import('./cards/myCard'),
  },

  computed: {
    sessionID() {
      return localStorage.getItem('sessionID');
    },

    welcomeMessage() {
      let msg = this.sessionID
        ? `Welcome back to your old session, ${this.sessionID}`
        : "We can beat this thing. Let's get started, shall we? There's no time to lose...";
      return msg;
    },
  },

  data() {
    return {
      nsp: 'Sisters',
    };
  },

  methods: {
    onGo(username, usesPublicCalendar) {
      console.log('username', username);
      localStorage.setItem('username', username);
      localStorage.setItem('usesPublicCalendar', usesPublicCalendar);

      this.dialog = false;
      this.$emit('connectMe', username, usesPublicCalendar);
    },
  },

  watch: {
    userName(val, oldVal) {
      if (!oldVal) {
        this.username = 'Anon';
      }
      console.log(val);
    },

    avgStay(val) {
      localStorage.setItem('avgStay', val);
    },
  },
  created() {
    this.username = localStorage.getItem('username');
  },

  beforeUnmount() {},

  mounted() {},
};
</script>
