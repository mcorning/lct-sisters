<template>
  <v-card>
    <v-hover v-slot="{ hover }">
      <v-toolbar :color="selectedEventParsed.input.color" dark dense>
        <v-toolbar-title v-html="selectedEventParsed.input.name" />
        <v-spacer />
        <v-expand-transition>
          <div
            v-if="hover"
            class="d-flex transition-fast-in-fast-out primary darken-2 v-card--reveal text-body2 white--text ma-3 pa-3"
          >
            Enlarge Event's QR code
          </div>
        </v-expand-transition>

        <v-btn text @click="$emit('enlargeQR')">
          <v-icon>qr_code_2</v-icon>
        </v-btn>
      </v-toolbar>
    </v-hover>
    <date-time-card
      :currDate="currDate"
      :currTimes="currTimes"
      :dateList="dateList"
      @closeDateTimeCard="onCloseDateTimeCard"
      @updateDateTimes="onUpdateDateTimes"
    ></date-time-card>
    <v-card-actions>
      <!-- <v-btn dark @click="noDateTime"> <v-icon>close</v-icon> </v-btn> -->
      <v-btn color="secondary" @click="deleteEvent">
        <v-icon>delete</v-icon>
      </v-btn>
      <v-spacer />
      <!-- <v-tooltip top>
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              v-bind="attrs"
              v-on="on"
              v-show="dirty"
              color="primary"
              @click="newDateTime"
            >
              <v-icon>save</v-icon>
            </v-btn>
          </template>
          <span>Save changes to your database</span>
        </v-tooltip> -->
      <!-- <v-spacer /> -->
      <v-tooltip top>
        <template v-slot:activator="{ on, attrs }">
          <v-btn v-bind="attrs" v-on="on" color="primary" @click="share">
            <v-icon>share</v-icon>
          </v-btn>
        </template>
        <span>Email this event to others </span>
      </v-tooltip>
      <!-- <v-tooltip top>
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              v-bind="attrs"
              v-on="on"
              v-if="!selectedEventParsed.input.loggedVisitId"
              :disabled="!isConnected"
              color="primary"
              @click="logEvent"
            >
              <v-icon>cloud_done</v-icon>
            </v-btn>
          </template>
          <span>Finish the workflow </span>
        </v-tooltip> -->
    </v-card-actions></v-card
  >
</template>

<script>
import 'vue-scroll-picker/dist/style.css';
import DateTimeCard from './dateTimeCard.vue';
import { DateTime } from '@/utils/luxonHelpers';

export default {
  name: 'eventEditCard',
  props: {
    selectedEventParsed: Object,
    mailToUri: String,
    isConnected: Boolean,
  },
  components: { DateTimeCard },
  computed: {
    dateList() {
      return ['Yesterday', 'Today', 'Tomorrow'];
    },
    currDate() {
      return DateTime.now().toFormat("ccc ',' DD");
    },

    currTimes() {
      if (!this.selectedEventParsed) {
        return null;
      }
      const start = this.selectedEventParsed.start.time;
      const end = this.selectedEventParsed?.end.time;
      const past = this.selectedEventParsed.start.past;
      const present = this.selectedEventParsed.start.present;
      const future = this.selectedEventParsed.start.future;
      return {
        start,
        end,
        past,
        present,
        future,
      };
    },
  },
  data() {
    return {
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
    //#region called by date-time-card
    onCloseDateTimeCard(newDateTimes) {
      this.$emit('closeDateTimeCard', newDateTimes);
    },
    onUpdateDateTimes() {},
    //#endregion called by date-time-card

    getmailToUri() {
      console.log(this.mailToUri);
      return this.mailToUri;
    },
    deleteEvent() {
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
      this.dirty = false;
      this.$emit('newDateTime', {
        pickedDate: this.pickedDate,
        pickedStartTime: this.pickedStartTime,
        pickedEndTime: this.pickedEndTime,
      });
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
