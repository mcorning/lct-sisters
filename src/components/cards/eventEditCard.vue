<template>
  <v-card>
    <v-toolbar :color="selectedEventParsed.input.color" dark dense>
      <v-toolbar-title v-html="selectedEventParsed.input.name" />
      <v-spacer />
      <v-btn @click="onCloseDateTimeCard(0)" icon><v-icon>close</v-icon></v-btn>
    </v-toolbar>
    <v-card-text v-if="!edit">
      <v-row no-gutters align="start">
        <v-col>
          <strong>Visit starts</strong>
          <br />
          {{ currTimes.startDateTimeFormatted }}
        </v-col>
        <v-col co>
          <strong>Visit ends</strong>
          <br />
          {{ currTimes.endDateTimeFormatted }}
        </v-col>
        <v-col  class="text-center">
          <strong>Duration</strong>
          <br />
          <strong>{{ currTimes.duration }}</strong>
        </v-col>
        <v-col  class="text-center">
          <strong>Network</strong>
          <br />
          <strong>{{ currTimes.graphName }}</strong>
        </v-col>
        <v-col cols="1" >
          <v-btn color="primary" icon @click="edit = !edit"
            ><v-icon>edit</v-icon></v-btn
          ></v-col
        >
      </v-row>
    </v-card-text>

    <!-- we pass in an extant event so dateTimeCard acts accordingly -->
    <date-time-card
      v-else
      :selectedEventParsed="selectedEventParsed"
      @closeDateTimeCard="onCloseDateTimeCard"
    ></date-time-card>

    <v-card-actions>
      <v-btn icon color="secondary" @click="deleteEvent">
        <v-icon>delete</v-icon>
      </v-btn>

      <v-spacer />

      <v-tooltip top>
        <template v-slot:activator="{ on, attrs }">
          <v-btn icon v-bind="attrs" v-on="on" color="primary" @click="share">
            <v-icon>share</v-icon>
          </v-btn>
        </template>
        <span>Email this event to others </span>
      </v-tooltip>
    </v-card-actions></v-card
  >
</template>

<script>
import 'vue-scroll-picker/dist/style.css';
import dateTimeCard from './dateTimeCard.vue';
import { DateTime } from '@/utils/luxonHelpers';

export default {
  name: 'eventEditCard',
  props: {
    selectedEventParsed: Object,
    mailToUri: String,
    isConnected: Boolean,
  },
  components: { dateTimeCard },
  computed: {
    currTimes() {
      const startDateString = this.selectedEventParsed.input.date;
      const startTime = this.selectedEventParsed.input.start;
      const endTime = this.selectedEventParsed.input.end;
      const startDT = new DateTime.fromMillis(startTime);
      const endDT = new DateTime.fromMillis(endTime);
      const startDateTimeFormatted = startDT.toLocaleString(DateTime.DATETIME_SHORT);
      const endDateTimeFormatted = endDT.toLocaleString(DateTime.DATETIME_SHORT);
      const diff = endDT.diff(startDT, this.nominalTime).as(this.nominalTime);
      const duration = `${diff} ${this.nominalTime}`;
      const past = this.selectedEventParsed.start.past;
      const present = this.selectedEventParsed.start.present;
      const future = this.selectedEventParsed.start.future;
      const graphName=this.selectedEventParsed.input.graphName
      return {
        startDateTimeFormatted,
        endDateTimeFormatted,
        duration,
        startDateString,
        startTime,
        endTime,
        past,
        present,
        future,
        graphName,
      };
    },
  },
  data() {
    return {
      edit: false,
      nominalTime: 'hours',

      openDateTimeCard: false,
      prefersClock: false,
      startHr: '10',
      startMin: '30',
      endHr: '11',
      endMin: '00',
      timeVal: '10:00',
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
    printJson(json) {
      return JSON.stringify(json, null, 3);
    },
    //#region called by date-time-card
    // TODO use destructured params whenever possible
    onCloseDateTimeCard(newDateTimes) {
      console.log(
        'onCloseDateTimeCard(newDateTimes):',
        this.printJson(newDateTimes)
      );
      this.$emit('closeDateTimeCard', newDateTimes);
    },
    //#endregion called by date-time-card

    getmailToUri() {
      console.log(this.mailToUri);
      return this.mailToUri;
    },
    deleteEvent() {
      this.dirty = false;
      this.$emit('deleteEvent');
    },

    pick(index, editing, dirty) {
      this.editing = editing;
      this.picked = index;
      this.dirty = dirty;
    },

    share() {
      this.dirty = false;
      // TODO do we need this?
      this.$emit('share');
    },
    logEvent() {
      // const start = new Date(
      //   this.pickedDate + ' ' + this.pickedStartTime
      // ).getTime();
      // const end = new Date(
      //   this.pickedDate + ' ' + this.pickedEndTime
      // ).getTime();
      this.dirty = false;
      this.$emit('logEvent', {
        pickedDate: this.pickedDate,
        pickedStartTime: this.pickedStartTime,
        pickedEndTime: this.pickedEndTime,
      });
    },
  },
  watch: {
    selectedEventParsed() {
      console.log('eventEditCard.selectedEventParsed:');
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
