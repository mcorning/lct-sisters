<template>
  <v-sheet class="overflow-hidden " :height="sheetHeight">
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
        <!-- touch on phone is too sensitive
             @touchstart:time="startTime"
             @touchmove:time="mouseMove"
             @touchend:time="endDrag"
             
             taken from extendBottom event:
             @touchstart.stop="extendBottom(event)"
            @click:time-category="manageAppointments"

 -->
        <v-sheet :height="calendarHeight">
          <v-calendar
            id="calendar-target"
            ref="calendar"
            v-model="focus"
            color="primary"
            :type="type"
            :categories="categories"
            :events="relevantEvents"
            :event-ripple="false"
            :event-color="getEventColor"
            event-overlap-mode="column"
            event-overlap-threshold="1"
            @touchstart:event="showEvent"
            @mousedown:time="startTime"
            @mousemove:time="mouseMove"
            @click:event="showEvent"
            @click:interval="showInterval"
            @click:more="viewDay"
            @mousedown:event="startDrag"
            @mouseup:time="endDrag"
            @click:date="viewDay"
            @change="handleChange"
            v-touch="{
              left: goLeft,
              right: goRight,
            }"
          >
            <template #day-body="{ date, week }">
              <div
                class="v-current-time"
                :class="{ first: date === week[0].date }"
                :style="{ top: nowY }"
              ></div>
            </template>
            <template v-slot:event="{ event, timed, eventSummary }">
              <!-- <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }"> -->
              <div class="v-event-draggable" v-html="eventSummary()"></div>
              <!-- </template>
                <span>LOG: Tab key or Left swipe</span><br /><span class="pl-8"
                  >DELETE: Del key or Right swipe
                </span></v-tooltip
              > -->
              <v-tooltip top>
                <template v-slot:activator="{ on, attrs }">
                  <div
                    v-if="timed"
                    v-bind="attrs"
                    v-on="on"
                    class="v-event-drag-bottom"
                    @mousedown.stop="extendBottom(event)"
                  ></div>
                </template>
                <span>Drag and drop event as necessary </span></v-tooltip
              >
            </template>
          </v-calendar>

          <!-- <eventDialog
            v-if="selectedOpen"
            :activator="selectedElement"
            :starttime="starttime"
            :endtime="endtime"
            :selectedOpen="selectedOpen"
            :parsedEvent="parsedEvent"
            :visitorIsOnline="visitorIsOnline"
            :userID="userID"
            @modifyEvent="modifyEvent"
            @goRight="goRight"
            @goLeft="goLeft"
            @revert="revert"
            @saveVisit="saveVisit"
          ></eventDialog> -->
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
    <ConfirmModernDialog
      id="ConfirmModernDialogId"
      ref="ConfirmModernDialog"
      :customOptions="customOptions"
    />
    <EventModernDialog
      id="EventModernDialog"
      ref="EventModernDialog"
      :customEventOptions="selectedOptions"
      @modifyEvent="onModifyEvent"
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

import { getNow, DateTime, formatSmallTime } from '../utils/luxonHelpers';
import { error, success, warn, highlight, printJson } from '../utils/colors';

export default {
  name: 'Calendar',

  props: {
    selectedSpace: Object,
    avgStay: Number,
    userID: String,
    username: String,
    graphName: String, // changes to graph come from App.js
  },

  components: {
    ConfirmModernDialog: () => import('./cards/dialogCardModern'),
    EventModernDialog: () => import('./cards/eventDialogCardModern'),
  },

  computed: {
    atWorkAt() {
      return localStorage.getItem('business');
    },

    // TODO clean up old this.visits code and cite a visits computed property for relevantEvents
    appointments() {
      const a = Appointment.all();
      return a;
    },

    selectedPlace() {
      return Place.find(this.getCurrentVisit().place_id);
    },

    shift() {
      const openAt = localStorage.getItem('openAt')?.split(':')[0];
      const closeAt = localStorage.getItem('closeAt')?.split(':')[0];
      const shift = (closeAt - openAt) * 3600000;

      return shift || this.avgStay;
    },

    ConfirmModernDialog() {
      return this.$refs.ConfirmModernDialog;
    },

    EventModernDialog() {
      return this.$refs.EventModernDialog;
    },

    cal() {
      return this.ready ? this.$refs.calendar : null;
    },

    nowY() {
      return this.cal ? this.cal.timeToY(this.cal.times.now) + 'px' : '-10px';
    },

    isDefaultGraph() {
      return this.graphName === this.$defaultGraphName;
    },

    getGraphNameString() {
      return `the ${this.getGraphName()} exposure graph`;
    },

    updateFeedbackMessage() {
      return `Ready to revert your last edit to its original value? ${this.getInterval(
        this.original.start,
        this.original.end
      )}?`;
    },

    visitCache() {
      const activeVisits = Visit.getVisits(true, this.expiredTimestamp);
      const activeAppointments = Appointment.getAppointments(
        true,
        this.expiredTimestamp
      );
      if (this.type === 'day') {
        console.groupCollapsed('Active visits:');
        console.log(printJson(activeVisits));
        console.log('Your visits', this.getYourEvents(activeVisits));
        console.groupEnd();
      } else if (this.type === 'category') {
        console.groupCollapsed('Active Appointments:');
        console.log(printJson(activeAppointments));
        console.log(
          'Your Appointments',
          this.getYourAppointments(activeAppointments)
        );
        console.groupEnd();
      }
      return this.type === 'day'
        ? this.getYourEvents(activeVisits)
        : activeVisits;
    },

    visibleEvents() {
      return this.cal.getVisibleEvents();
    },
    visitorIsOnline() {
      return this.userID;
    },
    yourVisits() {
      return this.type === 'day' ? this.yourEvents : this.visits;
    },

    relevantEvents() {
      if (!this.ready) {
        return [];
      }
      const x = this.appointments
        ? [...Visit.all(), ...this.appointments]
        : Visit.all();
      return x;
    },
  },

  data: () => ({
    currentAppointmentID: null,
    ready: false,
    v: null,
    a: null,
    appointment: null,
    ageOfExpiredEvents: 14,
    expiredTimestamp: null,
    categories: ['You', 'Them'],
    selectedOptions: null,

    customEventOptions: {
      buttons: [
        { label: 'Delete', act: 'DELETE' },
        { label: 'Cancel', act: 'CANCEL' },
        { spacer: true },
        {
          label: 'Save',
          color: 'secondary',
          outlined: true,
          act: 'SAVE',
        },
        { spacer: true },
        { label: 'Book', act: 'BOOK', tip: 'Make an appointment' },
        { spacer: true },
        { label: 'Log', act: 'LOG' },
      ],
    },
    customBookEventOptions: {
      buttons: [
        { label: 'Delete', act: 'DELETE' },
        { label: 'Cancel', act: 'CANCEL' },
        { spacer: true },
        {
          label: 'Save',
          color: 'secondary',
          outlined: true,
          act: 'SAVE',
        },
      ],
    },

    customOptions: {
      buttons: [
        { label: "Don't Save" },
        { label: 'Cancel', agree: 0 },
        {
          label: 'Save',
          color: 'secondary',
          outlined: true,
          agree: 1,
        },

        { label: 'log', agree: 0 },
      ],
    },
    action: '', // used by handlekeydown
    calendarEvent: null,
    parsedEvent: null,
    selectedOpen: true,
    selectedElement: null,

    sheetHeight: 0,
    calendarHeight: 0,
    bp: null,
    editing: false,
    modalStart: false,
    modalEnd: false,
    starttime: '',
    endtime: '',
    editedStart: '',
    editedEnd: '',

    onCalendar: true,
    calendarElement: null,
    status: 'Ready',
    original: { start: 0, end: 0 },

    visits: [],
    place: null,
    type: 'day',
    snackBar: false,
    snackBarNew: false,
    feedbackMessage: '',
    focus: '',
    typeToLabel: {
      category: 'Appointment',
      month: 'Month',
      week: 'Week',
      day: 'Day',
      '4day': '4 Days',
    },

    // used by revert()
    cachedCalendarEvent: {},

    //#region  drag and drop
    dragEvent: null,
    dragStart: null,
    createEvent: null,
    createStart: null,
    extendOriginal: null,
    dragEnd: null,
    pointerType: '',
    //#endregion drag and drop
  }),

  methods: {
    getGraphStatus() {
      if (!this.ready) {
        return;
      }

      const status = this.parsedEvent.input.loggedNodeId
        ? `is logged on the <strong>${this.parsedEvent.input.graphName}</strong> graph`
        : `is <strong>not logged</strong> to any graph yet. `;
      return status;
    },

    onSetDate(date) {
      this.date = date;
    },

    onSetTime(time, isStart) {
      if (isStart) {
        this.starttime = time;
      } else {
        this.endtime = time;
      }
    },

    onModifyEvent(type, direction) {
      const event = this.parsedEvent;
      const visit = this.getCurrentVisit();
      console.log(warn('Editing event ID:', event.input.id));
      console.log(warn('Orig visit start:', visit.start, visit.interval));

      let startDate = this.calendarTimestampToDate(event.start);
      console.log('Event start', startDate.hour, startDate.minute);

      let endDate = this.calendarTimestampToDate(event.end);
      console.log('Event end', endDate.hour, endDate.minute);
      if (endDate.hour === 23 && endDate.minute === 45) {
        alert('End of day. LCT does not support multiday events currently.');
        return;
      }
      const incr = 1000 * 60 * 15;
      switch (type) {
        case 'move':
          switch (direction) {
            case 'dn':
              startDate.ts += incr;
              endDate.ts += incr;
              break;
            case 'up':
              startDate.ts -= incr;
              endDate.ts -= incr;
              break;
          }
          break;

        case 'collapse':
          // increase top/decrease bottom or both
          switch (direction) {
            case 'dn':
              endDate.ts -= incr;
              break;
            case 'up':
              startDate.ts += incr;
              break;
            case 'both':
              startDate.ts += incr;
              endDate.ts -= incr;
              break;
          }
          break;

        case 'expand':
          // decrease top/increase bottom or both
          switch (direction) {
            case 'dn':
              endDate.ts += incr;
              break;
            case 'up':
              startDate.ts -= incr;
              break;
            case 'both':
              startDate.ts -= incr;
              endDate.ts += incr;
              break;
          }
          break;
      }

      visit.start = startDate.ts;
      visit.end = endDate.ts;
      const dt1 = new Date(visit.start);
      const dt2 = new Date(visit.end);
      const starttime = dt1.getHours() + ':' + dt1.getMinutes();
      const endtime = dt2.getHours() + ':' + dt2.getMinutes();
      console.log('onModifyEvent', starttime, endtime);

      this.starttime = starttime;

      this.endtime = endtime;
    },

    getYourEvents(activeVisits) {
      const filter = (visit) => visit.category === 'You';
      let x = activeVisits.filter(filter);
      return x;
    },
    getYourAppointments(activeAppointments) {
      const filter = (a) => a.provider === this.username;
      let x = activeAppointments.filter(filter);
      return x;
    },

    getGraphName() {
      return this.graphName || this.$defaultGraphName;
    },

    toggleCategories() {
      this.type = this.type === 'day' ? 'category' : 'day';
      this.status = this.type;
    },

    allowedStep: (m) => m % 15 === 0,

    formatStartEndTime: (t) => formatSmallTime(t),

    // called by event-color calendar event
    getEventColor(event) {
      const c =
        this.parsedEvent?.input.id === event.id
          ? `${event.color} darken-1`
          : event.color;
      return c;
    },

    // called when you click the interval on the left side of the calendar
    // not sure what to do with this, but it's cool.
    showInterval(interval) {
      console.log('showInterval:', printJson(interval));
    },

    manageAppointments() {
      // create an appointment so we have a parsedEvent
      this.addAppointment();
      this.showAppointmentDialog();
      console.log(success(printJson(this.parsedEvent)));
    },

    showDialog() {
      if (this.parsedEvent.input.category === 'You') {
        this.showEventDialog();
      } else {
        this.showAppointmentDialog();
      }
    },

    showAppointmentDialog() {
      const question = `Manage appointment for ${DateTime.fromMillis(
        this.roundTime(this.starttime)
      ).toFormat('T')}?`;
      const consequences = 'This will update your public calendar.';

      const icon = 'mdi-update';
      const options = {
        icon: icon,
        parsedEvent: this.parsedEvent,
        starttime: this.starttime,
        endtime: this.endtime,
        isAppointment: true,
      };

      this.EventModernDialog.setCustomOptions(this.customBookEventOptions);

      this.EventModernDialog.open(question, consequences, options).then(
        (action) => {
          switch (action) {
            case 'DELETE':
              this.deleteEvent();
              break;
            case 'CANCEL':
              this.revert();
              break;

            case 'SAVE':
              this.saveAppointment(this.parsedEvent.input);
              break;
          }
        }
      );
    },

    showEventDialog() {
      const question = `Edit ${this.atWorkAt ? 'Shift at' : 'Visit to'} ${
        this.parsedEvent.input.name
      }?`;
      const consequences = `${
        this.parsedEvent.input.name
      } ${this.getGraphStatus()}`; //`You are editing place ID: ${this.parsedEvent.input.place_id}`;
      const icon = this.atWorkAt ? 'mdi-facebook-workplace' : 'mdi-calendar';

      const options = {
        icon: icon,
        parsedEvent: this.parsedEvent,
        starttime: this.starttime,
        endtime: this.endtime,
        visitorIsOnline: this.visitorIsOnline,
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
              this.revert();
              break;
            case 'SAVE':
              this.saveVisit(this.parsedEvent.input);
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

          this.reset();
        }
      );
    },

    // @click:event="showEvent"
    // showEvent will open the Event menu so phone users can reliably change start/end times.
    // value is an instance of the Visit object which is an event that constitutes the calendar's events array
    showEvent({ nativeEvent, event }) {
      if (!event) {
        return;
      }
      const { id } = event;

      // get access to the event's index and CalendarTimestamp data
      this.parsedEvent = this.getCurrentEvent(id);

      // this.mementoID = this.parsedEvent.input.id;
      // this.memento = new Memento(this.getCurrentVisit());
      // this.caretaker.add(this.mementoID, this.memento.hydrate());

      if (!this.parsedEvent) {
        this.status = `You cannot edit a past event. We delete events older than ${this.ageOfExpiredEvents} days.`;
        return;
      }

      console.log(warn(printJson(this.parsedEvent)));

      this.starttime = this.parsedEvent.start.time;
      this.endtime = this.parsedEvent.end.time;

      //selectedElement is the activator was for the Event Menu.
      // Dialog doesn't use activator
      this.selectedElement = nativeEvent.target;
      // open the event edit dialog
      // we will adjust the start/end times in realtime
      // if user cancels, we refresh the visits from the cache by calling revert()
      // otherwise we update the cache with the new values by calling saveVisit()
      this.showDialog();
      this.action = 'SAVE'; // Save is the default action
      this.status = ` ${this.cal.eventOverlapMode} overlap mode with ${this.cal.eventOverlapThreshold} minute threshold`;
    },

    //#region  Drag and Drop
    // called by event slot in calendar
    // @mousedown.stop=
    // @touchstart.stop
    extendBottom(event) {
      this.createEvent = event;
      this.createStart = event.start;
      this.extendOriginal = event.end;
      this.cachedCalendarEvent = this.createEvent;
      this.original.start = event.start;
      this.original.end = event.end;
    },

    // @mousedown:event="startDrag"
    // @touchstart:event="startDrag"
    startDrag({ nativeEvent, event, timed }) {
      if (!event) {
        console.log('Leaving drag');
        return;
      }
      this.parsedEvent = this.getCurrentEvent(event.id);
      console.log(warn(printJson(this.parsedEvent)));

      // this.status = 'Changing time slot';

      this.pointerType = nativeEvent.type;
      if (nativeEvent.type === 'touchstart') {
        nativeEvent.preventDefault();
      }
      if (event && timed) {
        this.dragEvent = event;
        this.dragTime = null;
        this.extendOriginal = null;
        this.original.start = this.dragEvent.start;
        this.original.end = this.dragEvent.end;
        this.cachedCalendarEvent = this.dragEvent;
      }
    },

    // @mousedown:time="startTime"
    // @touchstart:time="startTime"
    // recorded once with the first mouse click or touch
    // can have any arbitrary value (depending only on mouse/finger position)
    // tms looks like this:
    //  {
    //     "date": "2021-06-01",
    //     "time": "08:00",
    //     "year": 2021,
    //     "month": 6,
    //     "day": 1,
    //     "weekday": 2,
    //     "hour": 8,
    //     "minute": 0,
    //     "hasDay": true,
    //     "hasTime": true,
    //     "past": false,
    //     "present": true,
    //     "future": false
    //  },
    startTime(tms) {
      const mouse = this.toTime(tms);

      // enable a drag of an existing event
      if (this.dragEvent && this.dragTime === null) {
        // store the start value outside drag and drop so we don't log the wrong times to the server with swipeLeft
        this.original.start = this.dragEvent.start;
        this.original.end = this.dragEvent.end;

        this.dragTime = mouse - this.original.start;
        console.log(highlight('dragtime', this.dragTime));
      }
      // TODO When will this method addEvent()?
      // new event specified by this.place
      else if (this.place) {
        this.addEvent(mouse, this.place_id, this.place.stay);
      } else {
        this.parsedEvent = null;
      }
    },

    // @mousemove:time="mouseMove"
    // @touchmove:time="mouseMove"
    mouseMove(tms) {
      // mouse can move all over the calendar...
      const mouse = this.toTime(tms);
      //...but we care only if a dragEvent or createEvent exists

      // change the whole interval by dragging
      if (this.dragEvent && this.dragTime !== null) {
        console.log(
          highlight('changing the time slot using', this.pointerType)
        );
        const start = this.dragEvent.start;
        const end = this.dragEvent.end;
        const duration = end - start;
        const newStartTime = mouse - this.dragTime;
        const newStart = this.roundTime(newStartTime);
        const newEnd = newStart + duration;
        const delta = Math.abs(this.dragEvent.start - newStart);

        // update event in 15 minute increments
        if (delta > 890000) {
          this.dragEvent.start = newStart;
          this.dragEvent.end = newEnd;
          // this.dragEvent.interval = this.getInterval(
          //   this.dragEvent.start,
          //   this.dragEvent.end
          // );
        }
      }
      // change the (start and) end time on the lower edge of the event
      else if (this.createEvent && this.createStart !== null) {
        // console.log(highlight(`changing the slot's end time`));

        const mouseRounded = this.roundTime(mouse, false);
        const min = Math.min(mouseRounded, this.createStart);
        const max = Math.max(mouseRounded, this.createStart);

        this.createEvent.start = min;
        this.createEvent.end = max;
        // this.createEvent.interval = this.getInterval(
        //   this.createEvent.start,
        //   this.createEvent.end
        // );
      }
    },

    // @mouseup:time="endDrag"
    // @touchend:time="endDrag"
    // handles updates:
    // this.original stores visit's original interval
    // called by drag or extendBottom
    endDrag(calendarTimestamp) {
      console.log('endDrag produced:');
      console.log(printJson(calendarTimestamp));
      this.reset();
    },

    reset() {
      this.calendarElement.style.overflowY = 'auto';

      this.dragTime = null;
      this.dragEvent = null;
      this.createEvent = null;
      this.createStart = null;
      this.extendOriginal = null;
      this.place = null;
      this.selectedOpen = false;
    },

    //#endregion Drag and Drop

    //#region Non Pointer methods

    goRight() {
      this.selectedOpen = false;
      if (!this.parsedEvent) {
        console.log('No visit selected');
        return;
      }
      console.log('Going Right...');
      const visit = this.getCurrentVisit();
      const question = `Are you sure you want to DELETE ${visit.name}`;
      const consequences = visit.loggedNodeId
        ? "You won't see exposure alerts due to this visit."
        : "You won't be able to log this visit to the exposure graph.";
      const icon = 'mdi-alert-outline';
      this.customOptions.buttons[0] = null;
      this.customOptions.buttons[2].label = 'Yes';

      this.action = 'DELETE'; // in case keydown is Enter

      this.ConfirmModernDialog.open(question, consequences, {
        icon: icon,
      }).then((act) => {
        if (act) {
          this.act('DELETE');
          this.reset();
          this.parsedEvent = null;
        }
      });
    },

    // this is the only way to call logVisit (indirectly through this.act('LOG'))
    goLeft() {
      this.selectedOpen = false;

      if (!this.parsedEvent) {
        console.log('No visit selected');
        return;
      }
      console.log('Going Left...');
      const visit = this.getCurrentVisit();
      const cachedVisit = this.getCurrentVisitFromCache();
      const graphName = visit.graphName || this.getGraphName();

      this.status = visit.logged
        ? `Updating a previously logged ${visit.name} visit to ${graphName} graph.`
        : `Logging visit on the ${graphName} graph...`;

      const question =
        visit.interval !== cachedVisit.interval
          ? `You changed your ${visit.name} visit. Save and continue to ${graphName} graph?`
          : `Are you sure you want to LOG ${visit.name} to ${graphName} graph?`;
      const consequences =
        graphName === this.$defaultGraphName
          ? `You are logging to ${graphName}. Future exposure alerts will be real (not practice drills).`
          : `Remember, this visit is going to ${graphName}, so any alerts are practice drills.`;
      const icon = 'mdi-alert-outline';

      this.customOptions.buttons[0] = null;
      this.customOptions.buttons[2].label = 'Yes';

      this.action = 'LOG'; // in case keydown is Enter

      this.ConfirmModernDialog.open(question, consequences, {
        icon: icon,
      }).then((act) => {
        if (!act) {
          this.revert();
          return;
        }
        // logVisit will save before logging
        this.act('LOG');
        this.reset();
      });
    },

    // global action switch
    act(action) {
      switch (action) {
        case 'DELETE':
          this.deleteEvent();
          break;

        case 'REVERT':
          this.revert();
          break;
        case 'SAVE':
          this.saveVisit();
          break;
        case 'BOOK':
          this.bookAppointment();
          break;
        case 'LOG':
          this.logVisit();
          break;

        default:
          this.throwError(
            'Calendar.act(action)',
            `Cannot handle ${action} action`,
            'This error does not effect you. Sorry for the interruption'
          );
      }

      this.reset();
    },

    revert() {
      this.selectedOpen = false;
      this.visits = Visit.all();
      this.reset();
    },

    arrayRemove(arr, value, prop = 'id') {
      // console.log(value);
      return arr.filter((ele) => {
        // console.log(ele[prop]);
        return ele[prop] != value;
      });
    },

    // TODO use parsedEvent instead and make this a filter
    getInterval(start, end) {
      return `${start.toFormat('T')}-${end.toFormat('T')}`;
    },

    addEvent(time, place_id = this.place_id, stay = this.avgStay) {
      const graphname = this.getGraphName();
      this.createStart = this.roundTime(time);
      const endTime = this.createStart + stay;

      const name = this.place.name;
      console.log(
        `Adding an event. Start: ${
          this.createStart
        }  End: ${endTime}  ET: ${endTime - this.createStart}`
      );
      this.createEvent = {
        id: randomId(),
        name: name,
        place_id: place_id,
        start: this.createStart,
        end: endTime,
        date: new Date(this.createStart).toDateString(),
        // interval: this.getInterval(this.createStart, endTime),
        timed: true,
        marked: getNow(),
        graphName: graphname,
        color: this.isDefaultGraph ? 'secondary' : 'sandboxmarked',
        logged: '', // this will contain the internal id of the relationship in redisGraph
      };

      let newVisit = { ...this.createEvent };
      // TODO is there any circumstance where Visit needs lat/lng
      // that is, when place_id is not sufficient?
      // const {lat, lng}= Place.getPosition(this.place.place_id)
      //       newVisit.lat = lat;
      //       newVisit.lng = lng;
      newVisit.place_id = this.place.place_id;

      const t1 = DateTime.fromMillis(this.createStart);
      const t2 = DateTime.fromMillis(endTime);

      newVisit.interval = `${t1.toFormat('T')}-${t2.toFormat('T')}`;
      Visit.updatePromise(newVisit)
        .then((p) => {
          console.log('Added visit to cache', printJson(p));
        })
        .catch((err) => {
          this.throwError(
            'Calendar.addEvent(time, place_id = this.place_id, stay = this.avgStay)',
            err,
            `Oops. Sorry, we had trouble adding a visit on your calendar. Notified devs.`
          );
        });

      this.place = null;
    },

    // only called by mount. shift will be taken from localStorage for employee
    // customer has null shift
    // TODO  avgStay should be computed based on visitor's history
    newEvent() {
      const time = this.place.startTime || Date.now();
      const shift = this.place.shift;
      const place_id = this.place.place_id;
      this.addEvent(time, place_id, shift);

      this.endDrag();
    },

    // called by the EventDialog BOOK option
    // creates an appointment using current time as default
    // shows the Customer and Appointment controls in the dialog
    bookAppointment() {
      console.log(printJson(this.appointment));
      const time = this.calendarTimestampToDate(this.appointment);
      this.addAppointment(time, `Booked by: ${this.username}`, 1000 * 60 * 30);
    },

    // can be called by ShowEventDialog() at the start of the business day
    // or can be called by clicking a public calendar time
    addAppointment(
      time = DateTime.now().ts,
      name = 'customer',
      slotInterval = 30 * 1000 * 60
    ) {
      this.starttime = this.roundTime(time);
      this.endtime = time + slotInterval;

      this.currentAppointmentID = randomId();
      this.createStart = this.starttime;
      this.createEvent = {
        id: this.currentAppointmentID,
        name: name,
        provider: this.username,
        date: new Date(this.createStart).toDateString(),
        start: this.starttime,
        end: this.endtime,
        timed: true,
        category: 'Them',
      };
      Appointment.updatePromise(this.createEvent)
        .then(() => {
          this.parsedEvent = this.getCurrentEvent(this.currentAppointmentID);
          console.log(
            'Added Appointment to cache',
            printJson(this.parsedEvent)
          );
        })
        .catch((err) => {
          this.throwError(
            'Calendar.Appointment.updatePromise(this.createEvent)',
            err,
            `Oops. Sorry, we had trouble managing your public calendar. Notified devs.`
          );
        });
      // }
    },

    deleteEvent() {
      if (this.parsedEvent.input.category === 'Them') {
        Appointment.deletePromise(this.parsedEvent.input.id)
          .then(() => {
            console.log(`Deleted ${this.parsedEvent.input.name}'s appointment`);
            this.parsedEvent = null;
          })
          .catch((err) => {
            this.throwError(
              'Calendar.deleteEvent()',
              err,
              `Oops. Sorry, we had trouble deleting the visit from your calendar. Notified devs.`
            );
          });
      } else {
        this.deleteVisit();
      }
    },

    deleteVisit() {
      const self = this;
      const { id, loggedNodeId, graphname } = this.parsedEvent.input;
      Visit.deletePromise(id)
        .then(() => {
          self.confirm = false;
          // let visits = self.visits;
          // self.visits = self.arrayRemove(visits, id);

          console.log(success(`Visit ${id} deleted.`));
          // self.status = `DELETED local data: ${visit.name} ${visit.interval} id: ${visit.id}`;
          // console.log(`New Visit ct: ${self.visits.length} `);
          if (!loggedNodeId) {
            return;
          }
          self.$emit('deleteVisit', { loggedNodeId, graphname });
        })
        .catch((err) => {
          this.throwError(
            'Calendar.deleteVisit()',
            err,
            `Oops. Sorry, we had trouble deleting the visit from your calendar. Notified devs.`
          );
        });
    },

    logVisit() {
      try {
        let visit = this.getCurrentVisit();

        console.log(
          success('CalendarCard.js: Logging visit:', printJson(visit))
        );
        this.saveVisit(visit);

        // when App.vue sees the callback it will call the Visit entity to update the logged field to the internal ID of the relationship node and the color to primary
        this.$emit('logVisit', visit);
        this.status = 'Logged to server. Stay safe out there.';
      } catch (err) {
        this.throwError(
          'Calendar.logVisit()',
          err,
          `Oops. Sorry, we had trouble logging the visit on the server. Notified devs.`
        );
      }
    },

    getCurrentAppointment() {
      return Appointment.find();
    },

    // visit has new start/end values set by Event edit menu
    saveAppointment() {
      this.selectedOpen = false;
      Appointment.updatePromise(this.parsedEvent.input)
        .then(() => {
          console.log(
            success(`New/Saved Appointment:`, printJson(this.parsedEvent.input))
          );
        })
        .catch((err) => {
          this.throwError(
            'Calendar.saveAppointment()',
            err,
            `Oops. Sorry, we had trouble saving the appointment on your calendar. Notified devs.`
          );
        });
    },
    // visit has new start/end values set by Event edit menu
    saveVisit() {
      this.selectedOpen = false;
      const t1 = DateTime.fromMillis(this.parsedEvent.input.start);
      const t2 = DateTime.fromMillis(this.parsedEvent.input.end);

      this.parsedEvent.input.interval = `${t1.toFormat('T')}-${t2.toFormat(
        'T'
      )}`;
      // TODO we are updating Visit in two places. why?
      Visit.updatePromise(this.parsedEvent.input)
        .then(() => {
          console.log(
            success(`New/Saved Visit:`, printJson(this.parsedEvent.input))
          );
          // const destination = this.visitorIsOnline
          //   ? `on the ${this.getGraphName()} exposure graph`
          //   : `in localStorage`;
          // this.status = `SAVED: ${visit.name} ${visit.interval} id: ${visit.id} ${destination}`;
        })
        .catch((err) => {
          this.throwError(
            'Calendar.saveVisit()',
            err,
            `Oops. Sorry, we had trouble saving the visit on your calendar. Notified devs.`
          );
        });
    },

    viewDay({ date }) {
      this.focus = date;
      this.type = 'day';
    },

    getEventPrimaryColor(event) {
      return event ? 'primary' : 'secondary';
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
    //#endregion

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

    getCurrentTime() {
      return this.cal
        ? this.cal.times.now.hour * 60 + this.cal.times.now.minute
        : 0;
    },

    // id is passed in with showEvent.
    getCurrentEvent(id) {
      return this.cal.getVisibleEvents().find(({ input }) => input.id === id);
    },

    getCurrentVisit() {
      return this.visitCache
        .flat()
        .find((v) => v.id == this.parsedEvent.input.id);
    },

    getCurrentVisitFromCache() {
      return Visit.find(this.parsedEvent.input.id);
    },

    scrollToTime(time = this.getCurrentTime()) {
      const first = Math.max(0, time - (time % 30) - 100);
      this.cal.scrollToTime(first);
      console.log(`scrolled to time at ${first}`);
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

    handleKeydown(ev) {
      console.log(highlight('key/action'), ev.code, this.action);
      switch (ev.code) {
        case 'Delete':
          this.goRight(); // calls confirmation with the Del key
          break;
        case 'Tab':
          if (!this.visitorIsOnline) {
            this.status =
              'Tab key disabled. You cannot log your visit to the server if you are offline.';
            return;
          }
          this.goLeft(); // calls confirmation with the Tab key
          break;

        case 'Escape':
          this.reset(); // calls confirmation with the Escape key
          break;

        case 'KeyY':
        case 'Enter':
          switch (this.action) {
            case 'SAVE':
              this.saveVisit();
              break;

            case 'DELETE':
              // NOOP. Already deleted
              break;

            case 'LOG':
              this.logVisit();
              break;

            case 'REVERT':
              this.revert();
              break;

            default:
              alert('handleKeydown cannot access this.action');
          }
          break;

        case 'KeyN':
          this.reset(); // calls confirmation with the N key
          break;
      }
    },

    throwError(source, err, message) {
      console.log(error(printJson(err)));
      this.status = message;
      this.$emit('error', {
        source: source,
        error: err,
      });
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

  watch: {
    // example of a nested watcher:
    'options.starttime': function(newValue, oldValue) {
      console.log('starttime n/o:', newValue, oldValue);
    },
    // 'dragEvent.start': function (newValue, oldValue) {
    //   console.log('dragEvent.start n/o:', newValue, oldValue);
    // },

    cal(newVal) {
      // TODO do you really need this.ready? why not just check for null this.cal?
      this.ready = newVal;
      this.cal.checkChange();
      this.scrollToTime();
      this.updateTime();
    },

    type() {
      if (this.type === 'category') {
        this.status = 'Booked Appointments are events: ';
      }
    },

    graphName(newVal, oldVal) {
      console.log('Graph name is', newVal, 'and was', oldVal);
      this.status = `You are ${
        this.graphName === this.$defaultGraphName
          ? 'using'
          : 'experimenting with'
      }  ${this.getGraphNameString}`;
    },

    visitCache(newVal) {
      const x = [...newVal, ...this.appointments];
      this.visits = x;
    },

    starttime(newVal, oldVal) {
      if (!oldVal) {
        return;
      }
      this.changeTimeStamp({ isStart: true, val: newVal });
    },

    endtime(newVal, oldVal) {
      if (!oldVal) {
        return;
      }
      this.changeTimeStamp({ isStart: false, val: newVal });
    },
  },

  created() {},

  mounted() {
    const self = this;
    const bp = self.$vuetify.breakpoint;
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
    const y = 250;
    self.sheetHeight = x - y;
    self.calendarHeight = self.sheetHeight * 0.8;
    console.log('sheetHeight:', self.sheetHeight);
    console.log('calendarHeight:', self.calendarHeight);

    self.calendarElement = document.getElementById('calendar-target');
    self.expiredTimestamp = DateTime.now().minus({
      day: this.ageOfExpiredEvents,
    }).ts;

    Promise.all([Place.$fetch(), Visit.$fetch(), Appointment.$fetch()])
      .then((results) => {
        console.log(results[0].length, 'Places');
        console.log(results[1].length, 'Visits');
        console.log(results[2].length, 'Appointments');

        const expiredVisits = Visit.getVisits(false, self.expiredTimestamp);
        console.log('Expired visits:', printJson(expiredVisits));
        expiredVisits.forEach((visit) => {
          if (visit.loggedNodeId) {
            self.$emit('deleteVisit', visit);
          }
          Visit.delete(visit.id);
        });

        // selectedSpace set in App.onAddedPlace()
        // TODO do we change place on the Calendar? i hope not. if not, use selectedSpace instead of place
        self.type =
          localStorage.getItem('usesPublicCalendar') !== 'true'
            ? 'day'
            : 'category';
        self.categories = [self.username, localStorage.getItem('people')];
        self.place = self.selectedSpace;
        if (self.place) {
          self.newEvent();
        }

        document.addEventListener('keydown', this.handleKeydown);
        console.log('Using ' + self.getGraphNameString);
        self.status = 'Using ' + self.getGraphNameString;

        console.log('mounted calendarCard');
        this.ready = true;
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
