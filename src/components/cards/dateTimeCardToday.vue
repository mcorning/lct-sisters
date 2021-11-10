<template>
  <v-container fluid>
    <v-card>
      <v-row dense align="start">
        <v-col>
          <strong>Shift starts</strong>
          <br />
          {{ shiftStart }}
        </v-col>
        <v-col co>
          <strong>Shift ends</strong>
          <br />
          {{ shiftEnd }}
        </v-col>
        <v-col cols="3" class="text-center">
          <strong>Duration</strong>
          <br />
          <strong>{{ shiftDuration }}</strong>
        </v-col>
        <v-col cols="2" sm="1">
          <v-btn color="primary" icon @click="edit = !edit"
            ><v-icon>edit</v-icon></v-btn
          ></v-col
        >
      </v-row>
      <v-divider />

      <v-container v-if="edit">
        <v-row align="stretch"
          ><v-col
            ><v-btn-toggle v-model="isEndTime">
              <v-btn
                active-class="primary white--text pa-0"
                :block="$vuetify.breakpoint.smAndUp"
                >Start time</v-btn
              ><v-btn
                active-class="primary white--text"
                :block="$vuetify.breakpoint.smAndUp"
                >Ending time</v-btn
              >
            </v-btn-toggle></v-col
          ></v-row
        >

        <v-row
          align="center"
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
        <v-row
          ><v-col>
            <span class="px-3">Scroll Size: {{ fontSize }}px</span>
            <input
              type="range"
              :min="12"
              :max="28"
              :step="4"
              v-model="fontSize"
              @input="$refs.picker.resize()"/></v-col
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
  todayAsISO,
  formatDateWithToken,
  t,
  tPlusOne,
  roundTime,
} from '@/utils/luxonHelpers';

export default {
  name: 'dateTimeCardToday',

  props: {
    selectedEventParsed: Object,
    size: { type: Number, default: () => 28 },
  },
  components: { ScrollPicker },
  computed: {
    shiftStart() {
      return this.startDateTimeNew?.toFormat(this.toFormat);
    },
    shiftEnd() {
      return this.endDateTimeNew?.toFormat(this.toFormat);
    },
    shiftDuration() {
      const diff = this.endDateTimeNew
        ?.diff(this.startDateTimeNew, this.nominalTime)
        .as(this.nominalTime);
      return `${diff} ${this.nominalTime}`;
    },

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
      return ['today'];
    },

    hoursList() {
      return [...Array(12).keys()].map((v) => (v + 1).toString());
    },
  },
  data() {
    return {
      edit: false,
      nominalTime: 'hours',
      eventSummary: '',
      fontSize: this.size,
      fromFormat: 'DD hh mm a', // used only in updateNewDateTime() [may be a better way]
      toFormat: 'ff', //less short localized date and time: e.g., Nov 10, 2021, 1:07 PM

      startDateTime: null,
      endDateTime: null,
      startDateTimeNew: null,
      endDateTimeNew: null,

      start: { date: '', hr: '', min: '', meridiem: '' },
      end: { date: '', hr: '', min: '', meridiem: '' },

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

        this.startDateTimeNew = DateTime.fromFormat(string, this.fromFormat);

        string = `${this.end.date} ${this.end.hr} ${this.end.min} ${this.end.meridiem}`;
        this.endDateTimeNew = DateTime.fromFormat(string, this.fromFormat);

        const diff = this.endDateTimeNew
          .diff(this.startDateTimeNew, this.nominalTime)
          .as(this.nominalTime);

        const x = `Log your shift from <br/>
        ${this.startDateTimeNew.toFormat(this.toFormat)} to <br/>
        ${this.endDateTimeNew.toFormat(this.toFormat)} [<strong>${diff} ${
          this.nominalTime
        }</strong>]`;

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

    // give infoWindowCard or Calendar that data needed to update the QR code and the URI or the event and graph

    update() {
      this.eventSummary = this.updateNewDateTime();
      this.$emit('closeDateTimeCard', {
        date: this.formattedDate,
        start: this.startDateTimeNew,
        end: this.endDateTimeNew,
      });
    },

    fixDates() {
      const startMillis = this.selectedEventParsed
        ? this.selectedEventParsed.input.start
        : roundTime(t());
      const endMillis = this.selectedEventParsed
        ? this.selectedEventParsed.input.end
        : roundTime(tPlusOne(30 * 16));
      this.startDateTime = DateTime.fromMillis(startMillis);
      this.endDateTime = DateTime.fromMillis(endMillis);

      this.startDateTimeNew = this.startDateTime;
      this.endDateTimeNew = this.endDateTime;

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
  background-color: #353538;
  color: lightgrey;
}
</style>
