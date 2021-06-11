<template>
  <v-dialog v-model="dialog" persistent max-width="400px">
    <template v-slot:activator="{ on, attrs }">
      <v-hover v-model="buttonHovering">
        <v-btn class="tooltip" fab color="green" dark v-bind="attrs" v-on="on">
          <v-icon>mdi-facebook-workplace</v-icon>
        </v-btn></v-hover
      >

      <!-- this is a hack because tooltip inside a dialog activator template fails -->
      <v-tooltip
        v-model="showToolTip"
        :disabled="!buttonHovering"
        :attach="attachToBtn"
      >
        <span>I work here</span>
      </v-tooltip>
    </template>

    <v-card dark>
      <v-card-title class="headline">{{ name }}</v-card-title>
      <v-card-subtitle>
        Let's open the doors (safely)
      </v-card-subtitle>

      <v-card-text>
        <!-- Shift duration -->
        <v-row>
          <v-col cols="6">
            <v-menu
              ref="menu1"
              v-model="menu1"
              :close-on-content-click="false"
              :nudge-right="40"
              :return-value.sync="openAt"
              transition="scale-transition"
              offset-y
              max-width="290px"
              min-width="290px"
            >
              <template v-slot:activator="{ on, attrs }">
                <v-text-field
                  v-model="openAt"
                  label="Shift starts at hr:min"
                  prepend-icon="access_time"
                  readonly
                  v-bind="attrs"
                  v-on="on"
                ></v-text-field>
              </template>
              <v-time-picker
                v-if="menu1"
                v-model="openAt"
                full-width
                @click:minute="$refs.menu1.save(openAt)"
              ></v-time-picker>
            </v-menu>
          </v-col>
          <v-col cols="6">
            <v-menu
              ref="menu2"
              v-model="menu2"
              :close-on-content-click="false"
              :nudge-right="40"
              :return-value.sync="closeAt"
              transition="scale-transition"
              offset-y
              max-width="290px"
              min-width="290px"
            >
              <template v-slot:activator="{ on, attrs }">
                <v-text-field
                  v-model="closeAt"
                  label="Shift ends at hr:min"
                  prepend-icon="access_time"
                  readonly
                  v-bind="attrs"
                  v-on="on"
                ></v-text-field>
              </template>
              <v-time-picker
                v-if="menu2"
                v-model="closeAt"
                full-width
                @click:minute="$refs.menu2.save(closeAt)"
              ></v-time-picker>
            </v-menu>
          </v-col>
        </v-row>
        <v-switch
          v-model="usesPublicCalendar"
          :label="usesPublicCalendarLabel"
        ></v-switch>
        <!-- Optional settings -->
        <v-row v-if="usesPublicCalendar">
          <v-col>
            <v-text-field
              v-model="slotInterval"
              label="Appointment length?"
              hint="in minutes"
              clearable
            ></v-text-field>
          </v-col>
          <v-col>
            <v-text-field
              v-model="people"
              label="List service providers"
              hint="Separate names with commas"
              clearable
            ></v-text-field>
          </v-col>
        </v-row>

        Ready to get to work?
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>

        <v-btn color="secondary darken-1" text @click="dialog = false">
          Never mind
        </v-btn>

        <v-btn color="secondary darken-1" text @click="onGo">
          Yes
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import Place from '@/models/Place';

export default {
  props: {
    id: String,
  },

  computed: {
    usesPublicCalendarLabel() {
      return `By appointment only. Currently: ${this.usesPublicCalendar.toString()}`;
    },

    place() {
      return Place.find(this.id);
    },

    name() {
      return this.place.name;
    },
  },

  data() {
    return {
      attachToBtn: null,
      buttonHovering: false,
      showToolTip: false,
      dialog: false,
      usesPublicCalendar: false,

      username: '',
      people: '',
      slotInterval: 30,

      openAt: '08:00',
      closeAt: '17:00',
      menu1: false,
      menu2: false,

      rules: [(v) => v?.length > 2 || 'Recommend 3 to 10 characters'],
    };
  },

  methods: {
    onGo() {
      this.dialog = false;
      // localStorage accessed later when usesPublicCalendar is true
      localStorage.setItem('business', this.name);
      localStorage.setItem('usesPublicCalendar', this.usesPublicCalendar);
      localStorage.setItem('people', this.people);
      localStorage.setItem('slotInterval', this.slotInterval);
      localStorage.setItem('openAt', this.openAt);
      localStorage.setItem('closeAt', this.closeAt);
      const data = {
        usesPublicCalendar: this.usesPublicCalendar,
        people: this.people,
        slotInterval: this.slotInterval,
        openAt: this.openAt,
        closeAt: this.closeAt,
      };
      this.$emit('go', data);
    },
  },

  watch: {
    buttonHovering(newVal) {
      this.attachToBtn = document.querySelector('.tooltip');

      this.showToolTip = newVal;
    },

    userName(val, oldVal) {
      if (!oldVal) {
        this.username = 'Anon';
      }
      console.log(val);
    },
  },
  mounted() {
    Place.$fetch();
    this.usesPublicCalendar =
      localStorage.getItem('usesPublicCalendar') || false;
    this.people = localStorage.getItem('people');
    this.slotInterval = localStorage.getItem('slotInterval');
    this.openAt = localStorage.getItem('openAt');
    this.closeAt = localStorage.getItem('closeAt');
  },
};
</script>

<style lang="scss" scoped></style>
