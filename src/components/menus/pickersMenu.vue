<template>
  <v-row dense no-gutters>
    <v-col cols="12" sm="4">
      <v-menu
        v-model="menu"
        :close-on-content-click="false"
        :nudge-right="40"
        transition="scale-transition"
        offset-y
        min-width="auto"
      >
        <template v-slot:activator="{ on, attrs }">
          <v-text-field
            v-model="date"
            label="Visit Date"
            prepend-icon="event"
            readonly
            v-bind="attrs"
            v-on="on"
          ></v-text-field>
        </template>
        <v-date-picker v-model="date" @input="menu = false"></v-date-picker>
      </v-menu>
    </v-col>

    <v-col cols="12" sm="4">
      <v-menu
        ref="menuStartTime"
        v-model="menuStartTime"
        :close-on-content-click="true"
        :nudge-right="40"
        :return-value.sync="startTime"
        transition="scale-transition"
        offset-y
        max-width="290px"
        min-width="290px"
      >
        <template v-slot:activator="{ on, attrs }">
          <v-text-field
            v-model="startTime"
            label="Visit Started:"
            prepend-icon="mdi-clock-time-four-outline"
            readonly
            v-bind="attrs"
            v-on="on"
          ></v-text-field>
        </template>
        <v-time-picker
          v-if="menuStartTime"
          v-model="startTime"
          full-width
          @click:minute="$refs.menuStartTime.save(startTime)"
        ></v-time-picker>
      </v-menu>
    </v-col>
    <v-col cols="12" sm="4">
      <v-menu
        ref="menuEndTime"
        v-model="menuEndTime"
        :close-on-content-click="false"
        :nudge-right="40"
        :return-value.sync="endTime"
        transition="scale-transition"
        offset-y
        max-width="290px"
        min-width="290px"
      >
        <template v-slot:activator="{ on, attrs }">
          <v-text-field
            v-model="endTime"
            label="Visit Ended:"
            prepend-icon="mdi-clock-time-four-outline"
            readonly
            v-bind="attrs"
            v-on="on"
          ></v-text-field>
        </template>
        <v-time-picker
          v-if="menuEndTime"
          v-model="endTime"
          full-width
          @click:minute="$refs.menuEndTime.save(endTime)"
        ></v-time-picker>
      </v-menu>
    </v-col>
  </v-row>
</template>

<script>
export default {
  name: 'pickersMenu',
  props: {
    changeEvent: Function,
    selectedEventParsed: Object,
  },
  data() {
    return {
      date: null,
      startTime: '',
      endTime: '',
      menu: false,
      menuStartTime: false,
      menuEndTime: false,
    };
  },
  watch: {
    date(n, o) {
      if (o) {
        console.log('new date', n, o);
        this.start.date = this.date;
        this.end.date = this.date;
        this.changeEvent({ start: this.start, end: this.end });
      }
    },
    startTime(n, o) {
      if (o) {
        console.log('startTime [new and old]', n, o);
        this.start.time = this.startTime;
        this.start.hour = Number(this.startTime.slice(0, 2));
        this.start.minute = Number(this.startTime.slice(3, 5));
        this.changeEvent({ start: this.start, end: this.end });
      }
    },
    endTime(n, o) {
      if (o) {
        console.log('endTime [new and old]', n, o);
        this.end.time = this.endTime;
        this.end.hour = Number(this.endTime.slice(0, 2));
        this.end.minute = Number(this.endTime.slice(3, 5));
        this.changeEvent({ start: this.start, end: this.end });
      }
    },
  },
  mounted() {
    const self = this;
    self.start = self.selectedEventParsed.start;
    self.end = self.selectedEventParsed.end;
    self.date = self.start.date;

    self.startTime = self.start.time;
    self.endTime = self.end.time;
  },
};
</script>
