<template>
  <v-dialog v-model="dialog" persistent max-width="400px">
    <template v-slot:activator="{ on, attrs }">
      <v-btn color="primary" dark v-bind="attrs" v-on="on">
        Set me up
      </v-btn>
    </template>
    <v-card>
      <h3 class="headline pt-5 pl-5">Connecting the Server</h3>
      <v-card-text>
        <v-text-field
          v-model="username"
          :rules="rules"
          counter="10"
          hint="Use any value that you would recognize later as you."
          label="Your nickname can save the day"
          clearable
        ></v-text-field
      ></v-card-text>
      <v-card-text v-html="html">
        <p>Ready to crush this virus?</p>
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
</template>

<script>
export default {
  computed: {
    html() {
      return this.username
        ? `From now on this browser always logs you on to the server as
        <strong>${this.username}</strong>.`
        : '';
    },
  },
  data() {
    return {
      // avgStay: 1,
      intervals: [0.5, 1, 8],
      dialog: false,
      username: '',
      rules: [(v) => v?.length > 2 || 'Between 3 and 10 characters'],
    };
  },

  methods: {
    onGo() {
      this.dialog = false;
      this.$emit('go', { username: this.username });
    },
  },
};
</script>

<style lang="scss" scoped></style>
