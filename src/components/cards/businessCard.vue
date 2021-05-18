<template>
  <v-dialog v-model="dialog" persistent max-width="400px">
    <template v-slot:activator="{ on, attrs }">
      <v-btn color="primary" dark v-bind="attrs" v-on="on">
        We are ready
      </v-btn>
    </template>
    <v-card>
      <v-card-title class="headline ">
        Let's open the doors (safely)
      </v-card-title>
      <v-card-text>
        <v-text-field
          v-model="username"
          :rules="rules"
          counter="10"
          hint="Use the name on the map for your business."
          label="Save the day with your business name"
          clearable
        ></v-text-field
      ></v-card-text>
      <v-card-text>
        <p>
          If you require appointments to meet customers...
        </p>
        <v-switch
          v-model="usesPublicCalendar"
          :label="`Turn on this switch: ${usesPublicCalendar.toString()}`"
        ></v-switch>
        <v-row v-if="usesPublicCalendar">
          <v-col cols="6">
            <v-menu
              ref="menu1"
              v-model="menu1"
              :close-on-content-click="false"
              :nudge-right="40"
              :return-value.sync="time1"
              transition="scale-transition"
              offset-y
              max-width="290px"
              min-width="290px"
            >
              <template v-slot:activator="{ on, attrs }">
                <v-text-field
                  v-model="time1"
                  label="Opening hr:min"
                  prepend-icon="access_time"
                  readonly
                  v-bind="attrs"
                  v-on="on"
                ></v-text-field>
              </template>
              <v-time-picker
                v-if="menu1"
                v-model="time1"
                full-width
                @click:minute="$refs.menu1.save(time1)"
              ></v-time-picker>
            </v-menu>
          </v-col>
          <v-col cols="6">
            <v-menu
              ref="menu2"
              v-model="menu2"
              :close-on-content-click="false"
              :nudge-right="40"
              :return-value.sync="time2"
              transition="scale-transition"
              offset-y
              max-width="290px"
              min-width="290px"
            >
              <template v-slot:activator="{ on, attrs }">
                <v-text-field
                  v-model="time2"
                  label="Closing hr:min"
                  prepend-icon="access_time"
                  readonly
                  v-bind="attrs"
                  v-on="on"
                ></v-text-field>
              </template>
              <v-time-picker
                v-if="menu2"
                v-model="time2"
                full-width
                @click:minute="$refs.menu2.save(time2)"
              ></v-time-picker>
            </v-menu>
          </v-col>
        </v-row>

        <v-card-text>
          ...Then specify your current openings in your public calendar. Ready
          to get to work?
        </v-card-text>
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
      dialog: false,
      username: '',

      time1: null,
      time2: null,
      menu1: false,
      menu2: false,

      openAt: '07:00',
      closeAt: '17:00',
      slotInterval: 30,
      modalOpen: false,
      modalClose: false,
      usesPublicCalendar: false,

      rules: [(v) => v?.length > 2 || 'Between 3 and 10 characters'],
    };
  },

  methods: {
    onGo() {
      this.dialog = false;
      this.$emit('go', this.username, this.usesPublicCalendar);
    },
  },

  watch: {
    userName(val, oldVal) {
      if (!oldVal) {
        this.username = 'Anon';
      }
      console.log(val);
    },

    onpenAt(val) {
      alert(val);
    },

    closeAt(val) {
      alert(val);
    },
  },
};
</script>

<style lang="scss" scoped></style>
