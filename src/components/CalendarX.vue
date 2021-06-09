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

import { DateTime, getNow } from '../utils/luxonHelpers';
import { error, success, warn, highlight, printJson } from '../utils/colors';

export default {
  name: 'CalendarX',

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

    isDefaultGraph() {
      return this.graphName === this.$defaultGraphName;
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
    lastCategory: '',
    place: null,
    status: 'Select a calendar event to edit',
    ready: false,
    selectedElement: null,
    selectedEventId: '',
  }),

  methods: {
    addVisit(time, place_id = this.place.place_id, stay = this.avgStay) {
      console.log(time, place_id, stay);
      const starttime = this.roundTime(time);
      const endtime = starttime + stay;

      const newVisit = {
        id: randomId(),
        name: this.place.name,
        place_id: place_id,
        start: starttime,
        end: endtime,
        date: new Date(starttime).toDateString(),
        timed: true,
        marked: getNow(),
        graphName: this.graphname,
        color: this.isDefaultGraph ? 'secondary' : 'sandboxmarked',
        loggedNodeId: '', // this will contain the internal id of the relationship in redisGraph
      };

      this.model
        .updatePromise(newVisit)
        .then((p) => {
          console.log('Added visit to cache', printJson(p));
        })
        .catch((err) => {
          this.throwError(
            'Calendar.addVisit(time, place_id = this.place_id, stay = this.avgStay)',
            err,
            `Oops. Sorry, we had trouble adding a visit on your calendar. Notified devs.`
          );
        });
    },

    changeTime(event) {
      console.groupCollapsed('Changing Time:>');
      if (!this.selectedEventId) {
        this.status = 'Chose your latest event';
        const latestEvent = this.visibleEvents[this.visibleEvents.length - 1];
        this.selectedEventId = latestEvent.input.id;
        this.setModel(latestEvent.input.category);
      }

      const model = this.getModel();

      // can't give this static method (called by indirection in Calendar)
      // the same name as the shipping static method, Visit.find()
      const v = model.get(this.selectedEventId);
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
      model.updateFieldPromise(this.selectedEventId, data).then((v) => {
        console.log(success('Updated event:', printJson(v)));
        console.groupEnd();
      });
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

    // this setter isn't reliable
    setModel(category) {
      console.log('setModel()', category);
      const x = category === 'You' ? Visit : Appointment;
      this.model = x;
    },

    getModel() {
      console.log('getModel()', this.lastCategory);
      const x = this.lastCategory === 'You' ? Visit : Appointment;
      return x;
    },

    showEvent({ nativeEvent, event }) {
      if (!event) {
        return;
      }
      const { id } = event;
      this.status = `Selected calendar event ${id}`;
      this.selectedElement = nativeEvent.target;
      this.lastCategory = event.category;
      this.model = this.setModel(this.lastCategory);
      this.selectedEventId = id;
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

    // only called by mount. shift will be taken from localStorage for employee
    // customer has null shift
    // TODO  avgStay should be computed based on visitor's history
    newVisit() {
      this.model = Visit;
      const time = this.place.startTime || Date.now();
      const shift = this.place.shift;
      const place_id = this.place.place_id;
      this.addVisit(time, place_id, shift);

      // this.endDrag();
    },

    throwError(source, err, message) {
      console.log(error(printJson(err)));
      this.status = message;
      this.$emit('error', {
        source: source,
        error: err,
      });
    },
  },

  watch: {
    model(newVal, oldVal) {
      console.log('model', newVal, oldVal);
    },
    graphName(newVal, oldVal) {
      console.log('Graph name is', newVal, 'and was', oldVal);
      this.status = `You are ${
        this.graphName === this.$defaultGraphName
          ? 'using'
          : 'experimenting with'
      }  ${this.getGraphNameString}`;
    },
  },

  created() {},

  mounted() {
    const self = this;

    Promise.all([Place.$fetch(), Visit.$fetch(), Appointment.$fetch()])
      .then((entities) => {
        const visits = entities[1].visits || [];
        console.log(entities[0].places?.length, 'Places');
        console.log(visits.length, 'Visits');
        console.log(entities[2].appointments?.length, 'Appointments');

        console.log(printJson(visits));
        console.log(success('mounted calendarCard'));

        this.ready = true;
        this.cal.scrollToTime();

        self.place = self.selectedSpace;
        if (self.place) {
          self.newVisit();
        }
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
