<template>
  <v-container fluid>
    <v-card>
      <v-row dense align="start">
        <v-col>
          <strong>{{ eventLabel }} starts</strong>
          <br />
          {{ shiftStart }}
        </v-col>
        <v-col co>
          <strong>{{ eventLabel }} ends</strong>
          <br />
          {{ shiftEnd }}
        </v-col>
        <v-col cols="3" class="text-center">
          <strong>{{ durationText }}</strong>
          <br />
          <strong>{{ shiftDuration }}</strong>
        </v-col>
        <v-col cols="2" sm="1">
          <v-btn
            v-if="currTimes.todayOnly"
            color="primary"
            icon
            @click="printQR"
            ><v-icon>print</v-icon></v-btn
          >
          <v-btn v-else color="primary" icon @click="update"
            ><v-icon>check</v-icon></v-btn
          >
        </v-col>
      </v-row>
      <v-divider />

      <v-container>
        <v-row align="stretch" no-gutters
          ><v-col class="text-center"
            ><v-btn-toggle v-model="isEndTime" rounded mandatory>
              <v-btn active-class="primary white--text ">
                {{ buttonStartText }} </v-btn
              ><v-btn active-class="primary white--text px-4"
                >Ending Time
              </v-btn>
            </v-btn-toggle></v-col
          ></v-row
        >

        <v-row
          no-gutters
          align="center"
          :style="{
            'font-size': `${fontSize}px`,
          }"
        >
          <v-col
            ><scroll-picker
              v-model="eventDate"
              :options="dateList"
              ref="picker"
            ></scroll-picker>
          </v-col>
          <v-col cols="2">
            <scroll-picker
              v-model="hr"
              :options="[
                '01',
                '02',
                '03',
                '04',
                '05',
                '06',
                '07',
                '08',
                '09',
                '10',
                '11',
                '12',
              ]"
            ></scroll-picker></v-col
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
        <v-row no-gutters
          ><v-col>
            <span class="px-3">Scroll Size: {{ fontSize }}px</span>
            <input
              type="range"
              :min="12"
              :max="28"
              :step="4"
              v-model="fontSize"
              @input="$refs.picker.resize()" /></v-col
        ></v-row>
      </v-container>
    </v-card>
  </v-container>
</template>

<script>
import 'vue-scroll-picker/dist/style.css';
// https://github.com/wan2land/vue-scroll-picker/tree/0.x-vue2
import { ScrollPicker } from 'vue-scroll-picker';
import {
  DateTime,
  datesBack,
  datesAhead,
  isTomorrow,
  isYesterday,
  t,
  tPlusOne,
  roundTime,
} from '@/utils/luxonHelpers';

export default {
  name: 'dateTimeCard',

  props: {
    selectedEventParsed: {
      type: Object,
      default: () => {
        const startMillis = roundTime(t());
        const endMillis = roundTime(tPlusOne(30 * 16));

        const startDateTime = DateTime.fromMillis(startMillis);
        console.assert(
          !startDateTime.invalid,
          startDateTime.invalid?.explanation
        );

        const endDateTime = DateTime.fromMillis(endMillis);
        console.assert(!endDateTime.invalid, endDateTime.invalid?.explanation);

        const date = startDateTime.toISODate();
        const start = startDateTime.toMillis();
        const end = endDateTime.toMillis();
        const todayOnly = true;

        const parsed = {
          input: { date, start, end },
          start: { past: false, present: true, future: false },
          todayOnly,
        };
        console.log('parsed :>> ', parsed);
        return parsed;
      },
    },
    size: { type: Number, default: () => 28 },
  },
  components: { ScrollPicker },
  computed: {
    buttonStartText() {
      return this.$vuetify.breakpoint.xs ? 'Start' : 'Starting Time';
    },
    buttonEndText() {
      return this.$vuetify.breakpoint.xs ? 'End' : 'Ending Time';
    },
    durationText() {
      return this.$vuetify.breakpoint.xs ? 'Hours' : 'Duration';
    },

    // TODO harden this code against NaN start/end integers
    currTimes() {
      const startDateString = this.selectedEventParsed.input.date;
      const startTime = this.selectedEventParsed.input.start;
      const endTime = this.selectedEventParsed.input.end;

      const past = this.selectedEventParsed.start.past;
      const present = this.selectedEventParsed.start.present;
      const future = this.selectedEventParsed.start.future;
      const todayOnly = this.selectedEventParsed.todayOnly;

      return {
        startDateString,
        startTime,
        endTime,
        past,
        present,
        future,
        todayOnly,
      };
    },
    eventLabel() {
      return this.selectedEventParsed ? 'Visit' : 'Shift';
    },

    shiftStart() {
      return this.startDateTimeNew?.toFormat(this.localizedDateFormat);
    },
    shiftEnd() {
      return this.endDateTimeNew?.toFormat(this.localizedDateFormat);
    },
    shiftDuration() {
      const diff = this.endDateTimeNew
        ?.diff(this.startDateTimeNew, this.nominalTime)
        .as(this.nominalTime);
      return `${diff} ${this.nominalTime}`;
    },

    defaultFontSize() {
      const s = this.size ?? 28;
      return this.$vuetify.breakpoint.smAndUp ? s : 20;
    },

    formattedDate() {
      return this.start?.date ?? '';
    },
    dateList() {
      if (this.currTimes.todayOnly) {
        return ['Today'];
      }
      const backDates = datesBack(11);
      return [
        ...backDates,
        'Yesterday',
        'Today',
        'Tomorrow',
        ...datesAhead(30),
      ];
    },

    hoursList() {
      return [...Array(12).keys()].map((v) => (v + 1).toString());
    },
  },
  data() {
    return {
      nominalTime: 'hours',
      eventSummary: '',
      fontSize: this.size,

      fromEventFormat: 'y-LL-dd hh mm a', // e.g., 2021-11-10 01 00 PM
      localizedDateFormat: 'DD hh mm a', //shortest localized date and time: e.g., Nov 10, 2021 1:07 PM
      ISODateFormat: 'y-LL-dd', // e.g., 2021-11-10
      abbreviatedMonthDateFormat: 'DD',
      startDateTime: null,
      endDateTime: null,
      startDateTimeNew: null,
      endDateTimeNew: null,

      start: { date: '', hr: '', min: '', meridiem: '' },
      end: { date: '', hr: '', min: '', meridiem: '' },

      isEndTime: 0, // this is a toggle value: start=0 end=1
      eventDate: '',
      hr: '',
      min: '',
      meridiem: '',

      dateString: '',
      ready: false,
    };
  },
  methods: {
    printQR() {
      this.$emit('printQR');
    },
    printJson(json) {
      return JSON.stringify(json, null, 3);
    },
    getEventDateString(val) {
      switch (val) {
        case 'Today':
          return DateTime.now().toFormat(this.abbreviatedMonthDateFormat);
        case 'Tomorrow':
          return DateTime.now()
            .plus({ days: 1 })
            .toFormat(this.abbreviatedMonthDateFormat);
        case 'Yesterday':
          return DateTime.now()
            .minus({ days: 1 })
            .toFormat(this.abbreviatedMonthDateFormat);

        default:
          // val is already in abbreviatedMonthDateFormat
          return val;
      }
    },

    updateNewDateTime() {
      /*
      This gets called when we start up where the start.date is ISO format, so convert to localizedFormat before it gets here
      */
      if (this.ready) {
        let string = `${this.getEventDateString(this.start.date)} ${
          this.start.hr
        } ${this.start.min} ${this.start.meridiem}`;

        this.startDateTimeNew = DateTime.fromFormat(
          string,
          this.localizedDateFormat
        );
        console.assert(
          !this.startDateTime.invalid,
          this.startDateTime.invalid?.explanation
        );

        string = `${this.getEventDateString(this.end.date)} ${this.end.hr} ${
          this.end.min
        } ${this.end.meridiem}`;
        this.endDateTimeNew = DateTime.fromFormat(
          string,
          this.localizedDateFormat
        );
        console.assert(
          !this.endDateTime.invalid,
          this.endDateTime.invalid?.explanation
        );

        const diff = this.endDateTimeNew
          .diff(this.startDateTimeNew, this.nominalTime)
          .as(this.nominalTime);

        return `Log your shift from <br/>
        ${this.startDateTimeNew.toFormat(this.localizedDateFormat)} to <br/>
        ${this.endDateTimeNew.toFormat(
          this.localizedDateFormat
        )} [<strong>${diff} ${this.nominalTime}</strong>]`;
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

    // give infoWindowCard or Calendar that data needed to update the QR code and the URI or the event and graph

    updatePanel() {
      this.eventSummary = this.updateNewDateTime();
      console.log('eventSummary', this.printJson(this.eventSummary));
      if (this.currTimes.todayOnly) {
        this.update();
      }
    },
    update() {
      // this.start.date is in localized format. return it to ISO for storage
      const localDt = DateTime.fromFormat(
        this.start.date,
        this.abbreviatedMonthDateFormat
      );
      console.assert(!localDt.invalid, localDt.invalid?.explanation);

      const date = localDt.toISODate();
      this.$emit('closeDateTimeCard', {
        date,
        start: this.startDateTimeNew.toMillis(),
        end: this.endDateTimeNew.toMillis(),
      });
    },

    // only happens once when we open the vue
    // currTimes will store the date in ISO format, so we need to convert that to picker format
    fixDates() {
      const { startDateString, startTime, endTime, present } = this.currTimes;
      function checkForTomorrow() {
        return isTomorrow(startDateString) ? 'Tomorrow' : checkFormYesterday();
      }
      function checkFormYesterday() {
        return isYesterday(startDateString)
          ? 'Yesterday'
          : // ultimately we change the ISO date to a localized date string format
            DateTime.fromISO(startDateString).toFormat(
              this.abbreviatedMonthDateFormat
            );
      }
      this.eventDate = present ? 'Today' : checkForTomorrow();

      const startMillis = startTime ?? roundTime(t());
      const endMillis = endTime ?? roundTime(tPlusOne(30 * 16));
      this.startDateTime = DateTime.fromMillis(startMillis);
      console.assert(
        !this.startDateTime.invalid,
        this.startDateTime.invalid?.explanation
      );

      this.endDateTime = DateTime.fromMillis(endMillis);
      console.assert(
        !this.endDateTime.invalid,
        this.endDateTime.invalid?.explanation
      );

      this.startDateTimeNew = this.startDateTime;
      this.endDateTimeNew = this.endDateTime;

      this.start = {
        date: this.eventDate,
        hr: this.startDateTime.toFormat('hh'),
        min: this.startDateTime.toFormat('mm'),
        meridiem: this.startDateTime.toFormat('a'),
      };

      this.end = {
        date: this.eventDate, // this is not true if event crosses midnight
        hr: this.endDateTime.toFormat('hh'),
        min: this.endDateTime.toFormat('mm'),
        meridiem: this.endDateTime.toFormat('a'),
      };
      console.log('this.start:', this.printJson(this.start));
      console.log('this.end:', this.printJson(this.end));

      this.hr = this.start.hr;
      this.min = this.start.min;
      this.meridiem = this.start.meridiem;

      this.ready = true;
    },
  },
  watch: {
    ready() {
      this.fontSize = this.defaultFontSize;
      console.log(this.ready, this.hr);
    },
    eventDate(val) {
      const dateString = this.getEventDateString(val);
      // for now, we assume start/end dates are the same
      // if (this.isEndTime) {
      this.end.date = dateString;
      // } else {
      this.start.date = dateString;
      // }
      this.updatePanel();
    },
    hr() {
      // end is when isEndTime
      if (this.isEndTime) {
        this.end.hr = this.hr;
      } else {
        this.start.hr = this.hr;
      }
      this.updatePanel();
    },
    min() {
      // end is when isEndTime
      if (this.isEndTime) {
        this.end.min = this.min;
      } else {
        this.start.min = this.min;
      }
      this.updatePanel();
    },
    meridiem() {
      // end is when isEndTime
      if (this.isEndTime) {
        this.end.meridiem = this.meridiem;
      } else {
        this.start.meridiem = this.meridiem;
      }
      this.updatePanel();
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
  background-color: #353538;
  color: lightgrey;
}
</style>
