<template>
  <v-container fluid>
    <v-row dense align="center">
      <v-col>
        <v-card-text class="text-center">
          Share Event: {{ newDateTime }}
        </v-card-text>
      </v-col>
      <v-col cols="1">
        <v-btn icon @click="edit = !edit"><v-icon>edit</v-icon></v-btn></v-col
      >
    </v-row>
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
        v-if="ready"
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
    </v-container>

    <!-- TODO CONSIDER: making this responsive for phones -->
    <!-- <v-row
      ><v-col>
        <span class="px-3">Font Size: {{ fontSize }}px</span>
        <input
          type="range"
          :min="16"
          :max="32"
          :step="4"
          v-model="fontSize"
          @input="$refs.picker.resize()"/></v-col
    ></v-row> -->
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
    size: { type: Number, default: () => 28 },
  },
  components: { ScrollPicker },
  computed: {
    isSmOrMore() {
      const x = this.$vuetify.breakpoint.smAndUp;
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
      fromFormat: 'DD hh mm a',
      toFormat: 'ff',
      fontSize: this.size,
      startDateTime: null,
      endDateTime: null,
      start: { date: '', hr: '', min: '', meridiem: '' },
      end: { date: '', hr: '', min: '', meridiem: '' },
      endNew: null,
      startNew: null,

      isEndTime: 0, // this is a toggle value: start=0 end=1
      newDate: 'Today',
      hr: '03',
      min: '',
      meridiem: '',

      dateString: '',
      ready: false,
      newDateTime: '',
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

    // give infoWindowCard that data it needs to update the QR code and the URI
    update() {
      const startString = this.getDateString(this.start);
      const endString = this.getDateString(this.end);
      this.newDateTime = this.updateNewDateTime();
      this.$emit('closeDateTimeCard', { startString, endString });
    },

    fixDates() {
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
  },
  watch: {
    ready() {
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
    console.log(this.start);
  },
};
</script>

<style lang="scss" scoped>
.picker {
  background-color: #353538;
  color: lightgrey;
}
</style>
