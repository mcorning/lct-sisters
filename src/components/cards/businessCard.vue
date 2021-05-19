<template>
  <v-dialog v-model="dialog" persistent max-width="400px">
    <template v-slot:activator="{ on, attrs }">
      <v-btn fab color="green" dark v-bind="attrs" v-on="on">
        <v-icon>mdi-facebook-workplace</v-icon>
      </v-btn>
    </template>
    <v-card>
      <v-card-title class="headline">{{ name }}</v-card-title>
      <v-card-subtitle>
        Let's open the doors (safely)
      </v-card-subtitle>

      <v-card-text>
        <v-switch
          v-model="usesPublicCalendar"
          :label="
            `We require appointments. Currently: ${usesPublicCalendar.toString()}`
          "
        ></v-switch>

        <!-- Optional settings -->
        <v-row v-if="usesPublicCalendar">
          <v-col cols="4">
            <v-text-field
              v-model="slotInterval"
              label="How long are appointments (in minutes)?"
              clearable
            ></v-text-field>
          </v-col>
          <v-col cols="8">
            <v-text-field
              v-model="people"
              label="List service providers"
              hint="Separate names with commas"
              clearable
            ></v-text-field>
          </v-col>
        </v-row>
        <v-row>
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
          Ready to get to work?
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
  props: {
    name: String,
  },
  data() {
    return {
      dialog: false,
      usesPublicCalendar: false,

      username: '',
      people: '',
      slotInterval: 30,

      time1: '08:00',
      time2: '17:00',
      menu1: false,
      menu2: false,

      rules: [(v) => v?.length > 2 || 'Between 3 and 10 characters'],
    };
  },

  methods: {
    onGo() {
      this.dialog = false;
      // localStorage accessed later when usesPublicCalendar is true
      localStorage.setItem('usesPublicCalendar', this.usesPublicCalendar);
      localStorage.setItem('people', this.people);
      localStorage.setItem('slotInterval', this.slotInterval);
      localStorage.setItem('openAt', this.time1);
      localStorage.setItem('closeAt', this.time2);
      const data = {
        usesPublicCalendar: this.usesPublicCalendar,
        people: this.people,
        slotInterval: this.slotInterval,
        time1: this.time1,
        time2: this.time2,
      };
      this.$emit('go', data);
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
