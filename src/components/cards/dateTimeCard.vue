<template>
  <v-card flat>
    <v-row justify="space-between" dense>
      <v-col cols="1">
        <v-icon @click="close">close</v-icon>
      </v-col>
      <v-col cols="auto">
        <span class="text-h7 text-center">Change from: {{ currDate }}</span>
      </v-col>
      <v-col cols="1">
        <v-icon @click="update">check</v-icon>
      </v-col>
    </v-row>
    <v-row dense
      ><v-spacer /><v-col
        ><v-btn-toggle v-model="isEndTime" rounded>
          <v-btn>Start time</v-btn><v-btn>Ending time</v-btn>
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
          :options="readyDateList"
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
        ><scroll-picker v-model="amPm" :options="['AM', 'PM']"></scroll-picker
      ></v-col>
    </v-row>

    <v-card-subtitle class="text-center">to: {{ newDateTime }}</v-card-subtitle>
    <v-row
      ><v-col>
        <span class="px-3">Font Size: {{ fontSize }}px</span>
        <input
          type="range"
          :min="16"
          :max="36"
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
  todayAsISO,
  yesterdayAsISO,
  tomorrowAsISO,
  formatDateWithToken,
  formatDateAsISO,
} from '@/utils/luxonHelpers';

export default {
  name: 'dateTimeCard',

  props: {
    currDate: String,
    currTimes: { type: Object, required: true },
    dateList: Array,
  },
  components: { ScrollPicker },
  computed: {
    formattedDate() {
      return this.dateStruct.dateString
        ? formatDateWithToken(this.dateStruct.dateString, DateTime.DATE_MED)
        : '';
    },
    readyDateList() {
      if (!this.ready) {
        return [];
      }
      return this.dateList;
    },

    newDateTime() {
      const x = `${this.formattedDate} from ${this.dateStruct.start.hr}:${this.dateStruct.start.min} ${this.dateStruct.start.amPm} to ${this.dateStruct.end.hr}:${this.dateStruct.end.min} ${this.dateStruct.end.amPm}`;
      return x;
    },
    hoursList() {
      return [...Array(12).keys()].map((v) => (v + 1).toString());
    },
  },
  data() {
    return {
      fontSize: 24,
      dateStruct: {
        dateString: '',
        start: { hr: '', min: '', amPm: '' },
        end: { hr: '', min: '', amPm: '' },
        startTime: 0,
        endTime: 0,
      },
      ready: false,
      isEndTime: 0, // this is a toggle value: start=0 end=1
      newDate: 'Today',
      hr: '',
      min: '',
      amPm: '',
    };
  },
  methods: {
    close() {
      this.$emit('closeDateTimeCard',0);
    },
    update() {
      // send the date as string
      // create ms for start and end based on picker
      const dt = DateTime.fromISO(this.dateStruct.dateString);
      const start = dt.set({
        hours:
          this.dateStruct.start.amPm === 'PM'
            ? Number(this.dateStruct.start.hr) + 12
            : this.dateStruct.start.hr,
        minutes: this.dateStruct.start.min,
      });
      const end = dt.set({
        hours:
          this.dateStruct.end.amPm === 'PM'
            ? Number(this.dateStruct.end.hr) + 12
            : this.dateStruct.end.hr,
        minutes: this.dateStruct.end.min,
      });
      console.log(
        start.toLocaleString(DateTime.TIME_SIMPLE),
        end.toLocaleString(DateTime.TIME_SIMPLE)
      );
      this.$emit('closeDateTimeCard', {
        date: dt.toLocaleString(),
        start: start.toMillis(),
        end: end.toMillis(),
      });
    },

    fixDates() {
      this.newDate = this.currTimes.present
        ? 'Today'
        : this.currTimes.past
        ? 'Yesterday'
        : 'Tomorrow';
      this.convertNewDate();

      const startHour = this.currTimes.start.split(':')[0];
      this.dateStruct.start.hr = startHour > 12 ? startHour - 12 : startHour;
      this.dateStruct.start.min = this.currTimes.start.split(':')[1];
      this.dateStruct.start.amPm = startHour >= 12 ? 'PM' : 'AM';

      const endHour = this.currTimes.end.split(':')[0];
      this.dateStruct.end.hr = endHour > 12 ? endHour - 12 : endHour;
      this.dateStruct.end.min = this.currTimes.end.split(':')[1];
      this.dateStruct.end.amPm = endHour >= 12 ? 'PM' : 'AM';

      this.hr = this.dateStruct.start.hr;
      this.min = this.dateStruct.start.min;
      this.amPm = this.dateStruct.start.amPm;
      this.ready = true;
    },
    convertNewDate() {
      this.dateStruct.dateString =
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
    hr() {
      // end is when isEndTime
      if (this.isEndTime) {
        this.dateStruct.end.hr = this.hr;
      } else {
        this.dateStruct.start.hr = this.hr;
      }
    },
    min() {
      // end is when isEndTime
      if (this.isEndTime) {
        this.dateStruct.end.min = this.min;
      } else {
        this.dateStruct.start.min = this.min;
      }
    },
    amPm() {
      // end is when isEndTime
      if (this.isEndTime) {
        this.dateStruct.end.amPm = this.amPm;
      } else {
        this.dateStruct.start.amPm = this.amPm;
      }
    },
    newDate() {
      this.convertNewDate();
    },
    isEndTime(isEndTime) {
      if (isEndTime) {
        this.min = this.dateStruct.end.min;
        this.hr = this.dateStruct.end.hr;
        this.amPm = this.dateStruct.end.amPm;
      } else {
        this.min = this.dateStruct.start.min;
        this.hr = this.dateStruct.start.hr;
        this.amPm = this.dateStruct.start.amPm;
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
