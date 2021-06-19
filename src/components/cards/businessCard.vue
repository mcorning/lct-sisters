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
      <v-card-title class="headline">{{ business }}</v-card-title>
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
                  v-model="openAtX"
                  label="Shift starts at hr:min"
                  prepend-icon="access_time"
                  readonly
                  v-bind="attrs"
                  v-on="on"
                ></v-text-field>
              </template>
              <v-time-picker
                v-if="menu1"
                v-model="openAtX"
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
                  v-model="closeAtX"
                  label="Shift ends at hr:min"
                  prepend-icon="access_time"
                  readonly
                  v-bind="attrs"
                  v-on="on"
                ></v-text-field>
              </template>
              <v-time-picker
                v-if="menu2"
                v-model="closeAtX"
                full-width
                @click:minute="$refs.menu2.save(closeAt)"
              ></v-time-picker>
            </v-menu>
          </v-col>
        </v-row>
        <v-switch
          v-model="usesPublicCalendarX"
          :label="usesPublicCalendarLabel"
        ></v-switch>
        <!-- Optional settings -->
        <v-row v-if="usesPublicCalendar">
          <v-col>
            <v-text-field
              v-model="slotIntervalX"
              label="Appointment length?"
              hint="in minutes"
              clearable
            ></v-text-field>
          </v-col>
          <v-col>
            <v-text-field
              v-model="peopleX"
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
    id: {
      type: String,
      default: '',
    },
    usesPublicCalendar: {
      type: Boolean,
      default: false,
    },
    username: {
      type: String,
      default: '',
    },
    business: {
      type: String,
      default: '',
    },
    people: {
      type: String,
      default: '',
    },
    slotInterval: {
      type: Number,
      default: 30,
    },
    openAt: {
      type: String,
      default: '08:00',
    },
    closeAt: {
      type: String,
      default: '17:00',
    },
  },

  computed: {
    usesPublicCalendarLabel() {
      return `By appointment only. Currently: ${this.usesPublicCalendar.toString()}`;
    },
  },

  data() {
    return {
      attachToBtn: null,
      buttonHovering: false,
      showToolTip: false,
      dialog: false,
      menu1: false,
      menu2: false,

      rules: [(v) => v?.length > 2 || 'Recommend 3 to 10 characters'],

      usesPublicCalendarX: this.usesPublicCalendar,
      peopleX: this.people,
      slotIntervalX: this.slotInterval,
      openAtX: this.openAt,
      closeAtX: this.closeAt,
    };
  },

  methods: {
    onGo() {
      this.dialog = false;
      localStorage.setItem('business', this.business);
      localStorage.setItem('usesPublicCalendar', this.usesPublicCalendar);
      localStorage.setItem('people', this.people);
      localStorage.setItem('slotInterval', this.slotInterval);
      localStorage.setItem('openAt', this.openAt);
      localStorage.setItem('closeAt', this.closeAt);

      // State accessed later when usesPublicCalendar is true
      const data = {
        usesPublicCalendar: this.usesPublicCalendarX,
        people: this.peopleX,
        slotInterval: this.slotIntervalX,
        openAt: this.openAtX,
        closeAt: this.closeAtX,
      };
      // pass back to Welcome.vue
      this.$emit('go', data);
    },
  },

  watch: {
    buttonHovering(newVal) {
      this.attachToBtn = document.querySelector('.tooltip');

      this.showToolTip = newVal;
    },
  },
  mounted() {
    Place.$fetch();
  },
};
</script>

<style lang="scss" scoped></style>
