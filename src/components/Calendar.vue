<template>
  <v-sheet class="overflow-hidden fill-height" :height="sheetHeight">
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
            @mouseleave.native="cancelDrag"
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

                <v-spacer></v-spacer>

                <!-- btn click calls saveVisit() -->
                <v-tooltip bottom>
                  <template v-slot:activator="{ on, attrs }">
                    <div class="text-center">
                      <v-btn
                        v-bind="attrs"
                        v-on="on"
                        :disabled="!parsedEvent"
                        @click="saveVisit()"
                        ><v-icon>mdi-content-save</v-icon></v-btn
                      ><br />
                      <small>Save</small>
                    </div>
                  </template>
                  <span>Save Visit locally</span></v-tooltip
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

// TODO put back Visit
import Visit from '@/models/Visit';

import {
  getNow,
  DateTime,
  formatTime,
  formatSmallTime,
} from '../utils/luxonHelpers';
import { error, success, warn, highlight, printJson } from '../utils/colors';

export default {
  name: 'Calendar',

  props: {
    selectedSpace: Object,
    avgStay: Number,
    userID: String,
    graphName: String,
  },

  components: {
    ConfirmModernDialog: () => import('./cards/dialogCardModern'),
  },

  computed: {
    cal() {
      return this.ready ? this.$refs.calendar : null;
    },

    nowY() {
      return this.cal ? this.cal.timeToY(this.cal.times.now) + 'px' : '-10px';
    },

    getGraphName() {
      return `the ${this.graphName} exposure graph`;
    },
    getGraphNameFromVisit() {
      const status = this.parsedEvent.input.graphName
        ? `is logged on <strong>${this.parsedEvent.input.graphName}</strong>`
        : `is <strong>not logged</strong> to any graph yet`;
      return `Visit <strong>${this.parsedEvent.input.id}</strong> ${status}`;
    },

    updateFeedbackMessage() {
      return `Ready to revert your last edit to its original value? ${this.getInterval(
        this.original.start,
        this.original.end
      )}?`;
    },

    // TODO put back Visit
    visitCache() {
      return Visit.all();
    },
    visibleEvents() {
      return this.cal.getVisibleEvents();
    },
    visitorIsOnline() {
      return this.userID;
    },
  },

  data: () => ({
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
    ConfirmModernDialog: null,
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

    action: '',
    confirm: false,
    visits: [],
    place: null,
    type: 'day',
    snackBar: false,
    snackBarNew: false,
    feedbackMessage: '',
    focus: '',
    typeToLabel: {
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
      this.status = `Select Save (to ${this.getGraphName}) or Cancel from dialog`;
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

      this.status = 'Changing time slot';

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
    },

    // e.g., leaving event movement (e.g., to respond to confirmation dialog)
    // TODO Revaluate with current revert()
    cancelDrag() {
      if (this.createEvent) {
        if (this.extendOriginal) {
          this.createEvent.end = this.extendOriginal;
        } else {
          this.removeVisit(this.createEvent);
        }
      }

      this.reset();
    },
    // TODO Revaluate with current revert()
    removeVisit(event) {
      const i = this.visits.indexOf(event);
      if (i !== -1) {
        this.visits.splice(i, 1);
      }
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

      this.confirmModernDialog
        .open(question, consequences, {
          icon: icon,
        })
        .then((act) => {
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

      this.status = visit.logged
        ? `Updating a previously logged ${visit.name} visit on the server.`
        : 'Logging visit on the server...';

      const question =
        visit.interval !== cachedVisit.interval
          ? `You changed ${visit.name} from ${cachedVisit.interval}. Save and continue to log?`
          : `Are you sure you want to LOG ${visit.name} from ${formatTime(
              visit.start
            )} to ${formatTime(visit.end)} `;
      const consequences =
        'This change will impact how exposure alerts works with this visit.';
      const icon = 'mdi-alert-outline';

      this.customOptions.buttons[0] = null;
      this.customOptions.buttons[2].label = 'Yes';

      this.confirmModernDialog
        .open(question, consequences, {
          icon: icon,
        })
        .then((act) => {
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

    // TODO Test this before using it (duh)
    purge() {
      // TODO put back Visit
      Visit.delete((visit) => {
        return visit.start < 1617815700000;
      });
    },

    addEvent(time) {
      this.createStart = this.roundTime(time);
      this.createEvent = {
        id: randomId(),
        name: this.place.name,
        start: this.createStart,
        end: this.createStart + this.avgStay,
        interval: this.getInterval(
          this.createStart,
          this.createStart + this.avgStay
        ),
        timed: true,
        marked: getNow(),
        color: 'secondary',
        logged: '', // this will contain the internal id of the relationship in redisGraph
      };

      let newVisit = { ...this.createEvent };
      newVisit.lat = this.place.lat;
      newVisit.lng = this.place.lng;

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

    deleteVisit() {
      this.confirm = false;
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
          self.status = `DELETED: ${visit.name} ${visit.interval} id: ${visit.id}`;
          console.log(`New Visit ct: ${self.visits.length} `);

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
        this.confirm = false;
        this.status = 'Logged to server. Stay safe out there.';
      } catch (error) {
        this.status =
          'Oops. We had trouble logging to server. Devs notified. Sorry.';
        this.$emit('error', error);
      }
    },

    // confirmUpdate(visit) {
    //   console.assert(error('wrong visit'), (visit = this.getCurrentVisit()));

    //   this.feedbackMessage = `UPDATE a logged visit to ${visit.name} with new times?`;
    //   this.confirmModernDialog.open('Confirm', this.feedbackMessage).then((act) => {
    //     if (act) this.act('UPDATE');
    //   });
    // },

    // updateLoggedVisit() {
    //   try {
    //     // visit was updated in endDrag() and called from there
    //     let visit = this.getCurrentVisit();

    //     console.log(
    //       success('CalendarCard.js: Updating logged visit:', printJson(visit))
    //     );
    //     // we need to tell the graph how to identify the visit that now has new start/end values
    //     // either send back the original visit node ID or the old interval
    //     this.saveVisit(visit);
    //     this.$emit('updateLoggedVisit', visit);
    //     this.confirm = false;
    //     this.status = 'Updated server. Stay safe out there.';
    //   } catch (error) {
    //     this.status =
    //       'Oops. We had trouble updating server. Devs notified. Sorry.';
    //     this.$emit('error', error);
    //   }
    // },

    cancel() {
      this.confirm = false;
      this.reset();
    },

    // visit has new start/end values set by Event edit menu
    saveVisit() {
      this.selectedOpen = false;
      this.confirm = false;
      const visit = this.getCurrentVisit();
      Visit.updatePromise(visit)
        .then(() => {
          console.log(success(`New/Saved Visit:`, printJson(visit)));
          const destination = this.visitorIsOnline
            ? `on the ${this.graphName ||
                this.$defaultGraphName} exposure graph`
            : `in localStorage`;
          this.status = `SAVED: ${visit.name} ${visit.interval} id: ${visit.id} ${destination}`;
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
      this.addEvent(Date.now());
      this.endDrag();
    },

    // handleKeydown(ev) {
    //   console.log(highlight('key/action'), ev.code, this.action);
    //   switch (ev.code) {
    //     case 'Delete':
    //       this.goRight(); // calls confirmation with the Del key
    //       break;
    //     case 'Tab':
    //       this.goLeft(); // calls confirmation with the Tab key
    //       break;

    //     case 'KeyY':
    //     case 'Enter':
    //       if (!this.action) {
    //         alert('handleKeydown cannot access this.action');
    //         return;
    //       }

    //       switch (this.action) {
    //         case 'DELETE':
    //           this.deleteVisit();
    //           break;

    //         case 'LOG':
    //           this.logVisit();
    //           break;

    //         // case 'UPDATE':
    //         //   this.updateLoggedVisit();
    //         //   break;

    //         case 'REVERT':
    //           this.revert();
    //           break;
    //       }
    //       break;

    //     case 'KeyN':
    //     case 'Escape':
    //       this.cancel(); // calls confirmation with the Escape key
    //       break;
    //   }
    // },

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

    scrollToTime() {
      const time = this.getCurrentTime();
      const first = Math.max(0, time - (time % 30) - 100);
      this.cal.scrollToTime(first);
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
      console.log(highlight(printJson(event)));
    },

    padTime(number) {
      return number < 10 ? '0' + number : number + '';
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

    graphName(newVal, oldVal) {
      console.log('Graph name is', newVal, 'and was', oldVal);
      this.status = `You are ${
        this.graphName === this.$defaultGraphName
          ? 'using'
          : 'experimenting with'
      }  ${this.getGraphName}`;
    },

    visitCache(newVal) {
      this.visits = newVal;
      // this was the first place after mounted() that could see this.$refs
      this.confirmModernDialog = this.$refs.ConfirmModernDialog;
      // this.confirmModernDialog
      //   .open(
      //     'Do you want to save the changes you made to the Visit?',
      //     `Your changes will be lost if you don't save them to  ${this.$defaultGraphName}.`,
      //     { icon: 'mdi-help-circle-outline' }
      //   )
      //   .then((act) => {
      //     console.log(act);
      //     switch (act) {
      //       case 1:
      //         alert('Consider it done');
      //         break;
      //       case 0:
      //         alert('Did nothing');
      //         break;
      //       default:
      //         alert('try again');
      //     }
      //   });
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

    // TODO put back Visit
    Visit.$fetch().then(() => {
      self.visits = self.visitCache;
    });

    self.cal.checkChange();
    self.scrollToTime();
    self.updateTime();

    self.place = self.selectedSpace;
    if (self.place) {
      self.newEvent();
    }

    // these are window event listeners
    // so we need to restrict them to the calendarCard
    // TODO Rebuild with key modifiers
    // this.calendarElement.addEventListener('keydown', this.handleKeydown);
    console.log('Using ' + self.getGraphName);
    self.status = 'Using ' + self.getGraphName;

    console.log('mounted calendarCard');
  },

  destroyed() {
    this.calendarElement.removeEventListener('keydown', this.handleKeydown);
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
