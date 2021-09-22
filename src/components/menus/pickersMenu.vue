<template>
  <div>
    <v-card>
      <v-toolbar :color="selectedEventParsed.input.color" dark>
        <v-toolbar-title
          v-html="selectedEventParsed.input.name"
        ></v-toolbar-title>
        <v-spacer></v-spacer>
      </v-toolbar>
      <v-card-subtitle
        >Click the Date, Starting, or Ending fields to edit date
        times.</v-card-subtitle
      >
      <v-row justify="space-around" align="center" no-gutters>
        <v-col cols="4">
          <v-text-field
            v-model="pickedDate"
            label="Date"
            prepend-icon="event"
            readonly
            @click="pick(1, true, false)"
          ></v-text-field>
        </v-col>
        <v-col cols="3">
          <v-text-field
            v-model="pickedStartTime"
            label="Starting"
            prepend-icon="mdi-clock-time-on-outline"
            readonly
            @click="pick(2, true, false)"
          ></v-text-field>
        </v-col>
        <v-col cols="3">
          <v-text-field
            v-model="pickedEndTime"
            label="Ending"
            prepend-icon="mdi-clock-time-four-outline"
            readonly
            @click="pick(3, true, false)"
          ></v-text-field>
        </v-col>
        <v-date-picker v-if="picked == 1" v-model="pickedDate">
          <v-spacer></v-spacer>
          <v-btn text color="primary" @click="pick(0, false, false)">
            Cancel
          </v-btn>
          <v-btn text color="primary" @click="pick(0, false, true)">
            OK
          </v-btn></v-date-picker
        >
        <v-time-picker
          v-if="picked == 2"
          v-model="pickedStartTime"
          :max="pickedEndTime"
        >
          <v-spacer></v-spacer>
          <v-btn text color="primary" @click="pick(0, false, false)">
            Cancel
          </v-btn>
          <v-btn text color="primary" @click="pick(0, false, true)">
            OK
          </v-btn></v-time-picker
        >
        <v-time-picker
          v-if="picked == 3"
          v-model="pickedEndTime"
          :min="pickedStartTime"
        >
          <v-spacer></v-spacer>
          <v-btn text color="primary" @click="pick(0, false, false)">
            Cancel
          </v-btn>
          <v-btn text color="primary" @click="pick(0, false, true)">
            OK
          </v-btn></v-time-picker
        >
      </v-row>
      <v-divider/>
      <v-card-actions v-if="!editing">
        <v-btn dark @click="noDateTime"> Cancel </v-btn>
        <v-btn dark @click="deleteEvent"> Delete </v-btn>
        <v-spacer />
        <v-btn v-if="dirty" color="primary" @click="newDateTime">
          Update
        </v-btn>
        <v-btn
          v-if="!selectedEventParsed.input.loggedVisitId"
          dark
          color="secondary"
          @click="logEvent"
        >
          Log
        </v-btn>
        <v-btn dark color="secondary" @click="share">
          Share
        </v-btn>
      </v-card-actions></v-card
    >
  </div>
</template>

<script>
export default {
  name: 'pickersMenu',
  props: {
    selectedEventParsed: Object,
  },
  data() {
    return {
      banner: false,
      editing: false,
      dirty: false,
      picked: 0,
      pickDate: false,
      pickStartTime: false,
      pickedDate: null,
      pickedStartTime: null,
      pickedEndTime: null,
    };
  },
  methods: {
    deleteEvent(){
      this.dirty = false;
      this.$emit('deleteEvent');
      // this.$emit('noDateTime');

    },

    pick(index, editing, dirty) {
      this.editing = editing;
      this.picked = index;
      this.dirty = dirty;
    },

    newDateTime() {
      const start = new Date(
        this.pickedDate + ' ' + this.pickedStartTime
      ).getTime();
      const end = new Date(
        this.pickedDate + ' ' + this.pickedEndTime
      ).getTime();
      this.dirty = false;
      this.$emit('newDateTime', { date: this.pickedDate, start, end });
    },
    noDateTime() {
      this.dirty = false;
      this.$emit('noDateTime');
    },
    share() {
      this.dirty = false;
      this.$emit('share');
    },
    logEvent() {
      const start = new Date(
        this.pickedDate + ' ' + this.pickedStartTime
      ).getTime();
      const end = new Date(
        this.pickedDate + ' ' + this.pickedEndTime
      ).getTime();
      this.dirty = false;
      this.$emit('logEvent', { date: this.pickedDate, start, end });
    },
  },
  watch: {
    selectedEventParsed() {
      console.log('pickersMenu.selectedEventParsed:');
      console.log(JSON.stringify(this.selectedEventParsed.input, null, 3));
    },
  },
  mounted() {
    const vm = this;
    vm.pickedDate = vm.selectedEventParsed.start.date;

    vm.pickedStartTime = vm.selectedEventParsed.start.time;
    vm.pickedEndTime = vm.selectedEventParsed.end.time;
  },
};
</script>
