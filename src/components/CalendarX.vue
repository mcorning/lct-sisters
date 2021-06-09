<template>
  <v-sheet class="overflow-hidden ">
    <v-row id="calendarRow" align="start" class="overflow-hidden ">
      <v-col>
        <!-- calendar controls -->

        <!-- calendar sheet-->
        <v-sheet height="1000">
          <v-calendar
            id="calendar-target"
            ref="calendar"
            v-model="focus"
            color="primary"
            :type="type"
            :events="relevantEvents"
            @click:interval="changeTime"
            @click:event="showEvent"
          >
            <template v-slot:event="{ event, timed, eventSummary }">
              <div class="v-event-draggable" v-html="eventSummary()"></div>
              <div
                v-if="timed"
                class="v-event-drag-bottom"
                @mousedown.stop="extendBottom(event)"
              ></div>
            </template>
          </v-calendar>
        </v-sheet>
      </v-col>
    </v-row>

    <v-row id="statusRow" no-gutters class="mt-0 ml-0 overflow-hidden">
      <v-col class="fill-height"
        ><div class="fill-height">
          <small>{{ status }}</small>
        </div>
      </v-col>
    </v-row>
  </v-sheet>
</template>

<script>
import crypto from 'crypto';
const randomId = () => crypto.randomBytes(8).toString('hex');

import Visit from '@/models/Visit';
import Place from '@/models/Place';
import Appointment from '@/models/Appointment';

import { DateTime } from '../utils/luxonHelpers';
import { success, warn, highlight, printJson } from '../utils/colors';

export default {
  name: 'Calendar',

  props: {
    selectedSpace: Object,
    avgStay: Number,
    userID: String,
    username: String,
    graphName: String, // changes to graph come from App.js
  },

  computed: {
    cal() {
      return this.ready ? this.$refs.calendar : null;
    },

    visibleEvents() {
      return this.cal.getVisibleEvents();
    },

    appointments() {
      const a = Appointment.all();
      return a;
    },

    relevantEvents() {
      if (!this.ready) {
        return [];
      }
      const x = [...Visit.all(), ...this.appointments];
      return x;
    },
  },

  data: () => ({
    type: 'day',
    focus: '',
    model: null,
    status: 'Select a calendar event to edit',
    ready: false,
    selectedElement: null,
    selectedEventId: '',
  }),

  methods: {
    setModel(category) {
      this.model = category === 'You' ? Visit : Appointment;
    },

    showEvent({ nativeEvent, event }) {
      if (!event) {
        return;
      }
      const { id } = event;
      this.status = `Selected calendar event ${id}`;
      this.selectedElement = nativeEvent.target;
      this.model = this.getModle(event.category);
      this.selectedEventId = id;
    },

    // won't work until you add back dragAndDrop
    extendBottom(event) {
      if (!this.selectedEvent) {
        return;
      }
      this.model
        .updateFieldPromise(this.selectedEventId, {
          end: event.end,
        })
        .then((v) => console.log(printJson(v)));
    },

    changeTime(event) {
      console.groupCollapsed('Changing Time:>');
      if (!this.selectedEventId) {
        this.status = 'Chose your latest event';
        const latestEvent = this.visibleEvents[this.visibleEvents.length - 1];
        this.selectedEventId = latestEvent.input.id;
        this.setModel(latestEvent.input.category);
      }

      // can't give this static method (called by indirection in Calendar)
      // the same name as the shipping static method, Visit.find()
      const v = this.model.get(this.selectedEventId);
      const date = DateTime.fromFormat(v.date, 'EEE MMM dd yyyy');
      const hour = event.time.slice(0, 2);
      const minute = event.time.slice(3, 5);
      console.log('old end', v.end);
      // we are returning ms
      const newTime = this.roundTime(
        DateTime.fromObject({
          year: date.year,
          month: date.month,
          day: date.day,
          hour: hour,
          minute: minute,
        }).ts
      );
      console.log('new end', newTime);

      const s = DateTime.fromMillis(v.start);
      const e = DateTime.fromMillis(v.end);
      const d = DateTime.fromMillis(newTime);
      const startDelta = d.diff(s, 'minutes').minutes;
      const endDelta = d.diff(e, 'minutes').minutes;
      console.log('startDelta', startDelta);
      console.log('endDelta :>> ', endDelta);
      const startIsCloser =
        startDelta < 0 || Math.abs(startDelta) < Math.abs(endDelta);

      const data = startIsCloser ? { start: newTime } : { end: newTime };
      this.model.updateFieldPromise(this.selectedEventId, data).then((v) => {
        console.log(success('Updated event:', printJson(v)));
        console.groupEnd();
      });
    },

    roundTime(time, down = true) {
      const roundTo = 15; // minutes
      const roundDownTime = roundTo * 60 * 1000;

      return down
        ? time - (time % roundDownTime)
        : time + (roundDownTime - (time % roundDownTime));
    },

    toTime(tms) {
      return new Date(
        tms.year,
        tms.month - 1,
        tms.day,
        tms.hour,
        tms.minute
      ).getTime();
    },

    updateTime() {
      setInterval(() => this.cal.updateTimes(), 60 * 1000);
    },

    calendarTimestampToDate(cts) {
      // console.log('calendarTimestampToDate(cts):');
      // console.log(printJson(cts));

      try {
        const parsedDate = DateTime.fromObject({
          month: cts.month,
          day: cts.day,
          hour: cts.hour,
          minute: cts.minute,
        });
        return parsedDate;
      } catch (error) {
        this.status = 'You have moved the event to past today.';
      }
    },

    handleChange(event) {
      // this represents the start and end days on the calendar
      // we see it during mounting (where we call checkChange()) as one day
      // but change the calendar type, and you will see different start.date and end.date values
      console.log('handleChange(event)');
      console.log(highlight(this.type, printJson(event)));
    },

    changeTimeStamp(data) {
      const { isStart, val } = data;
      const event = this.parsedEvent;
      console.log(
        warn(
          `Editing event id ${event.input.id} ${
            isStart ? 'starttime' : 'endtime'
          } to ${val}`
        )
      );
      const hour = Number(val.slice(0, 2));
      const minute = Number(val.slice(3, 5));

      if (isStart) {
        event.start.hour = hour;
        event.start.minute = minute;
        event.input.start = this.calendarTimestampToDate(event.start).ts;
      } else {
        event.end.hour = hour;
        event.end.minute = minute;
        event.input.end = this.calendarTimestampToDate(event.end).ts;
      }
      console.log(warn('New start:', event.input.start));
      console.log(warn('New end:', event.input.end));
    },
  },

  watch: {},

  created() {},

  mounted() {
    Promise.all([Place.$fetch(), Visit.$fetch(), Appointment.$fetch()])
      .then((entities) => {
        console.log(entities[0].places?.length, 'Places');
        console.log(entities[1].visits?.length, 'Visits');
        console.log(entities[2].appointments?.length, 'Appointments');

        console.log(success('mounted calendarCard'));

        this.ready = true;
        this.cal.scrollToTime();
      })
      .catch((err) => this.throwError('Calendar.mounted()', err));
  },

  destroyed() {
    document.removeEventListener('keydown', this.handleKeydown);
  },
};
</script>

<style scoped lang="scss">
.v-event-draggable {
  padding-left: 6px;
}

.v-event-timed {
  user-select: none;
  -webkit-user-select: none;
}

.v-event-drag-bottom {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 4px;
  height: 4px;
  cursor: ns-resize;

  &::after {
    display: none;
    position: absolute;
    left: 50%;
    height: 4px;
    border-top: 1px solid white;
    border-bottom: 1px solid white;
    width: 16px;
    margin-left: -8px;
    opacity: 0.8;
    content: '';
  }

  &:hover::after {
    display: block;
  }

  #calendar-target {
    touch-action: none;
    overflow-y: hidden;
  }
}
</style>
