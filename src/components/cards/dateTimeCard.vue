<template>
  <v-card flat>
    <v-row justify="space-between" dense>
      <v-col cols="1">
        <v-icon @click="close">close</v-icon>
      </v-col>
      <v-col cols="auto">
        <span class="text-h7 text-center">Change from: {{ eventSummary }}</span>
      </v-col>
      <v-col cols="1">
        <v-icon @click="update">check</v-icon>
      </v-col>
    </v-row>
    <v-row dense
      ><v-spacer /><v-col
        ><v-btn-toggle v-model="isEndTime" rounded>
          <v-btn
            active-class="primary white--text pa-0"
            :block="$vuetify.breakpoint.smAndUp"
            >Start time</v-btn
          ><v-btn
            active-class="primary white--text pa-0"
            :block="$vuetify.breakpoint.smAndUp"
            >Ending time</v-btn
          >
        </v-btn-toggle></v-col
      ><v-spacer
    /></v-row>

    <v-row
      align="center"
      dense
      :style="{
        'font-size': `${fontSize}px`,
      }"
    >
      <v-col
        ><scroll-picker
          v-model="newDate"
          :options="dateList"
          ref="picker"
        ></scroll-picker>
      </v-col>
      <v-col cols="2">
        <scroll-picker v-model="hr" :options="hoursList"></scroll-picker></v-col
      ><v-col cols="2"
        ><scroll-picker
          v-model="min"
          :options="['00', '15', '30', '45']"
        ></scroll-picker>
      </v-col>
      <v-col cols="2"
        ><scroll-picker
          v-model="meridiem"
          :options="['AM', 'PM']"
        ></scroll-picker
      ></v-col>
    </v-row>

    <v-card-subtitle class="text-center"
      >to: {{ eventSummary }}</v-card-subtitle
    >
    <v-row
      ><v-col>
        <span class="px-3">Font Size: {{ fontSize }}px</span>
        <input
          type="range"
          :min="12"
          :max="28"
          :step="4"
          v-model="fontSize"
          @input="$refs.picker.resize()"/></v-col
    ></v-row>
  </v-card>
</template>

<script>
import 'vue-scroll-picker/dist/style.css';
import { ScrollPicker } from 'vue-scroll-picker';
import {
  DateTime,
  datesBack,
  datesAhead,
  todayAsISO,
  yesterdayAsISO,
  tomorrowAsISO,
  formatDateAsISO,
  formatDateWithToken,
  t,
  tPlusOne,
  roundTime,
} from '@/utils/luxonHelpers';

export default {
  name: 'dateTimeCard',

  props: {
    size: { type: Number, default: () => 28 },
    selectedEventParsed: Object,
  },
  components: { ScrollPicker },
  computed: {
    defaultFontSize() {
      const s = this.size ?? 28;
      const x = this.$vuetify.breakpoint.smAndUp ? s : 12;
      return x;
    },

    formattedDate() {
      return this.dateString
        ? formatDateWithToken(this.dateString, DateTime.DATE_MED)
        : '';
    },

    dateList() {
      const backDates = datesBack(7);
      return [
        ...backDates,
        'Yesterday',
        'Today',
        'Tomorrow',
        ...datesAhead(30),
      ];
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

    hoursList() {
      return [...Array(12).keys()].map((v) => (v + 1).toString());
    },
  },
  data() {
    return {
      eventSummary: '',
      fontSize: this.size,
      edit: false,
      fromFormat: 'DD hh mm a',
      toFormat: 'ff',

      startDateTime: null,
      endDateTime: null,
      start: { date: '', hr: '', min: '', meridiem: '' },
      end: { date: '', hr: '', min: '', meridiem: '' },
      endNew: null,
      startNew: null,

      isEndTime: 0, // this is a toggle value: start=0 end=1
      newDate: 'Today',
      hr: '',
      min: '',
      meridiem: '',

      dateString: '',
      ready: false,
    };
  },
  methods: {
    updateNewDateTime() {
      if (this.ready) {
        let string = `${this.start.date} ${this.start.hr} ${this.start.min} ${this.start.meridiem}`;
        this.newStart = DateTime.fromFormat(string, this.fromFormat);

        string = `${this.end.date} ${this.end.hr} ${this.end.min} ${this.end.meridiem}`;
        this.newEnd = DateTime.fromFormat(string, this.fromFormat);

        const diff = this.newEnd.diff(this.newStart, 'hours').as('hours');

        const x = `From ${this.newStart.toFormat(
          this.toFormat
        )} to ${this.newEnd.toFormat(this.toFormat)} [${diff} hours]`;

        return x;
      }
      return this.formattedDate;
    },
    close() {
      this.$emit('closeDateTimeCard', 0);
    },
    getDateString(x) {
      const { hr, min, meridiem } = x;
      return `${hr}:${min} ${meridiem}`;
    },

    // give eventEditCard then Calendar data needed to update the Event
    update() {
      this.eventSummary = this.updateNewDateTime();
      this.$emit('closeDateTimeCard', {
        date: this.formattedDate,
        start: this.newStart.toMillis(),
        end: this.newEnd.toMillis(),
      });
    },

    fixDates() {
      const { past, present } = this.currTimes;
      this.newDate = present ? 'Today' : past ? 'Yesterday' : 'Tomorrow';
      this.convertNewDate();
      this.startDateTime = DateTime.fromMillis(roundTime(t()));
      this.endDateTime = DateTime.fromMillis(roundTime(tPlusOne()));
      this.newStart = this.startDateTime;
      this.newEnd = this.endDateTime;

      this.start = {
        date: this.startDateTime.toFormat('DD'),
        hr: this.startDateTime.toFormat('hh'),
        min: this.startDateTime.toFormat('mm'),
        meridiem: this.startDateTime.toFormat('a'),
      };

      this.end = {
        date: this.endDateTime.toFormat('DD'),
        hr: this.endDateTime.toFormat('hh'),
        min: this.endDateTime.toFormat('mm'),
        meridiem: this.endDateTime.toFormat('a'),
      };
      this.hr = this.start.hr;
      this.min = this.start.min;
      this.dateString = todayAsISO();

      this.ready = true;
    },
    convertNewDate() {
      this.dateString =
        this.newDate === 'Today'
          ? todayAsISO()
          : this.newDate === 'Yesterday'
          ? yesterdayAsISO()
          : this.newDate === 'Tomorrow'
          ? tomorrowAsISO()
          : formatDateAsISO(new Date(this.newDate));
    },
  },
  watch: {
    ready() {
      this.fontSize = this.defaultFontSize;
      console.log(this.ready, this.hr);
    },
    hr() {
      // end is when isEndTime
      if (this.isEndTime) {
        this.end.hr = this.hr;
      } else {
        this.start.hr = this.hr;
      }
      this.update();
    },
    min() {
      // end is when isEndTime
      if (this.isEndTime) {
        this.end.min = this.min;
      } else {
        this.start.min = this.min;
      }
      this.update();
    },
    meridiem() {
      // end is when isEndTime
      if (this.isEndTime) {
        this.end.meridiem = this.meridiem;
      } else {
        this.start.meridiem = this.meridiem;
      }
      this.update();
    },

    isEndTime() {
      if (this.isEndTime) {
        this.min = this.end.min;
        this.hr = this.end.hr;
        this.meridiem = this.end.meridiem;
      } else {
        this.min = this.start.min;
        this.hr = this.start.hr;
        this.meridiem = this.start.meridiem;
      }
    },
  },
  mounted() {
    this.fixDates();
  },
};
</script>

<style lang="scss" scoped>
.picker {
  background-color: #212122;
  color: lightgrey;
}
</style>
