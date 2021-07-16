<template>
  <div id="calendarDiv" class="fill-height">
    <!-- YesNo snackbar -->
    <v-snackbar
      id="connectSnackbar"
      :value="showYesNoSnackbar"
      :timeout="-1"
      absolute
      centered
      :color="snackBarColor"
      elevation="24"
      vertical
    >
      {{ yesNoSnackbarText }}

      <template v-slot:action="{ attrs }">
        <v-btn :color="snackBarButtonColor" text v-bind="attrs" @click="onYes">
          Yes
        </v-btn>
        <v-btn
          :color="snackBarButtonColor"
          text
          v-bind="attrs"
          @click="showYesNoSnackbar = false"
        >
          No
        </v-btn>
      </template>
    </v-snackbar>
    <v-snackbar
      id="calendarSnackbar"
      :timeout="-1"
      :value="showSnackbar"
      absolute
      centered
      :color="snackBarColor"
      elevation="24"
      vertical
    >
      {{ snackBarText }}

      <template v-slot:action="{ attrs }">
        <v-btn
          :color="snackBarButtonColor"
          text
          v-bind="attrs"
          @click="showSnackbar = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>

    <EventModernDialog
      id="EventModernDialog"
      ref="EventModernDialog"
      :customEventOptions="selectedOptions"
      @setDate="onSetDate"
      @setTime="onSetTime"
    />
    <v-sheet id="calendarSheet" class="overflow-hidden" :height="sheetHeight">
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
                  <v-btn
                    outlined
                    color="grey darken-2"
                    v-bind="attrs"
                    v-on="on"
                  >
                    <span>{{ typeToLabel[type] }}</span>
                    <v-icon right> mdi-menu-down </v-icon>
                  </v-btn>
                </template>
                <v-list>
                  <v-list-item @click="type = 'category'">
                    <v-list-item-title>Work</v-list-item-title>
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
              :show-interval-label="onShowIntervalLabel"
              :interval-count="intervalCount"
              :first-time="firstTime"
              :interval-minutes="intervalMinutes"
              @click:more="viewDay"
              @click:date="viewDay"
              @click:interval="onIntervalClick"
              @click:event="showEvent"
              @change="handleChange"
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

      <v-row
        id="statusRow"
        no-gutters
        align="end"
        class="ma-0  overflow-hidden"
      >
        <v-col
          ><div class="mt-5 mb-0 ml-15">
            <small>{{ status }}</small>
          </div>
        </v-col>
      </v-row>
      <v-row
        id="tipRow"
        no-gutters
        align="end"
        class="mt-0 ml-0 overflow-hidden"
      >
        <v-col
          ><div class="text-center  mt-2">
            <small>Tip: {{ tip }}</small>
          </div>
        </v-col>
      </v-row>
    </v-sheet>
  </div>
</template>

<script>
import crypto from 'crypto';
const randomId = () => crypto.randomBytes(8).toString('hex');

// import Setting from '@/models/Setting';
import Visit from '@/models/Visit';
// import Place from '@/models/Place';
import Appointment from '@/models/Appointment';

// TODO Come back to fix this complex mixin strategy later
// import { eventDialog } from '../mixins/eventDialog';

import { DateTime, getNow, formatSmallTime } from '../utils/luxonHelpers';
import { success, warn, highlight, printJson } from '../utils/colors';

export default {
  name: 'Calendar',

  // mixins: [eventDialog],

  // TODO Remember this is the last step in wiring renderless components (see App.vue)
  // Step 5: take one or more properties exposed by State render() function
  props: {
    selectedSpace: Object,
    state: { type: Object, required: true },
    logVisit: Function,
    graphName: String, // changes to graph come from App.js
  },

  components: {
    // ConfirmModernDialog: () => import('./cards/dialogCard'),
    EventModernDialog: () => import('../components/cards/eventDialogCard.vue'),
  },

  computed: {
    isConnected() {
      return this.$socket.connected;
    },
    cachedVisits() {
      const x = this.state.visits.filter((v) => v.loggedNodeId === '');
      return x;
    },
    cachedVisitsCt() {
      return this.cachedVisits.length;
    },

    userID() {
      return this.settings.userID;
    },
    username() {
      return this.settings.username;
    },
    avgStay() {
      return this.settings.avgStay * 60000;
    },

    params() {
      return this.$router.params;
    },

    settings() {
      const settings = this.state.settings;
      return settings || [];
    },
    usesPublicCalendar() {
      return this.settings.usesPublicCalendar;
    },

    appointments() {
      const a = Appointment.all();
      return a;
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
      return x || this.visibleEvents[0] || this.selectedEventParsed;
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

    isAtWorkAt() {
      const x = this.settings.business === this.currentEvent.name;
      const y = localStorage.getItem('business') === this.currentEvent.name;
      return x || y;
    },

    isCategoryCalendar() {
      return this.type === 'category';
    },

    isDefaultGraph() {
      return this.graphName === this.$defaultGraphName;
    },

    isTakingAppointments() {
      return (
        this.usesPublicCalendar ||
        localStorage.getItem('usesPublicCalendar') === 'true'
      );
    },

    relevantEvents() {
      if (!this.ready) {
        return [];
      }
      // TODO should this property include all visits or only those for the selected day?
      const x = [...Visit.all(), ...this.appointments];
      return x;
    },

    visibleEvents() {
      // TODO does this property include past or future events?
      const x = this.cal?.getVisibleEvents();
      return x;
    },

    visitorIsOnline() {
      return this.userID;
    },
  },

  data: () => ({
    tip:
      'You can add appointments by clicking a time interval for any selected day.',
    dragAndDrop: false,
    openAt: '',
    closeAt: '',
    // Calendar uses this format
    DATE_FORMAT: 'yyyy-LL-dd',
    categories: ['You', 'Them'],
    currentDate: null,
    customEventOptions: {
      buttons: [
        { label: 'Delete', act: 'DELETE' },
        { label: 'Cancel', act: 'CANCEL' },
        { label: 'Close', act: 'DONE' },

        { spacer: true },
        { label: 'Log', act: 'LOG', color: 'secondary', outlined: true },

        // { label: 'Book', act: 'BOOK', tip: 'Make an appointment' },
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
    firstTime: '00:00',
    focus: '',
    intervalCount: 24,
    intervalMinutes: 20,
    place: null,
    status: 'Select a calendar event to edit',
    ready: false,
    selectedElement: null,
    selectedEventParsed: null,
    selectedEventId: '',
    selectedOptions: null,
    sheetHeight: 0,
    showYesNoSnackbar: false,
    showSnackbar: false,
    snackBarButtonColor: 'error lighten-3',
    snackBarColor: 'error',
    snackBarText: '',
    yesNoSnackbarText: '',
    calendarHeight: 0,
    typeToLabel: {
      category: 'Work',
      month: 'Month',
      week: 'Week',
      day: 'Day',
      '4day': '4 Days',
    },
    /* combinations of update
     *   Add Visit (category==='You')
     *   Add Appointment (category==='Them')
     *   Update Visit field (category==='You' || id)
     *   Update Appointment field (category==='Them' || id)
     *   Delete Appointment (category==='Them')
     *   Delete Visit (category==='You')
     */
    actions: {
      isDay: {
        add: (data, f) => Visit.updatePromise(data, f),
        update: (data, f) => Visit.updateFieldPromise(data, f),
        delete: (data, f) => Visit.deletePromise(data, f),
      },
      isCategory: {
        add: (data, f) => Appointment.updatePromise(data, f),
        update: (data, f) => Appointment.updateFieldPromise(data, f),
        delete: (data, f) => Appointment.deletePromise(data, f),
      },
    },
  }),

  methods: {
    onYes() {
      this.showYesNoSnackbar = false;
      // TODO We should see a warning if we have cachedVisits but are not connected
      if (this.isConnected && this.cachedVisitsCt) {
        this.logVisits();
      }
    },

    logVisits() {
      this.cachedVisits.forEach((visit) => {
        console.log(printJson(visit));
        this.logVisit(visit);
      });
    },

    //#region Helper functions
    validateEntities() {
      // ensure we have identifiable entities that have valid start and end dates
      Visit.validateVisits().then((invalidVisits) => {
        if (invalidVisits.length > 0) {
          this.tip = `We found and deleted ${invalidVisits.length} visits without IDs.`;

          console.groupCollapsed(warn('Invalid visit(s):'));
          console.log(printJson(invalidVisits));
        }
        console.groupEnd();
        this.ready = true;
        this.scrollToTime();
      });
      Appointment.validateAppointments().then((invalidAppointments) => {
        if (invalidAppointments.length > 0) {
          this.tip = `We found and deleted ${invalidAppointments.length} appointment(s) without IDs.`;

          console.groupCollapsed(warn('Invalid appointments:'));
          console.log(printJson(invalidAppointments));
        }
        console.groupEnd();
        if (this.isCategoryCalendar) {
          this.tip = 'Select an appointment to edit customer, date, and times.';
        }
        this.ready = true;
        this.scrollToTime();
      });
    },

    throwError(payload) {
      const { source, error, comment } = payload;
      const msg = `ERROR: ${error.message} at ${source} (${comment})`;
      console.error(msg);
      this.snackBarText = msg;
      this.showSnackbar = true;
      this.$emit('error', {
        payload,
      });
    },

    ok(check) {
      if (!check) {
        this.throwError({
          source: 'Calendar.updateCache()',
          error: { message: 'Missing action value for update' },
          comment: 'You should be able to keep working.',
        });
        return false;
      }
      return true;
    },

    updateCache(payload, f) {
      const { action, entity } = payload;
      if (!this.ok(action) || !this.ok(entity)) {
        return;
      }

      const first = entity.category === 'You' ? 'isDay' : 'isCategory';
      const second = action;
      const fun = this.actions[first][second];
      fun(payload, f);
    },

    showDialog() {
      if (this.currentEventIsYours) {
        this.showEventDialog();
      } else {
        this.showAppointmentDialog();
      }
    },
    updateCacheX(data, f) {
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
      const statusBarHeight = 50;
      const x = bp.height;
      const y = 110; // height of appbar header and footer
      this.sheetHeight = x - y;
      this.calendarHeight = this.sheetHeight - 100 - statusBarHeight;
      console.log('sheetHeight:', this.sheetHeight);
      console.log('calendarHeight:', this.calendarHeight);
      this.$refs.calendar.checkChange();
    },

    onShowIntervalLabel() {
      return true;
    },

    configureCalendar() {
      this.status = `Changing calendars. Username: ${this.state?.settings.username} SessionID: ${this.state?.settings.sessionID}`;
      if (this.isCategoryCalendar && this.isTakingAppointments) {
        this.tip =
          'You can add appointments by clicking a time interval for any selected day.';
        this.openAt = this.settings.openAt || localStorage.getItem('openAt');
        this.closeAt = this.settings.closeAt || localStorage.getItem('closeAt');
        const open = Number(this.openAt.slice(0, 2));
        const close = Number(this.closeAt.slice(0, 2));
        const range = close - open;

        this.intervalMinutes =
          this.settings.slotInterval || localStorage.getItem('slotInterval');
        this.firstTime = `${String(
          Number(this.openAt.split(':')[0]) - 1
        ).padStart(2, '0')}:${this.openAt.slice(3, 5)}`;
        this.intervalCount = range * (60 / this.intervalMinutes) + 2;
        this.status += `. intervalMinutes: ${this.intervalMinutes}  first-time: ${this.firstTime}  range: ${range}  intervalCount: ${this.intervalCount} `;
      } else {
        this.firstTime = '00:00';
        this.intervalMinutes =
          this.settings.avgStay || localStorage.getItem('avgStay');
        this.intervalCount = 24 * (60 / this.intervalMinutes);

        this.tip = 'Stay safe out there...';
      }
    },
    //#endregion Helper functions

    //#region Appointment functions

    showAppointmentDialog(newAppointment = null) {
      /**
       * newAppointment means:
       *    no sense in reverting
       *    (unless that means deleting the new appointment)
       */
      const question = `Manage appointment for ${this.currentEventParsed?.start
        .time || this.selectedEventId}?`;
      const consequences = 'This will update your public calendar.';

      const options = {
        ...this.dialogOptions,
        icon: 'mdi-update',
        intervalMinutes: this.intervalMinutes,
      };
      const entity = {
        id: this.currentEvent?.id,
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
                this.revert(entity);
              }
              break;
          }
        })
        .catch((err) => {
          console.log(err(err));
          this.status = err;
        });
    },

    /**
     *  callback from addAppointment so we can rely on the
     *  new appointment to appear in visibleElements.
     *  this way we can treat new and extant appointments the same way.
     */
    handleNewAppointment() {
      // this.showAppointmentDialog(p);
      console.groupCollapsed('New Appointment:>');
      // TODO if we set appointment in future, do we still see the correct currentEventParsed?
      console.log(success(printJson(this.currentEventParsed)));
      this.scrollToTime(this.currentEventParsed.start.time);
      console.groupEnd();
    },

    // can be called by ShowEventDialog() at the start of the business day
    // or can be called by clicking a public calendar time
    addAppointment(event) {
      const starttime = this.roundTime(event.toMillis());
      const endtime = this.roundTime(
        event.plus({ minutes: this.intervalMinutes }).toMillis()
      );
      this.selectedEventId = randomId();
      const entity = {
        id: this.selectedEventId,
        name: 'customer',
        provider: this.username,
        date: event.toISODate(),
        start: starttime,
        end: endtime,
        timed: true,
        category: 'Them',
      };
      this.updateCache({ action: 'add', entity }, this.handleNewAppointment);
    },
    //#endregion Appointment functions

    //#region Visit management functions
    checkCachedVisits() {
      if (this.cachedVisitsCt) {
        this.yesNoSnackbarText = `You have ${this.cachedVisitsCt} unlogged visits. Update the virus exposure alert graph now?`;
        this.snackBarColor = 'warning';
        this.snackBarButtonColor = 'white';
        this.showYesNoSnackbar = true;
      }
    },

    showEventDialog() {
      const question = `Edit ${this.isAtWorkAt ? 'Shift at' : 'Visit to'} ${
        this.currentEvent.name
      }?`;
      const consequences = `${this.currentEvent.name} ${this.graphStatus}`; //`You are editing place ID: ${this.currentEventParsed.input.place_id}`;
      const revertData = {
        id: this.currentEvent.id,
        category: this.currentEvent.category,
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

            // case 'BOOK':
            //   this.showAppointmentDialog();
            //   break;

            case 'LOG':
              this.logVisit(this.currentEvent);
              // TODO WAIT! there's no UI in renderless State.vue! Refactor now.
              // const msg = `${name} logged to ${this.getGraphName()} on node ${
              //   node.id
              // }.`;
              // this.snackBtnText = '';
              // this.snackWithBtnText = msg;
              // this.snackWithButtons = true;
              // console.log('updateVisitOnGraph', name, msg, node);

              // this.confirmationColor = '';
              // this.confirmationMessage = `You have logged ${this.selectedSpace.name}`;
              break;

            default:
              // if action is a date, use it to setDate()
              try {
                this.onSetDate(action);
                this.viewDay(action);
              } catch (error) {
                this.throwError({
                  source: 'Calendar.showEventDialog()',
                  error: {
                    message: `Cannot handle ${action} action`,
                    stack: 'this.EventModernDialog.open()',
                  },
                  comment:
                    'This error does not effect you. Sorry for the interruption',
                });
              }
          }
        }
      );
    },

    addVisit(time, place_id = this.place.place_id, stay = this.avgStay) {
      console.log(time, place_id, stay);
      const starttime = this.roundTime(time);
      const endtime = starttime + stay;
      const entity = {
        id: randomId(),
        name: this.place.name,
        place_id: place_id,
        start: starttime,
        end: endtime,
        date: DateTime.fromMillis(starttime).toISODate(),
        category: 'You',

        timed: true,
        marked: getNow(),
        graphName: this.graphname,
        color: this.isDefaultGraph ? 'secondary' : 'sandboxmarked',
        loggedNodeId: '', // this will contain the internal id of the relationship in redisGraph
      };

      this.updateCache({ action: 'add', entity });
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

    onIntervalClick(event) {
      // this.tip = `You are ${
      //   this.isTakingAppointments ? 'taking' : 'not taking'
      // } appointments`;
      // console.groupCollapsed('Changing Time: >');
      // if (this.isTakingAppointments) {
      const start = DateTime.local(
        event.year,
        event.month,
        event.day,
        event.hour,
        event.minute
      );
      this.addAppointment(start);
      // console.groupEnd();
      this.type = 'category';
      // return;
      // }
    },

    changeInterval(event) {
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

      const entity = startIsCloser
        ? {
            id: this.selectedEventId,
            start: newTime,
            category: this.currentEvent.category,
          }
        : {
            id: this.selectedEventId,
            end: newTime,
            category: this.currentEvent.category,
          };
      this.updateCache({ action: 'update', entity });
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

    deleteEvent(
      id = this.currentEvent.id,
      category = this.currentEvent.category
    ) {
      this.updateCache({ action: 'delete', entity: { id, category } });
    },

    revert(entity) {
      if (
        this.currentEvent.start === entity.start &&
        this.currentEvent.end === entity.end
      ) {
        this.status = 'Detected no changes';
        return;
      }
      this.status = `Reverting ${
        entity.category === 'You' ? 'visit' : 'appointment'
      } back to original times ${formatSmallTime(
        entity.start
      )} to ${formatSmallTime(entity.end)}`;
      this.updateCache({ action: 'update', entity });
    },

    //#endregion Visit management functions

    //#region Calendar functions
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

    // won't work until you add back dragAndDrop
    extendBottom(event) {
      if (!this.dragAndDrop || !this.selectedEventParsed.input) {
        return;
      }
      this.updateCache({
        action: 'update',
        val: {
          id: this.selectedEventId,
          end: event.end,
        },
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
      this.configureCalendar();

      console.groupCollapsed('handleChange(event): >');
      console.log(highlight(this.type, printJson(event)));
      console.groupEnd();
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

    // called by event-color calendar event
    getEventColor(event) {
      const c =
        this.currentEventParsed?.input.id === event.id
          ? `${event.color} darken-1`
          : event.color;
      return c;
    },
    //#endregion Calendar  functions

    //#region Calendar controls functions

    viewDay({ date }) {
      this.focus = date;
      console.log(`Going to ${date}`);
      this.status = `Going to ${date}`;
      this.type = 'day';
      this.currentDate = date;
      this.intervalCount = 24;
      this.firstTime = '00:00';
      this.intervalMinutes = 60;
    },
    setToday() {
      this.focus = '';
      this.status = `Going back to today`;
      this.scrollToTime();
    },
    prev() {
      this.cal.prev();
    },
    next() {
      this.cal.next();
    },

    //#endregion Calendar controls functions

    //#region Calendar Event handlers
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

        this.updateCache({ action: 'update', entity: this.currentEvent });
      } catch (err) {
        this.status = `This is unexpected: ${err.message}. Let's try that again...`;
      }
    },

    onSetTime(ms, isStart) {
      if (isStart) {
        this.currentEvent.start = ms;
      } else {
        this.currentEvent.end = ms;
      }
      this.updateCache({ action: 'update', entity: this.currentEvent });
    },
    //#endregion Calendar Event handlers
  },

  watch: {
    lastLoggedNodeId() {
      this.snackBarText = `Visit logged to graph node ${this.lastLoggedNodeId}`;
      this.snackBarColor = 'success';
      this.showSnackbar = true;
    },

    selectedSpace(newVal, oldVal) {
      console.log(newVal, oldVal);
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

    self.configureCalendar();

    self.type = self.state.appointments?.length > 0 ? 'category' : 'day';

    self.setHeight();

    self.place = self.selectedSpace;
    if (self.place) {
      self.newVisit();
    }

    self.validateEntities();
    self.checkCachedVisits();
    console.log(success('mounted calendarCard'));
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
