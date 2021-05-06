<template>
  <div>
    <v-row align="center" justify="center">
      <v-spacer></v-spacer>
      <v-col cols="12">
        <v-card max-width="320">
          <v-card-title>Welcome to LCT-{{ nsp }}</v-card-title>
          <v-card-subtitle
            >Local Contact Tracing is our community's way of getting back to
            work safely</v-card-subtitle
          >

          <v-card-text>
            <p>
              LCT minimizes the time between exposure to the virus and getting
              tested to know if you're infected.
            </p>
            <p>
              If we deprive the virus of time to replicate and mutate, we can
              beat this thing.
            </p>
          </v-card-text>
          <v-card-text class="text-center">{{ welcomeMessage }}</v-card-text>
          <v-card-text>
            <v-text-field
              v-model="username"
              :rules="rules"
              counter="10"
              hint="Tab to go on"
              label="Enter a nickname to save the day"
              clearable
              @blur="onSubmit()"
            ></v-text-field
          ></v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-dialog v-model="dialog" persistent max-width="400px">
              <template v-slot:activator="{ on, attrs }">
                <v-btn color="primary" dark v-bind="attrs" v-on="on">
                  OK
                </v-btn>
              </template>
              <v-card>
                <v-card-title class="headline ">
                  Let's get to work (safely)
                </v-card-title>

                <v-card-text>
                  <p>
                    To fit LCT to your daily routine, we suggest you note some
                    preferences below.
                  </p>
                  <p>
                    For instance, if you use LCT at work (and of all places, you
                    should), select 8 hours as your default average stay.
                  </p>
                  <v-row>
                    <v-col cols="12">
                      <v-select
                        v-model="avgStay"
                        :items="intervals"
                        :menu-props="{ top: true, offsetY: true }"
                        label="Your average stay per visit (in hours) "
                        autofocus
                      ></v-select>
                    </v-col>
                  </v-row>
                </v-card-text>

                <v-card-text>
                  If you proceed, (using this browser) you will always log on to
                  the server as
                  {{ username }}. Ready to crush this virus?
                </v-card-text>

                <v-card-actions>
                  <v-spacer></v-spacer>

                  <v-btn color="primary darken-1" text @click="dialog = false">
                    No thanks
                  </v-btn>

                  <v-btn color="primary darken-1" text @click="onGo">
                    Absolutely
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
export default {
  name: 'Welcome',

  computed: {
    sessionID() {
      return localStorage.getItem('sessionID');
    },

    welcomeMessage() {
      let msg = this.sessionID
        ? `Welcome back to your old session, ${this.sessionID}`
        : "So, let's get started, shall we? There's no time to lose...";
      return msg;
    },
  },

  data() {
    return {
      avgStay: 1,
      intervals: [0.5, 1, 8],

      // returning: false,
      dialog: false,
      nsp: 'Sisters',
      username: '',
      rules: [(v) => v?.length > 2 || 'Between 3 and 10 characters'],
    };
  },

  methods: {
    onSubmit() {
      localStorage.setItem('username', this.username);
      // ensure a value for username
      this.dialog = this.username;
    },

    onGo() {
      this.dialog = false;
      this.$emit('input', this.username);
    },
  },
  watch: {
    avgStay(val) {
      localStorage.setItem('avgStay', val);
    },
  },
  created() {
    this.username = localStorage.getItem('username');
  },

  beforeUnmount() {},

  mounted() {
    if (this.username) {
      this.onGo();
    }
  },
};
</script>
