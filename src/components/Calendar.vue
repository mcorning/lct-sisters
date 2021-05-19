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
                <v-list-item @click="changeType('category')">
                  <v-list-item-title>Appointments</v-list-item-title>
                </v-list-item>
                <v-list-item @click="changeType('day')">
                  <v-list-item-title>Day</v-list-item-title>
                </v-list-item>
                <v-list-item @click="changeType('4day')">
                  <v-list-item-title>4 days</v-list-item-title>
                </v-list-item>
                <v-list-item @click="changeType('week')">
                  <v-list-item-title>Week</v-list-item-title>
                </v-list-item>
                <v-list-item @click="changeType('month')">
                  <v-list-item-title>Month</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-toolbar>
        </v-sheet>

        <!-- calendar -->

        <!-- touch on phone is too sensitive
             @touchstart:time="startTime"
             @touchmove:time="mouseMove"
             @touchend:time="endDrag"
             
             taken from extendBottom event:
             @touchstart.stop="extendBottom(event)"
 -->
        <v-sheet :height="calendarHeight">
          <v-calendar
            id="calendar-target"
            ref="calendar"
            v-model="focus"
            color="primary"
            event-overlap-mode="column"
            :type="type"
            :categories="categories"
            :events="visits"
            :event-ripple="false"
            :event-color="getEventColor"
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

          <!-- Event Menu -->
          <v-menu
            v-model="selectedOpen"
            :close-on-content-click="false"
            :activator="selectedElement"
            offset-x
            offset-y
          >
            <v-card
              v-if="parsedEvent"
              color="grey lighten-4"
              max-width="400px"
              flat
            >
              <v-toolbar :color="getToolbarColor()" dark>
                <v-toolbar-title
                  v-html="parsedEvent.input.name"
                ></v-toolbar-title>
              </v-toolbar>
              <v-row justify="space-around">
                <v-spacer></v-spacer>
                <v-col cols="4">
                  <v-dialog
                    ref="dialogStart"
                    v-model="modalStart"
                    :return-value.sync="starttime"
                    persistent
                    width="290px"
                  >
                    <template v-slot:activator="{ on, attrs }">
                      <v-text-field
                        v-model="starttime"
                        :disabled="!parsedEvent"
                        label="Start"
                        prepend-icon="mdi-clock-time-four-outline"
                        readonly
                        hide-details
                        v-bind="attrs"
                        v-on="on"
                      ></v-text-field>
                    </template>
                    <v-time-picker
                      v-if="modalStart"
                      v-model="starttime"
                      full-width
                      :allowed-minutes="allowedStep"
                    >
                      <v-spacer></v-spacer>
                      <v-btn text color="primary" @click="modalStart = false">
                        Cancel
                      </v-btn>
                      <v-btn
                        text
                        color="primary"
                        @click="$refs.dialogStart.save(starttime)"
                      >
                        OK
                      </v-btn>
                    </v-time-picker>
                  </v-dialog>
                </v-col>
                <v-spacer></v-spacer>

                <v-col cols="4">
                  <v-dialog
                    ref="dialogEnd"
                    v-model="modalEnd"
                    :return-value.sync="endtime"
                    persistent
                    width="290px"
                  >
                    <template v-slot:activator="{ on, attrs }">
                      <v-text-field
                        v-model="endtime"
                        :disabled="!parsedEvent"
                        label="End"
                        prepend-icon="mdi-clock-time-four-outline"
                        readonly
                        hide-details
                        v-bind="attrs"
                        v-on="on"
                      ></v-text-field>
                    </template>
                    <v-time-picker
                      v-if="modalEnd"
                      v-model="endtime"
                      full-width
                      :allowed-minutes="allowedStep"
                    >
                      <v-spacer></v-spacer>

                      <v-btn text color="primary" @click="modalEnd = false">
                        Cancel
                      </v-btn>
                      <v-btn
                        text
                        color="primary"
                        @click="$refs.dialogEnd.save(endtime)"
                      >
                        OK
                      </v-btn>
                    </v-time-picker>
                  </v-dialog>
                </v-col>
                <v-spacer></v-spacer>
              </v-row>
              <v-row justify="space-around">
                <v-col cols="9">
                  <v-row align="center" justify="space-around">
                    <v-col class="text-center">Modify Event</v-col>
                  </v-row>
                  <v-row dense>
                    <v-col>Move</v-col>
                    <v-col>
                      <v-btn outlined icon>
                        <v-icon>mdi-arrow-up</v-icon>
                      </v-btn>
                    </v-col>
                    <v-col>
                      <v-btn outlined icon>
                        <v-icon>mdi-arrow-down</v-icon>
                      </v-btn>
                    </v-col>
                  </v-row>
                  <v-row dense>
                    <v-col>Expand</v-col>
                    <v-col>
                      <v-btn outlined icon>
                        <v-icon>mdi-arrow-expand-up</v-icon>
                      </v-btn>
                    </v-col>
                    <v-col>
                      <v-btn outlined icon>
                        <v-icon>mdi-arrow-expand-vertical</v-icon>
                      </v-btn>
                    </v-col>
                    <v-col>
                      <v-btn outlined icon>
                        <v-icon>mdi-arrow-expand-down</v-icon>
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-col>
              </v-row>
              <v-card-text v-html="getGraphNameFromVisit"> </v-card-text>
              <v-card-actions>
                <v-tooltip bottom>
                  <template v-slot:activator="{ on, attrs }">
                    <div class="text-center">
                      <v-btn
                        v-bind="attrs"
                        v-on="on"
                        :disabled="!parsedEvent"
                        @click="goRight()"
                        ><v-icon>mdi-delete</v-icon></v-btn
                      ><br />
                      <small>Delete</small>
                    </div>
                  </template>
                  <span>Delete Visit</span></v-tooltip
                >

                <!-- btn click sets calls revert() -->
                <v-tooltip bottom>
                  <template v-slot:activator="{ on, attrs }">
                    <div class="text-center">
                      <v-btn
                        v-bind="attrs"
                        v-on="on"
                        :disabled="!parsedEvent"
                        @click="revert()"
                        ><v-icon>mdi-cancel</v-icon></v-btn
                      ><br />
                      <small>Cancel</small>
                    </div>
                  </template>
                  <span>Abandon changes</span></v-tooltip
                >
                <!-- btn click calls saveVisit() -->
                <v-tooltip bottom>
                  <template v-slot:activator="{ on, attrs }">
                    <div class="text-center">
                      <v-btn
                        v-bind="attrs"
                        v-on="on"
                        :disabled="!parsedEvent"
                        outlined
                        color="secondary"
                        @click="saveVisit()"
                        ><v-icon>mdi-content-save</v-icon></v-btn
                      ><br />
                      <small>Save</small>
                    </div>
                  </template>
                  <span>Save Visit locally</span></v-tooltip
                >

                <v-spacer></v-spacer>
                <v-tooltip bottom>
                  <template v-slot:activator="{ on, attrs }">
                    <div class="text-center">
                      <v-btn
                        v-bind="attrs"
                        v-on="on"
                        :disabled="!userID"
                        @click="goLeft()"
                        ><v-icon>mdi-graphql</v-icon></v-btn
                      ><br />
                      <small>{{ userID ? 'Log' : 'Not online' }}</small>
                    </div>
                  </template>
                  <span>Log Visit on Server</span></v-tooltip
                >
              </v-card-actions>
            </v-card>
          </v-menu>
          <!-- End Event Menu -->
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
  </v-sheet>
</template>

<script>
import crypto from 'crypto';
const randomId = () => crypto.randomBytes(8).toString('hex');

import Visit from '@/models/Visit';

import { getNow, DateTime, formatSmallTime } from '../utils/luxonHelpers';
import { error, success, warn, highlight, printJson } from '../utils/colors';

export default {
  name: 'Calendar',

  props: {
    selectedSpace: Object,
    avgStay: Number,
    userID: String,
    graphName: String, // changes to graph come from App.js
  },

  components: {
    ConfirmModernDialog: () => import('./cards/dialogCardModern'),
  },

  computed: {
    stay() {
      const openAt = localStorage.getItem('openAt')?.split(':')[0];
      const closeAt = localStorage.getItem('closeAt')?.split(':')[0];
      const shift = (closeAt - openAt) * 3600000;

      return shift || this.avgStay;
    },

    ConfirmModernDialog() {
      return this.$refs.ConfirmModernDialog;
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
    getGraphNameFromVisit() {
      const status = this.parsedEvent.input.graphName
        ? `is logged on <strong>${this.parsedEvent.input.graphName}</strong>`
        : `is <strong>not logged</strong> to any graph yet. ${
            !this.visitorIsOnline
              ? 'You are <strong>not</strong> online right now.'
              : 'During or after your visit, log the visit to the graph'
          }`;
      return `Visit <strong>${this.parsedEvent.input.id}</strong> ${status}`;
    },

    updateFeedbackMessage() {
      return `Ready to revert your last edit to its original value? ${this.getInterval(
        this.original.start,
        this.original.end
      )}?`;
    },

    visitCache() {
      const activeVisits = Visit.getVisits(true, this.expiredTimestamp);
      console.groupCollapsed('Active visits:');
      console.log(printJson(activeVisits));
      console.log('Your visits', this.getYourEvents(activeVisits));
      console.groupEnd();
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
  },

  data: () => ({
    shift: 0,
    ageOfExpiredEvents: 14,
    expiredTimestamp: null,
    categories: ['You', 'Them'],
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
      ],
    },
    action: '', // used by handlekeydown
    calendarEvent: null,
    parsedEvent: null,
    ready: false,
    selectedOpen: false,
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
    categtories: ['You', 'Them'],
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
    getYourEvents(activeVisits) {
      const filter = (visit) => visit.category === 'You';
      let x = activeVisits.filter(filter);
      return x;
    },

    getGraphName() {
      return this.graphName || this.$defaultGraphName;
    },

    toggleCategories() {
      this.type = this.type === 'day' ? 'category' : 'day';
      this.status = this.type;
    },
    onEditedEvent() {
      alert('edited event');
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

    // called when you click the interval on the left side of the calendar
    // not sure what to do with this, but it's cool.
    showInterval(interval) {
      console.log('showInterval:', printJson(interval));
    },

    // @click:event="showEvent"
    // showEvent will open the Event menu so phone users can reliably change start/end times.
    // value is an instance of the Visit object which is an event that constitutes the calendar's events array
    showEvent({ nativeEvent, event }) {
      const { id } = event;

      // get access to the event's index and CalendarTimestamp data
      this.parsedEvent = this.getCurrentEvent(id);
      if (!this.parsedEvent) {
        this.status = `You cannot edit a past event. We delete events older than ${this.ageOfExpiredEvents} days.`;
        return;
      }

      console.log(warn(printJson(this.parsedEvent)));

      this.starttime = this.parsedEvent.start.time;
      this.endtime = this.parsedEvent.end.time;

      //selectedElement is the activator for the Event Menu
      this.selectedElement = nativeEvent.target;
      // open the edit menu
      // we will adjust the start/end times in realtime
      // if user cancels, we refresh the visits from the cache by calling revert()
      // otherwise we update the cache with the new values by calling saveVisit()
      this.selectedOpen = true;
      this.action = 'SAVE'; // Save is the default action
      // this.status = `Select Save (to ${this.getGraphNameString}) or Cancel from dialog`;
    },

    //#region  Drag and Drop

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
        this.addEvent(mouse);
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
          this.dragEvent.interval = this.getInterval(
            this.dragEvent.start,
            this.dragEvent.end
          );
        }
      }
      // change the (start and) end time on the lower edge of the event
      else if (this.createEvent && this.createStart !== null) {
        console.log(highlight(`changing the slot's end time`));

        const mouseRounded = this.roundTime(mouse, false);
        const min = Math.min(mouseRounded, this.createStart);
        const max = Math.max(mouseRounded, this.createStart);

        this.createEvent.start = min;
        this.createEvent.end = max;
        this.createEvent.interval = this.getInterval(
          this.createEvent.start,
          this.createEvent.end
        );
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

    act(action) {
      switch (action) {
        case 'DELETE':
          this.deleteVisit();
          break;
        case 'LOG':
          this.logVisit();
          break;
        case 'REVERT':
          this.revert();
          break;
        case 'SAVE':
          this.saveVisit();
          break;
        // case 'UPDATE':
        //   this.updateLoggedVisit();
        //   break;
        default:
          this.status = `Cannot handle ${action} action`;
          this.$emit('error', this.status);
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

    // TODO use parsedEvent instead
    getInterval(start, end) {
      return `${formatSmallTime(start)} - ${formatSmallTime(end)}`;
    },

    addEvent(time) {
      const graphname = this.getGraphName();
      this.createStart = this.roundTime(time);
      const endTime = this.createStart + this.stay;

      const name = this.place.name;
      console.log(
        `Adding an event. Start: ${
          this.createStart
        }  End: ${endTime}  ET: ${endTime - this.createStart}`
      );
      this.createEvent = {
        id: randomId(),
        name: name,
        start: this.createStart,
        end: endTime,
        date: new Date(this.createStart).toDateString(),
        interval: this.getInterval(this.createStart, endTime),
        timed: true,
        marked: getNow(),
        graphName: graphname,
        color: this.isDefaultGraph ? 'secondary' : 'sandboxmarked',
        logged: '', // this will contain the internal id of the relationship in redisGraph
      };

      let newVisit = { ...this.createEvent };
      const lat =
        typeof this.place.lat === 'function'
          ? this.place.lat()
          : this.place.lat;
      const lng =
        typeof this.place.lng === 'function'
          ? this.place.lng()
          : this.place.lng;
      newVisit.lat = lat;
      newVisit.lng = lng;

      // TODO put back Visit
      Visit.updatePromise(newVisit)
        .then((p) => {
          console.log('Added visit to cache', printJson(p));
        })
        .catch((e) => {
          console.log(error(e));
          this.status = `Oops. We had trouble adding a visit on your calendar. Notified devs. I'm sorry.`;

          this.$emit('error', e);
        });

      this.place = null;
    },

    addOpeningsForToday() {
      const people = localStorage.getItem('people').split(',');
      const openAt = localStorage.getItem('openAt').split(':');
      const closeAt = localStorage.getItem('closeAt').split(':');
      const slotInterval = localStorage.getItem('slotInterval');
      const defaultName = 'Opening';

      let hrs = closeAt[0] - openAt[0];
      let hr = openAt[0] / 1;
      let parsedDate;
      // caveat emptor: assuming 30 minute intervals, so two openings per hour
      while (hrs--) {
        parsedDate = DateTime.fromObject({
          hour: hr,
          minute: 0,
        });
        people.forEach((person) => {
          this.addOpening(
            parsedDate,
            person || defaultName,
            slotInterval * 60000
          );
        });

        parsedDate = DateTime.fromObject({
          hour: hr,
          minute: slotInterval,
        });
        people.forEach((person) => {
          this.addOpening(
            parsedDate,
            person || defaultName,
            slotInterval * 60000
          );
        });
        hr += 1;
      }
      this.scrollToTime();

      this.status = 'Use the calendar to adjust openings for the day';
    },

    addOpening(time, name, slotInterval) {
      const graphname = this.getGraphName();

      this.createStart = this.roundTime(time);
      this.createEvent = {
        id: randomId(),
        name: name,
        start: this.createStart,
        end: this.createStart + slotInterval,
        date: new Date(this.createStart).toDateString(),
        interval: this.getInterval(
          this.createStart,
          this.createStart + slotInterval
        ),
        timed: true,
        marked: getNow(),
        graphName: graphname,
        color: this.isDefaultGraph ? 'secondary' : 'sandboxmarked',
        logged: '', // this will contain the internal id of the relationship in redisGraph
        category: 'Them',
      };

      let newVisit = { ...this.createEvent };

      // TODO put back Visit
      Visit.updatePromise(newVisit)
        .then((p) => {
          console.log('Added visit to cache', printJson(p));
        })
        .catch((e) => {
          console.log(error(e));
          this.status = `Oops. We had trouble adding a visit on your calendar. Notified devs. I'm sorry.`;

          this.$emit('error', e);
        });
    },

    deleteVisit() {
      const visit = this.getCurrentVisit();
      const id = visit.id;
      const self = this;

      // TODO put back Visit
      Visit.deletePromise(id)
        .then(() => {
          self.confirm = false;
          let visits = self.visits;
          self.visits = self.arrayRemove(visits, id);

          console.log(success(`Visit ${id} deleted.`));
          self.status = `DELETED local data: ${visit.name} ${visit.interval} id: ${visit.id}`;
          console.log(`New Visit ct: ${self.visits.length} `);
          if (!visit.loggedNodeId) {
            return;
          }
          self.$emit('deleteVisit', visit);
        })
        .catch((e) => {
          this.status =
            'Oops. We had trouble logging to server. Notified devs. Sorry.';
          this.$emit('error', e);
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
      } catch (error) {
        this.status =
          'Oops. We had trouble logging to server. Devs notified. Sorry.';
        this.$emit('error', error);
      }
    },

    // visit has new start/end values set by Event edit menu
    saveVisit() {
      this.selectedOpen = false;
      const visit = this.getCurrentVisit();
      Visit.updatePromise(visit)
        .then(() => {
          console.log(success(`New/Saved Visit:`, printJson(visit)));
          // const destination = this.visitorIsOnline
          //   ? `on the ${this.getGraphName()} exposure graph`
          //   : `in localStorage`;
          // this.status = `SAVED: ${visit.name} ${visit.interval} id: ${visit.id} ${destination}`;
        })
        .catch((err) => alert(err));
    },

    changeType(type) {
      this.type = type;
      this.scrollToTime();
    },

    viewDay({ date }) {
      this.focus = date;
      this.type = 'day';
    },

    getEventPrimaryColor(event) {
      return event ? 'primary' : 'secondary';
    },

    getToolbarColor() {
      return this.parsedEvent.color === 'primary'
        ? 'primary lighten-2'
        : 'secondary darken-2';
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

    newEvent() {
      const time = this.place.startTime || Date.now();

      this.addEvent(time);
      this.endDrag();
    },

    getCurrentTime() {
      return this.cal
        ? this.cal.times.now.hour * 60 + this.cal.times.now.minute
        : 0;
    },

    // id is passed in with showEvent.
    // otherwise we refer to the current parsedEvent.input.id value
    getCurrentEvent(id = this.parsedEvent.input.id) {
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
      this.status = `scrolled to time at ${first}`;
    },

    updateTime() {
      setInterval(() => this.cal.updateTimes(), 60 * 1000);
    },

    calendarTimestampToDate(cts) {
      const parsedDate = DateTime.fromObject({
        month: cts.month,
        day: cts.day,
        hour: cts.hour,
        minute: cts.minute,
      });
      return parsedDate;
    },

    handleChange(event) {
      // this represents the start and end days on the calendar
      // we see it during mounting (where we call checkChange()) as one day
      // but change the calendar type, and you will see different start.date and end.date values
      console.log(highlight(this.type, printJson(event)));
      if (this.type === 'category') {
        const openings = this.cal
          .getVisibleEvents()
          .some((v) => v.category === 'Them');
        if (!openings) {
          this.addOpeningsForToday();
        }
        this.scrollToTime();
      }
    },

    padTime(number) {
      return number < 10 ? '0' + number : number + '';
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
  },

  watch: {
    // example of a nested watcher:
    // 'createEvent.start': function (newValue, oldValue) {
    //   console.log('createEvent.start n/o:', newValue, oldValue);
    // },
    // 'dragEvent.start': function (newValue, oldValue) {
    //   console.log('dragEvent.start n/o:', newValue, oldValue);
    // },
    type() {
      if (this.type === 'category') {
        this.status = 'Appointment handling is under development.';
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
      this.visits = newVal;
    },

    starttime(newVal, oldVal) {
      if (!oldVal) {
        return;
      }
      const event = this.parsedEvent;
      const visit = this.getCurrentVisit();
      console.log(warn('editing id', event.input.id));
      console.log(warn('Orig end', visit.start, visit.interval));

      event.start.hour = newVal.slice(0, 2) / 1;
      event.start.minute = newVal.slice(3, 5) / 1;

      const startDate = this.calendarTimestampToDate(event.start);
      visit.start = startDate.ts;
      visit.interval = `${this.padTime(event.start.hour)}:${this.padTime(
        event.start.minute
      )}-${this.padTime(event.end.hour)}:${this.padTime(event.end.minute)} `;
      console.log(warn('New start:', visit.start, visit.interval));
    },

    endtime(newVal, oldVal) {
      if (!oldVal) {
        return;
      }
      const event = this.parsedEvent;
      const visit = this.getCurrentVisit();
      console.log(warn('editing id', event.input.id));
      console.log(warn('Orig end', visit.end, visit.interval));

      event.end.hour = newVal.slice(0, 2) / 1;
      event.end.minute = newVal.slice(3, 5) / 1;

      const endDate = this.calendarTimestampToDate(event.end);

      visit.end = endDate.ts;
      visit.interval = `${this.padTime(event.start.hour)}:${this.padTime(
        event.start.minute
      )}-${this.padTime(event.end.hour)}:${this.padTime(event.end.minute)} `;

      console.log(warn('New end', visit.end, visit.interval));
    },
  },

  created() {},

  mounted() {
    this.ready = true;
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
    Visit.$fetch().then(() => {
      const expiredVisits = Visit.getVisits(false, self.expiredTimestamp);
      console.log('Expired visits:', printJson(expiredVisits));
      expiredVisits.forEach((visit) => {
        if (visit.loggedNodeId) {
          self.$emit('deleteVisit', visit);
        }
        Visit.delete(visit.id);
      });

      self.visits = self.visitCache;
    });

    self.cal.checkChange();
    self.scrollToTime();
    self.updateTime();

    // selectedSpace set in App.onAddedPlace()
    self.place = self.selectedSpace;
    if (self.place) {
      self.newEvent();
    }

    document.addEventListener('keydown', this.handleKeydown);
    console.log('Using ' + self.getGraphNameString);
    self.status = 'Using ' + self.getGraphNameString;

    self.type =
      localStorage.getItem('usesPublicCalendar') !== 'true'
        ? 'day'
        : 'category';

    console.log('mounted calendarCard');
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
