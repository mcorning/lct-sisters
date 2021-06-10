<template>
  <v-sheet class="overflow-hidden ">
    <v-row id="calendarRow" align="start" class="overflow-hidden ">
      <v-col>
        <!-- calendar controls -->
        <v-sheet height="48">
          <v-toolbar flat>
            <v-icon medium @click="setToday"> mdi-calendar-today </v-icon>
            <v-btn fab text small color="grey darken-2" @click="prev">
              <v-icon> mdi-chevron-left </v-icon>
            </v-btn>
            <v-btn fab text small color="grey darken-2" @click="next">
              <v-icon> mdi-chevron-right </v-icon>
            </v-btn>
            <v-toolbar-title v-if="cal">
              {{ cal.title }}
            </v-toolbar-title>
            <v-spacer></v-spacer>
            <v-menu bottom right>
              <template v-slot:activator="{ on, attrs }">
                <v-btn outlined color="grey darken-2" v-bind="attrs" v-on="on">
                  <span>{{ typeToLabel[type] }}</span>
                  <v-icon right> mdi-menu-down </v-icon>
                </v-btn>
              </template>
              <v-list>
                <v-list-item @click="type = 'category'">
                  <v-list-item-title>Appointment</v-list-item-title>
                </v-list-item>
                <v-list-item @click="type = 'day'">
                  <v-list-item-title>Day</v-list-item-title>
                </v-list-item>
                <v-list-item @click="type = '4day'">
                  <v-list-item-title>4 days</v-list-item-title>
                </v-list-item>
                <v-list-item @click="type = 'week'">
                  <v-list-item-title>Week</v-list-item-title>
                </v-list-item>
                <v-list-item @click="type = 'month'">
                  <v-list-item-title>Month</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-toolbar>
        </v-sheet>

        <!-- calendar sheet-->
        <v-sheet height="1000">
          <v-calendar
            id="calendar-target"
            ref="calendar"
            v-model="focus"
            color="primary"
            :type="type"
            :events="relevantEvents"
            :categories="categories"
            :event-color="getEventColor"
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

    <EventModernDialog
      id="EventModernDialog"
      ref="EventModernDialog"
      :customEventOptions="selectedOptions"
      @setDate="onSetDate"
      @setTime="onSetTime"
    />
  </v-sheet>
</template>

<script>
import crypto from 'crypto';
const randomId = () => crypto.randomBytes(8).toString('hex');

import Visit from '@/models/Visit';
import Place from '@/models/Place';
import Appointment from '@/models/Appointment';

// TODO Come back to fix this complex mixin strategy later
// import { eventDialog } from '../mixins/eventDialog';

import { DateTime, getNow } from '../utils/luxonHelpers';
import { error, success, warn, highlight, printJson } from '../utils/colors';

export default {
  name: 'Calendar',

  // mixins: [eventDialog],

  props: {
    selectedSpace: Object,
    avgStay: Number,
    userID: String,
    username: String,
    graphName: String, // changes to graph come from App.js
  },

  components: {
    // ConfirmModernDialog: () => import('./cards/dialogCardModern'),
    EventModernDialog: () => import('./cards/eventDialogCardModern'),
  },

  computed: {
    atWorkAt() {
      return localStorage.getItem('business');
    },

    cal() {
      return this.ready ? this.$refs.calendar : null;
    },

    currentEventParsed() {
      return this.visibleEvents?.find(
        ({ input }) => input.id === this.selectedEventId
      );
    },

    currentEvent() {
      return this.currentEventParsed?.input;
    },

    currentEventIsYours() {
      return this.currentEvent?.category === 'You';
    },

    currentEventIsLogged() {
      return this.currentEvent?.loggedNodeId;
    },

    EventModernDialog() {
      return this.$refs.EventModernDialog;
    },

    graphStatus() {
      if (!this.ready) {
        return;
      }
      const status = this.currentEventIsLogged
        ? `is logged on the <strong>${this.currentEvent.graphname}</strong> graph`
        : `is <strong>not logged</strong> to any graph yet. `;
      return status;
    },

    isDefaultGraph() {
      return this.graphName === this.$defaultGraphName;
    },

    model() {
      return this.currentEventIsYours ? Visit : Appointment;
    },

    visibleEvents() {
      return this.cal?.getVisibleEvents();
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
    visitorIsOnline() {
      return this.userID;
    },
  },

  data: () => ({
    categories: ['You', 'Them'],
    customEventOptions: {
      buttons: [
        { label: 'Cancel', act: 'CANCEL' },

        { label: 'Delete', act: 'DELETE' },

        { spacer: true },
        { label: 'Book', act: 'BOOK', tip: 'Make an appointment' },
        { label: 'Log', act: 'LOG', color: 'secondary', outlined: true },
      ],
    },
    type: 'day',
    focus: '',
    place: null,
    status: 'Select a calendar event to edit',
    ready: false,
    selectedElement: null,
    selectedEventId: '',
    selectedOptions: null,

    typeToLabel: {
      category: 'Appointment',
      month: 'Month',
      week: 'Week',
      day: 'Day',
      '4day': '4 Days',
    },
  }),

  methods: {
    //#region Dialogs
    showDialog() {
      if (this.currentEventIsYours) {
        this.showEventDialog();
      } else {
        // this.showAppointmentDialog();
      }
    },
    showEventDialog() {
      const question = `Edit ${this.atWorkAt ? 'Shift at' : 'Visit to'} ${
        this.currentEvent.name
      }?`;
      const consequences = `${this.currentEvent.name} ${this.graphStatus}`; //`You are editing place ID: ${this.parsedEvent.input.place_id}`;
      const icon = this.atWorkAt ? 'mdi-facebook-workplace' : 'mdi-calendar';
      const revertData = {
        start: this.currentEvent.start,
        end: this.currentEvent.end,
      };

      const options = {
        icon: icon,
        parsedEvent: {}, // not sure we need this anymore
        date: this.currentEventParsed.input.date,
        starttimeString: this.currentEventParsed.start.time,
        endtimeString: this.currentEventParsed.end.time,
        visitorIsOnline: this.visitorIsOnline, // redundant if userID passed as well
        userID: this.userID,
        isAppointment: false,
      };
      this.EventModernDialog.setCustomOptions(this.customEventOptions);
      this.EventModernDialog.open(question, consequences, options).then(
        (action) => {
          switch (action) {
            case 'DELETE':
              this.deleteEvent(this.parsedEvent.input.id);
              break;
            case 'CANCEL':
              this.revert(revertData);
              break;
            case 'BOOK':
              this.manageAppointments();
              break;

            case 'LOG':
              this.logVisit(this.parsedEvent.input);
              break;

            default:
              this.throwError(
                'Calendar.showEventDialog()',
                `Cannot handle ${action} action`,
                'This error does not effect you. Sorry for the interruption'
              );
          }
        }
      );
    },
    // showAppointmentDialog() {
    //   const question = `Manage appointment for ${DateTime.fromMillis(
    //     this.roundTime(this.starttime)
    //   ).toFormat('T')}?`;
    //   const consequences = 'This will update your public calendar.';

    //   const icon = 'mdi-update';
    //   const options = {
    //     icon: icon,
    //     parsedEvent: this.parsedEvent,
    //     starttime: this.starttime,
    //     endtime: this.endtime,
    //     isAppointment: true,
    //   };

    //   this.EventDialog.setCustomOptions(this.customBookEventOptions);

    //   this.EventModernDialog.open(question, consequences, options).then(
    //     (action) => {
    //       switch (action) {
    //         case 'DELETE':
    //           this.deleteEvent();
    //           break;
    //         case 'CANCEL':
    //           this.revert();
    //           break;

    //         case 'SAVE':
    //           this.saveAppointment(this.parsedEvent.input);
    //           break;
    //       }
    //     }
    //   );
    // },

    //#endregion

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
        this.status = 'We assume you wanted to change your latest event';
        const latestEvent = this.visibleEvents[this.visibleEvents.length - 1];
        this.selectedEventId = latestEvent.input.id;
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

    deleteEvent() {
      this.model
        .deletePromise(this.selectedEventId)
        .then(() => {
          console.log(`Deleted ${this.currentEvent.name}'s appointment`);
        })
        .catch((err) => {
          this.throwError(
            'Calendar.deleteEvent()',
            err,
            `Oops. Sorry, we had trouble deleting the visit from your calendar. Notified devs.`
          );
        });
    },

    revert(data) {
      this.model.updateFieldPromise(this.selectedEventId, data).then((v) => {
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

    showEvent({ nativeEvent, event }) {
      if (!event) {
        return;
      }
      const { id } = event;
      this.status = `Selected calendar event ${id}`;
      this.selectedElement = nativeEvent.target;
      this.selectedEventId = id;

      this.showDialog();
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
      const event = this.currentEventParsed;
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
      console.log(error('ERROR:', printJson(err)));
      this.status = message;
      this.$emit('error', {
        source: source,
        error: err,
      });
    },

    //#region Calendar methods

    viewDay({ date }) {
      this.focus = date;
      this.type = 'day';
    },

    onSetDate(date) {
      this.date = date;
    },

    onSetTime(ms, isStart) {
      if (isStart) {
        this.currentEvent.start = ms;
      } else {
        this.currentEvent.end = ms;
      }
      this.model.updatePromise(this.currentEvent);
    },

    setToday() {
      this.focus = '';
      this.cal.scrollToTime();
    },
    prev() {
      this.cal.prev();
    },
    next() {
      this.cal.next();
    },

    // called by event-color calendar event
    getEventColor(event) {
      const c =
        this.parsedEvent?.input.id === event.id
          ? `${event.color} darken-1`
          : event.color;
      return c;
    },
    //#endregion
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
        const places = entities[0].places || [];
        const visits = entities[1].visits || [];
        const appointments = entities[2].appointments || [];

        console.log(places.length, 'Places');
        console.log(visits.length, 'Visits');
        console.log(appointments.length, 'Appointments');

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
