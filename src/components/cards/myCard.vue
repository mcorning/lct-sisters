<template>
  <v-dialog v-model="dialog" persistent max-width="400px">
    <template v-slot:activator="{ on, attrs }">
      <v-btn color="primary" dark v-bind="attrs" v-on="on">
        I'm ready
      </v-btn>
    </template>
    <v-card>
      <v-card-title class="headline ">
        Let's get to work (safely)
      </v-card-title>
      <v-card-text>
        <v-text-field
          v-model="username"
          :rules="rules"
          counter="10"
          hint="Use any value that you would recognize later as you."
          label="Save the day with a nickname"
          clearable
        ></v-text-field
      ></v-card-text>
      <v-card-text>
        <p>
          To fit LCT to your daily routine, we suggest you note some preferences
          below.
        </p>
        <p>
          For instance, if you use LCT at work (and of all places, you should),
          select 8 hours as your default average stay.
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
        If you proceed, (using this browser) you will always log on to the
        server as
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
</template>

<script>
export default {
  data() {
    return {
      avgStay: 1,
      intervals: [0.5, 1, 8],
      dialog: false,
      username: '',
      rules: [(v) => v?.length > 2 || 'Between 3 and 10 characters'],
    };
  },

  methods: {
    onGo() {
      this.dialog = false;
      this.$emit('go', this.username, false);
    },
  },
};
</script>

<style lang="scss" scoped></style>
