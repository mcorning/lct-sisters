<template>
  <v-card>
    <v-row justify="space-between" dense>
      <v-col cols="1">
        <v-icon>close</v-icon>
      </v-col>
      <v-col cols="auto">
        <span class="text-h7 text-center">Change from: {{ currDate }}</span>
      </v-col>
      <v-col cols="1">
        <v-icon>check</v-icon>
      </v-col>
    </v-row>
    <v-row dense
      ><v-spacer /><v-col
        ><v-btn-toggle v-model="isEndTime" rounded>
          <v-btn>Start time</v-btn><v-btn>Ending time</v-btn>
        </v-btn-toggle></v-col
      ><v-spacer
    /></v-row>
    <v-row align="center" dense
      ><v-col
        ><scroll-picker
          v-model="newDate"
          :options="readyDateList"
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
  </v-card>
</template>

<script>
import 'vue-scroll-picker/dist/style.css';
import { ScrollPicker } from 'vue-scroll-picker';

export default {
  name: 'dateTimeCard',

  props: {
    currDate: String,
    currTimes: Object,
    dateList: Array,
  },
  components: { ScrollPicker },
  computed: {
    readyDateList() {
      if (!this.ready) {
        return [];
      }
      return this.dateList;
    },

    newDateTime() {
      //   const x = ''
      const x = `${this.newDate},  from ${this.startHr}:${this.startMin} ${this.startAmPm} to ${this.endHr}:${this.endMin} ${this.endAmPm}`;
      return x;
    },
    hoursList() {
      return [...Array(12).keys()].map((v) => (v + 1).toString());
    },
  },
  data() {
    return {
      ready: false,
      isEndTime: 0, // this is a toggle value: start=0 end=1
      newDate: 'Today',
      hr: '',
      min: '',
      amPm: '',
      startHr: '',
      startMin: '',
      startAmPm: '',

      endHr: '',
      endMin: '',
      endAmPm: '',
    };
  },
  methods: {
    fixDates() {
      this.newDate = this.currTimes.present
        ? 'Today'
        : this.currTimes.past
        ? 'Yesterday'
        : 'Tomorrow';

      this.hr = this.currTimes.start.split(':')[0];
      this.min = this.currTimes.start.split(':')[1];
      this.amPm = this.hr >= 12 ? 'PM' : 'AM';

      this.startHr = this.hr;
      this.startMin = this.minute;
      this.startAmPm = this.amPm;
      this.endHr = this.currTimes.end.split(':')[0];
      this.endMin = this.currTimes.end.split(':')[1];
      this.endAmPm = this.endHr >= 12 ? 'PM' : 'AM';
      this.ready = true;
    },
  },
  watch: {
    hr(hr) {
      // end is when isEndTime
      if (this.isEndTime) {
        this.endHr = hr;
      } else {
        this.startHr = hr;
      }
    },
    min(min) {
      // end is when isEndTime
      if (this.isEndTime) {
        this.endMin = min;
      } else {
        this.startMin = min;
      }
    },
    amPm(amPm) {
      // end is when isEndTime
      if (this.isEndTime) {
        this.endAmPm = amPm;
      } else {
        this.startAmPm = amPm;
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
