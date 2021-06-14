<template>
  <v-sheet class="overflow-hidden" :height="sheetHeight">
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
        <v-sheet ref="calendarSheet" :height="calendarHeight">
          <v-calendar
            id="calendar-target"
            ref="calendar"
            v-model="focus"
            color="primary"
            :type="type"
            :events="relevantEvents"
            :categories="categories"
            :event-color="getEventColor"
            :now="currentDate"
            @click:more="viewDay"
            @click:date="viewDay"
            @click:interval="changeInterval"
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
      <v-col
        ><div>
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
    isAtWorkAt() {
      return localStorage.getItem('business') === this.currentEvent.name;
    },
    atWorkOrVisiting() {
      if (this.isAtWorkAt) {
        return 'shift';
      }
      return this.currentEventIsYours ? 'visit' : 'appointment';
    },

    cal() {
      return this.ready ? this.$refs.calendar : null;
    },

    currentEventParsed() {
      const x = this.visibleEvents?.find(
        ({ input }) => input.id === this.selectedEventId
      );
      return x || this.selectedEventParsed;
    },

    currentEvent() {
      // selectedEventParsed has value for past/future events
      return this.currentEventParsed?.input || this.selectedEventParsed.input;
    },

    currentEventIsYours() {
      // if there are no visibleEvents (so no currentEvent), we can only add a visit/shift
      return !this.currentEvent || this.currentEvent.category === 'You';
    },

    currentEventIsLogged() {
      return this.currentEvent?.loggedNodeId;
    },

    dialogOptions() {
      return {
        parsedEvent: this.currentEventParsed,
        userID: this.userID,
        isAppointment: false,
      };
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

    visibleEvents() {
      // TODO does this property include past or future events?
      const x = this.cal?.getVisibleEvents();
      return x;
    },

    appointments() {
      const a = Appointment.all();
      return a;
    },

    relevantEvents() {
      if (!this.ready) {
        return [];
      }
      // TODO should this property include all visits or only those for the selected day?
      const x = [...Visit.all(), ...this.appointments];
      return x;
    },
    visitorIsOnline() {
      return this.userID;
    },
  },

  data: () => ({
    // Calendar uses this format
    DATE_FORMAT: 'yyyy-LL-dd',
    categories: ['You', 'Them'],
    currentDate: null,
    customEventOptions: {
      buttons: [
        { label: 'Cancel', act: 'CANCEL' },

        { label: 'Delete', act: 'DELETE' },

        { spacer: true },
        { label: 'Done', act: 'DONE', color: 'secondary', outlined: true },
        { spacer: true },

        { label: 'Book', act: 'BOOK', tip: 'Make an appointment' },
        { label: 'Log', act: 'LOG' },
      ],
    },
    customBookEventOptions: {
      buttons: [
        { label: 'Delete', act: 'DELETE' },
        { label: 'Cancel', act: 'CANCEL' },

        { spacer: true },
        { label: 'Done', act: '', color: 'secondary', outlined: true },
      ],
    },
    type: 'day',
    focus: '',
    place: null,
    status: 'Select a calendar event to edit',
    ready: false,
    selectedElement: null,
    selectedEventParsed: null,
    selectedEventId: '',
    selectedOptions: null,
    sheetHeight: 0,
    calendarHeight: 0,
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
        this.showAppointmentDialog();
      }
    },
    showEventDialog() {
      const question = `Edit ${this.isAtWorkAt ? 'Shift at' : 'Visit to'} ${
        this.currentEvent.name
      }?`;
      const consequences = `${this.currentEvent.name} ${this.graphStatus}`; //`You are editing place ID: ${this.parsedEvent.input.place_id}`;
      const revertData = {
        start: this.currentEvent.start,
        end: this.currentEvent.end,
      };

      const icon = this.isAtWorkAt ? 'mdi-facebook-workplace' : 'mdi-calendar';
      const options = { ...this.dialogOptions, icon: icon };
      this.EventModernDialog.setCustomOptions(this.customEventOptions);
      this.EventModernDialog.open(question, consequences, options).then(
        (action) => {
          switch (action) {
            case 'DELETE':
              this.deleteEvent(this.currentEvent.id);
              break;
            case 'CANCEL':
              this.revert(revertData);
              break;

            case 'DONE':
              // NOOP
              break;

            case 'BOOK':
              this.addAppointment();
              break;

            case 'LOG':
              this.logVisit(this.currentEvent);
              break;

            default:
              // if action is a date, use it to setDate()
              try {
                this.onSetDate(action);
                this.viewDay(action);
              } catch (error) {
                this.throwError(
                  'Calendar.showEventDialog()',
                  `Cannot handle ${action} action`,
                  'This error does not effect you. Sorry for the interruption'
                );
              }
          }
        }
      );
    },
    showAppointmentDialog(newAppointment = null) {
      /**
       * newAppointment means:
       *    no sense in reverting
       *    (unless that means deleting the new appointment)
       */
      const question = `Manage appointment for ${this.currentEventParsed?.start
        .time || this.selectedEventId}?`;
      const consequences = 'This will update your public calendar.';

      const options = { ...this.dialogOptions, icon: 'mdi-update' };
      const revertData = {
        start: this.currentEvent?.start,
        end: this.currentEvent?.end,
        category: 'Them',
      };
      this.EventModernDialog.setCustomOptions(this.customBookEventOptions);

      this.EventModernDialog.open(question, consequences, options)
        .then((action) => {
          switch (action) {
            case 'DELETE':
              this.deleteEvent();
              break;
            case 'CANCEL':
              if (newAppointment) {
                this.deleteEvent(this.selectedEventId);
              } else {
                this.revert(revertData);
              }
              break;
          }
        })
        .catch((err) => {
          console.log(error(err));
          this.status = err;
        });
    },

    //#endregion

    //#region Visit and Appointment management functions
    /**
     *  callback from addAppointment so we can rely on the
     *  new appointment to appear in visibleElements.
     *  this way we can treat new and extant appointments the same way.
     */
    handleNewAppointment(p) {
      this.showAppointmentDialog(p);
      console.groupCollapsed('New Appointment:>');
      console.log(success(printJson(this.currentEventParsed)));
      console.groupEnd();
    },

    // can be called by ShowEventDialog() at the start of the business day
    // or can be called by clicking a public calendar time
    addAppointment(
      time = DateTime.now().ts,
      name = 'customer',
      slotInterval = 30 * 1000 * 60
    ) {
      const starttime = this.roundTime(time);
      const endtime = time + slotInterval;
      this.selectedEventId = randomId();
      const val = {
        id: this.selectedEventId,
        name: name,
        provider: this.username,
        date: DateTime(starttime).toISODate(),
        start: starttime,
        end: endtime,
        timed: true,
        category: 'Them',
      };
      this.updateCache({ val }, this.handleNewAppointment);
    },

    addVisit(time, place_id = this.place.place_id, stay = this.avgStay) {
      console.log(time, place_id, stay);
      const starttime = this.roundTime(time);
      const endtime = starttime + stay;

      const val = {
        id: randomId(),
        name: this.place.name,
        place_id: place_id,
        start: starttime,
        end: endtime,
        date: DateTime(starttime).toISODate(),
        category: 'You',

        timed: true,
        marked: getNow(),
        graphName: this.graphname,
        color: this.isDefaultGraph ? 'secondary' : 'sandboxmarked',
        loggedNodeId: '', // this will contain the internal id of the relationship in redisGraph
      };

      this.updateCache({ val });
    },

    // only called by mount. shift will be taken from localStorage for employee
    // customer has null shift
    // TODO  avgStay should be computed based on visitor's history
    newVisit() {
      const time = this.place.startTime || Date.now();
      const shift = this.place.shift;
      const place_id = this.place.place_id;
      this.addVisit(time, place_id, shift);
    },

    updateCache(data, f) {
      // TODO 'val' is a very bad arg name
      const { val, id, deleteMe } = data;
      const model = val.category === 'You' ? Visit : Appointment;
      if (deleteMe) {
        model
          .deletePromise(id)
          .then(() => {
            const msg = `Deleted ${val.name}'s ${model.name} ${id}`;
            console.log(success(msg));
            this.status = msg;
            return;
          })
          .catch((err) => {
            this.status = err;
          });
      }
      if (id) {
        model
          .updateFieldPromise(id, val)
          .then((p) => {
            console.log(
              `Updated ${
                model.name === 'Visit' ? 'visit' : 'appointment'
              } with`,
              printJson(p)
            );
            if (f) {
              f(p);
            }
          })
          .catch((err) => {
            this.status = err;
          });
      } else {
        model
          .updatePromise(val)
          .then((p) => {
            console.log(
              `Added ${
                model.name === 'Visit' ? 'visit' : 'appointment'
              } to cache`,
              printJson(p)
            );
            if (f) {
              f(p);
            }
          })
          .catch((err) => {
            this.status = err;
          });
      }
    },

    changeInterval(event) {
      // TODO start here
      /**
       * if we change interval on a prior day, the date wraps into the next day.
       * this is the start of figuring out how to edit other days than today
       */

      console.groupCollapsed('Changing Time:>');
      if (!this.selectedEventId) {
        this.status = 'Pick an event';
        return;
      }

      // we are returning ms
      const newTime = this.roundTime(
        DateTime.fromSQL(`${this.currentEvent.date} ${event.time}`).ts
      );
      console.log('new end', newTime);

      const s = DateTime.fromMillis(this.currentEvent.start);
      const e = DateTime.fromMillis(this.currentEvent.end);
      const d = DateTime.fromMillis(newTime);
      const startDelta = d.diff(s, 'minutes').minutes;
      const endDelta = d.diff(e, 'minutes').minutes;
      console.log('startDelta:', startDelta);
      console.log('endDelta:', endDelta);
      const startIsCloser =
        startDelta < 0 || Math.abs(startDelta) < Math.abs(endDelta);

      const val = startIsCloser
        ? { start: newTime, category: this.currentEvent.category }
        : { end: newTime, category: this.currentEvent.category };
      this.updateCache({ id: this.selectedEventId, val });
      console.groupEnd();
    },

    // TODO do we need this?
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

    deleteEvent(id = this.currentEvent.id) {
      const category = this.currentEvent.category;
      const name = this.currentEvent?.name || 'appointment';

      this.updateCache({ val: { name, category }, id, deleteMe: true });
    },
    logVisit(visit) {
      this.$emit('logVisit', visit);
      this.status = 'Logged to server. Stay safe out there.';
    },

    revert(val) {
      this.updateCache({ id: this.selectedEventId, val });
    },

    throwError(source, err, message) {
      console.log(error('ERROR:', err.message));
      this.status = `${message} ${err.message}`;
      this.$emit('error', {
        source: source,
        error: err,
      });
    },
    //#endregion Visit and Appointment management functions

    //#region Calendar methods
    // won't work until you add back dragAndDrop
    extendBottom(event) {
      if (!this.selectedEventParsed.input) {
        return;
      }
      this.updateCache({
        id: this.selectedEventId,
        val: {
          end: event.end,
        },
      });
    },

    showEvent({ nativeEvent, event }) {
      if (!event) {
        return;
      }
      const { id } = event;
      // can be used as an activator for a control
      this.selectedElement = nativeEvent.target;

      // this enables us to get the currentEventParsed (and all it's dependencies)
      this.selectedEventId = id;
      // selectedEventParsed used for past/future events (not included in cal.getVisibleEvents())
      this.selectedEventParsed = this.cal.parseEvent(event);

      this.status = `Selected calendar event ${this.atWorkOrVisiting} ${event.name} [${id}]`;

      // determine which dialog to render
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
      return DateTime.fromObject(
        tms.year,
        tms.month,
        tms.day,
        tms.hour,
        tms.minute
      ).toMillis();
    },

    updateTime() {
      setInterval(() => this.cal.updateTimes(), 60 * 1000);
    },

    calendarTimestampToDate(cts) {
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

    getCurrentTime() {
      return this.cal
        ? this.cal.times.now.hour * 60 + this.cal.times.now.minute
        : 0;
    },

    scrollToTime(time = this.getCurrentTime()) {
      const first = Math.max(0, time - (time % 30) - 100);
      this.cal.scrollToTime(first);
      console.log(`scrolled to time at ${first}`);
    },

    updateTimestampsFromDateChange(ts) {
      // TODO it's always risky to make a date from a fixed format
      // but this was more reliable than using .fromJSDate()
      // because JS left-shifts the day as a zero-based index
      const d = DateTime.fromFormat(this.date, this.DATE_FORMAT);

      const { year, month, day } = d;
      const { hour, minute } = ts;
      return DateTime.local(year, month, day, hour, minute).ts;
    },

    onSetDate(date) {
      if (!date) {
        alert('Date is null. Try again, please.');
      }
      try {
        this.date = date;
        this.currentEvent.date = this.date;
        let newTs = this.updateTimestampsFromDateChange(
          this.currentEventParsed.start
        );
        this.currentEvent.start = newTs;

        newTs = this.updateTimestampsFromDateChange(
          this.currentEventParsed.end
        );
        this.currentEvent.end = newTs;

        this.updateCache({ val: this.currentEvent });
      } catch (err) {
        this.status = error(
          `This is unexpected: ${err.message}. Let's try that again...`
        );
      }
    },

    onSetTime(ms, isStart) {
      if (isStart) {
        this.currentEvent.start = ms;
      } else {
        this.currentEvent.end = ms;
      }
      this.updateCache({ val: this.currentEvent });
    },

    viewDay({ date }) {
      this.focus = date;
      console.log(`Going to ${date}`);
      this.status = `Going to ${date}`;
      this.type = 'day';
      this.currentDate = date;
    },
    setToday() {
      this.focus = '';
      this.status = `Going back to today`;
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
    //#endregion Calendar methods

    setHeight() {
      const bp = this.$vuetify.breakpoint;
      console.log(
        highlight('Breakpoint'),
        bp.name,
        'width',
        bp.width,
        'height',
        bp.height,

        'mobile?',
        bp.mobile
      );

      const x = bp.height;
      const y = 112; // height of appbar header and footer
      this.sheetHeight = x - y;
      this.calendarHeight = this.sheetHeight - 100;
      console.log('sheetHeight:', this.sheetHeight);
      console.log('calendarHeight:', this.calendarHeight);
    },
  },

  watch: {
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

        this.type = appointments.length > 0 ? 'category' : 'day';

        this.setHeight();

        self.place = self.selectedSpace;
        if (self.place) {
          self.newVisit();
        }

        // ensure start and end are valid dates
        Visit.validateVisits().then((invalidVisits) => {
          console.groupCollapsed(warn('Invalid visits:'));
          console.log(printJson(invalidVisits));
          console.groupEnd();
          this.ready = true;
          this.scrollToTime();
        });
        console.log(success('mounted calendarCard'));
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
