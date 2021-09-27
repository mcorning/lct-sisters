<template>
  <v-container fluid id="calendarDiv" class="Calendar fill-height" width="100%">
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
      <v-tooltip left>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            fab
            text
            small
            color="grey darken-2"
            v-bind="attrs"
            v-on="on"
            @click="changeGraph"
          >
            <v-icon> mdi-graphql </v-icon>
          </v-btn>
        </template>
        <span
          >During acceptance testing default graph is fixed:
          {{ getGraphName() }}</span
        >
      </v-tooltip>
    </v-toolbar>

    <!-- <v-sheet :height="calendarHeight"> -->
    <v-sheet class="Calendar" :class="{ CalendarWithStatus: showStatus }">
      <v-calendar
        id="calendar-target"
        ref="calendar"
        v-model="focus"
        :events="relevantEvents"
        color="primary"
        :type="type"
        :categories="categories"
        :event-color="getEventColor"
        :now="currentDate"
        :first-time="firstTime"
        :interval-minutes="intervalMinutes"
        :interval-count="intervalCount"
        @click:more="viewDay"
        @click:date="viewDay"
        @click:event="showEvent"
        @change="onChange"
      >
        <template v-slot:event="{ timed, eventSummary }">
          <div class="v-event-draggable" v-html="eventSummary()"></div>
          <div v-if="timed" class="v-event-drag-bottom"></div>
        </template>
        <template #day-body="{ date, week }">
          <div
            class="v-current-time"
            :class="{ first: date === week[0].date }"
            :style="{ top: nowY }"
          ></div>
        </template>
      </v-calendar>
    </v-sheet>

    <v-bottom-sheet v-model="seePickers" max-width="400">
      <v-sheet>
        <PickersMenu
          :selectedEventParsed="selectedEventParsed"
          :mailToUri="mailToUri"
          :isConnected="isConnected"
          @newDateTime="onNewDateTime"
          @noDateTime="seePickers = false"
          @logEvent="onLogEvent"
          @share="openBanner"
          @deleteEvent="onDeleteEvent"
        />
        <v-banner v-model="banner">
          <v-row no-gutters>
            <v-col cols="12">
              <v-text-field
                v-model="alias"
                :rules="[rules.required, rules.email]"
                clearable
                label="To enable Email button, enter an email address"
                hint="Email a person directly or send to yourself and forward"
              ></v-text-field>

              <v-text-field
                v-model="toName"
                dense
                clearable
                hint="Name used at the end of your invitation "
                label="Your name:"
              ></v-text-field>
              <v-text-field
                v-model="room"
                dense
                clearable
                :label="gatheringLabel"
                :hint="gatheringHint"
              ></v-text-field> </v-col
          ></v-row>
          <v-divider></v-divider>
          <v-row no-gutters>
            <v-btn color="red" text @click="banner = false">Dismiss </v-btn>
            <v-spacer />
            <v-btn
              color="green"
              v-show="alias"
              text
              input-value
              @click="emailEvent"
            >
              Email
            </v-btn>
          </v-row>
          <v-row
            ><v-col>
              <VueQRCodeComponent
                id="qr"
                ref="qr"
                :text="mailToUri"
                :size="150"
              >
              </VueQRCodeComponent></v-col
            ><v-col>
              <div class="ml-4">
                <p>Scan QR with phone or copy/paste to email or printer.</p>

                <p>
                  Hover over the QR code, and you can copy the event's URL, as
                  well.
                </p>
              </div></v-col
            ></v-row
          >
        </v-banner>
      </v-sheet>
    </v-bottom-sheet>

    <v-snackbar v-model="snackbar" :color="confirmationColor" timeout="4000"
      >{{ confirmationMessage }}
      <template v-slot:action="{ attrs }">
        <v-btn color="black" text v-bind="attrs" @click="snackbar = false">
          Thanks
        </v-btn>
      </template>
    </v-snackbar>

    <v-snackbar
      v-model="snackbarPrompt"
      centered
      vertical
      height="100px"
      color="primary"
    >
      {{ prompt }}
      <template v-slot:action="{ attrs }">
        <v-btn text v-bind="attrs" @click.stop="updateSharedVisit">
          <v-icon>check</v-icon>
        </v-btn>
        <v-btn icon class="ml-4" @click="snackbarPrompt = false">
          <v-icon>close</v-icon>
        </v-btn>
      </template>
    </v-snackbar>
    <status-card
      v-if="showStatus"
      :status="status"
      :toggleStatus="toggleStatus"
      :copyStatus="copyStatus"
      :cutStatus="cutStatus"
    ></status-card>
  </v-container>
</template>

<script>
import VueQRCodeComponent from 'vue-qr-generator';

import PickersMenu from '@/components/menus/pickersMenu.vue';
import { DateTime, inFuture, makeTimes, userSince } from '@/utils/luxonHelpers';
import { head } from 'pratica';
import StatusCard from './cards/statusCard.vue';
// import { printJson } from '@/utils/helpers';

export default {
  name: 'Calendar',
  // Step 4/4: expose Model's functions and props to component
  props: {
    selectedSpace: Object,
    isDefaultGraph: Boolean,
    state: Object,
    onUpdate: Function,
    changeGraphName: Function,
    setDefaultGraphName: Function,
    getGraphName: Function,
    confirmations: Object,
    usernumber: Number,
    getVisits: Function,
    isConnected: Boolean,
  },
  components: {
    PickersMenu,
    VueQRCodeComponent,
    StatusCard,
  },
  computed: {
    gatheringLabel() {
      return this.selectedEvent && this.selectedEvent.name === 'Gathering'
        ? 'Description '
        : 'Room ';
    },
    gatheringHint() {
      // TODO this and label above need Maybe treatment
      return this.selectedEvent && this.selectedEvent.name === 'Gathering'
        ? 'Outdoor events may need a description'
        : 'Indoor events may need a room ID';
    },

    graphSelectLabel() {
      return `Exposure Graphs (${this.getGraphName()})`;
    },

    // TODO we shouldn't need this guard
    mailToUri() {
      if (!this.selectedEvent) {
        return;
      }
      const { place_id, name, date, start, end } = this.selectedEvent;
      const printedName = `${name}${this.room ? `:_${this.room}` : ''}`;
      const escapedName = printedName.replace(/ /g, '_').replace(/&/g, 'and'); // we will reverse this edit in space.js
      // do normal url encoding for the rest of the args
      const uri = encodeURIComponent(
        `place_id=${place_id}&date=${date}&start=${start}&end=${end}&name=${escapedName}`
      );
      return `${this.origin}/?${uri}`;
    },

    mailToString() {
      if (!this.alias) {
        return '';
      }
      const { place_id, name, date, start, end } = this.selectedEvent;
      const printedName = `${name}${this.room ? `:_${this.room}` : ''}`;

      return `mailto:${this.alias}?subject=Join me at ${printedName.replace(
        /&/g,
        'and'
      )} on ${date}&body=To add this event to your LCT app click this link (copy and paste the url into a messaging client like WhatsApp):${
        this.newLine
      } ${this.mailToUri}  ${
        this.newLine
      }     QR Code: copy the QR code in LCT and paste it here
            ${this.newLine}  ${
        this.newLine
      }      Name/Place-id: ${printedName}/${place_id} ${
        this.newLine
      }      Start time: ${new Date(start)}${
        this.newLine
      }      End time: ${new Date(end)}${this.newLine}${
        this.newLine
      }See you then...${this.newLine}${this.toName}`;
    },

    // selectedGraphIsDefault() {
    //   return this.selectedGraph === this.$defaultGraphName;
    // },
    // changingDefault() {
    //   const x = this.$defaultGraphName !== this.selectedGraph;
    //   return x;
    // },
    currentGraphName() {
      return this.state.currentGraphName;
    },

    // TODO NOTE: Classic ViewModel property here: Model provides primitive values
    // and relevantEvents transforms them for the UI as an array of two entities.
    // further refinement such as events in a date range would be handled as computed property or filter.
    relevantEvents() {
      // TODO should this property include all visits or only those for the selected day?
      try {
        const cutoffDateTime = DateTime.now()
          .minus({ days: 10 })
          .toMillis();
        // const x = [...this.state.visits, ...this.state.appointments];
        const x = this.getVisits().filter((v) => v.start > cutoffDateTime);
        return x;
      } catch (error) {
        return [];
      }
    },
    intervalCount() {
      return this.range * (60 / this.intervalMinutes) + 2;
    },
    eventDetails() {
      // TODO This is where you decide what and how to display event details
      const x = this.selectedEvent.details;
      return x;
    },
    nowY() {
      return this.cal ? this.cal.timeToY(this.cal.times.now) + 'px' : '-10px';
    },
  },
  data() {
    return {
      showStatus: true,
      qrText: '',
      clipboard: null,
      rules: {
        required: (value) => !!value || 'Required.',
        email: (value) => {
          const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
          return pattern.test(value) || 'Invalid e-mail.';
        },
      },
      seePickers: false,
      showQR: false,
      room: '',
      dev: false,
      origin: window.location.origin,
      banner: false,
      alias: null,
      toName: '',
      newLine: '%0a',
      updateTimeInterval: null,
      graphChanged: false,
      selectedGraph: '', //this.getGraphName(),
      graphs: [this.$defaultGraphName, 'Sandbox'],
      promptGraph: false,
      cal: null,
      value: '',

      ready: false,
      focus: '',
      type: 'day',

      calendarHeight: 730,
      typeToLabel: {
        category: 'Work',
        month: 'Month',
        week: 'Week',
        day: 'Day',
        '4day': '4 Days',
      },
      categories: ['You', 'Them'],
      currentDate: null,
      firstTime: '00:00',
      intervalMinutes: 30,
      range: 24,

      selectedElement: null,
      selectedEvent: {},
      selectedEventId: '',
      selectedEventParsed: null,
      selectedOpen: false,

      status: '',
      graphName: this.$defaultGraphName,

      snackbar: false,
      confirmationColor: 'success',
      confirmationMessage: '',

      snackbarPrompt: false,
      prompt: '',
    };
  },

  methods: {
    toggleStatus() {
      this.showStatus = !this.showStatus;
    },
    setStatus(msg) {
      this.status += `${msg}
      `;
    },
    copyStatus() {
      this.setStatus('Copied to clipboard', this.$clipboard(this.status)); // this.$clipboard copy any String/Array/Object you want
    },
    cutStatus() {
      this.$clipboard(this.status);
      this.status = 'Status cut to clipboard';
    },

    openBanner() {
      this.banner = true;
      this.qrText = document.getElementById('qr');
      // this.getClipboard();
    },
    // getClipboard() {
    //   var btn = document.getElementById('copyBtn');
    //   var clipboard = new ClipboardJS(btn, {
    //     text: function(trigger) {
    //       return trigger.getAttribute('aria-label');
    //     },
    //   });

    //   clipboard.on('success', function(e) {
    //     console.log(e);
    //   });

    //   clipboard.on('error', function(e) {
    //     console.log(e);
    //   });
    // },
    copy: (e) => {
      alert('You just copied: ' + e.text);
    },
    onError: function() {
      alert('Failed to copy texts');
    },
    onDeleteEvent() {
      if (!this.selectedEvent.loggedVisitId) {
        // if unlogged, just delete cache
        this.delete('cache');
      } else {
        // delete graph will also delete cache
        this.delete('graph');
      }

      this.seePickers = false;
    },

    // NaN Date error when:
    // Mark
    // Don’t log
    // Click
    // Log
    // Nothing happens
    // Click event
    // See error
    onLogEvent(newDateTimes) {
      const { pickedDate, pickedStartTime, pickedEndTime } = newDateTimes;
      this.setStatus(
        `onLogEvent(): pickedDate, pickedStartTime, pickedEndTime=`
      );
      this.setStatus(`${pickedDate}, ${pickedStartTime}, ${pickedEndTime}`);
      const times = makeTimes(pickedDate, pickedStartTime, pickedEndTime);
      const { startTime, endTime } = times;
      this.setStatus(
        `Updating graph with: [${pickedDate}], ${startTime}, ${endTime}`
      );

      this.seePickers = false;
      this.selectedEvent.date = pickedDate;
      this.selectedEvent.start = startTime;
      this.selectedEvent.end = endTime;
      this.update('graph');
    },
    onNewDateTime(newDateTimes) {
      const { date, start, end } = newDateTimes;
      this.seePickers = false;
      this.selectedEvent.date = date;
      this.selectedEvent.start = start;
      this.selectedEvent.end = end;
      this.update('cache');
    },
    emailEvent() {
      if (this.mailToString) {
        this.setStatus('setting window.location to:', this.mailToString);
        window.location = this.mailToString;
      } else {
        this.setStatus('No email address entered. No mail sent.');
      }
      this.banner = false;
      this.seePickers = false;
    },

    changeGraph() {
      // TODO reset changeGraph() before we ship
      //NOOP during acceptance testing
      //this.changeGraphName();
    },

    delete(target) {
      const deleteVisit = true;
      this.onUpdate(target, this.selectedEvent, deleteVisit);
      this.selectedOpen = false;
    },
    update(target) {
      this.onUpdate(target, this.selectedEvent);
      this.selectedOpen = false;
    },

    scrollToTime() {
      const time = this.getCurrentTime();
      const first = Math.max(0, time - (time % 30) - 30);
      this.cal.scrollToTime(first);
    },

    onChange() {
      this.cal = this.$refs.calendar;
      this.scrollToTime();
    },

    onStateAvailable() {
      console.log('onStateAvailable for all components');
    },
    configureCalendar() {
      // TODO Refactor if block to use grid under calendar for workers only
      if (this.isCategoryCalendar && this.isTakingAppointments) {
        this.tip =
          'You can add appointments by clicking a time interval for any selected day.';
        // this.openAt = this.settings.openAt;
        // this.closeAt = this.settings.closeAt;
        // const open = Number(this.openAt.slice(0, 2));
        // const close = Number(this.closeAt.slice(0, 2));
        this.range = 8; // close - open;

        // this.intervalMinutes = this.settings.slotInterval;
        // this.firstTime = `${String(
        //   Number(this.openAt.split(':')[0]) - 1
        // ).padStart(2, '0')}:${this.openAt.slice(3, 5)}`;
        this.setStatus(
          `. intervalMinutes: ${this.intervalMinutes}  first-time: ${this.firstTime}  range: ${this.range}  intervalCount: ${this.intervalCount} `
        );
      } else {
        this.tip = 'Stay safe out there...';
      }
    },
    //#region Calendar controls functions
    viewDay({ date }) {
      this.focus = date;
      console.log(`Going to ${date}`);
      this.setStatus(`Going to ${date}`);
      this.type = 'day';
      this.currentDate = date;
    },
    setToday() {
      this.focus = '';
      this.viewDay(Date.now());
      this.this.setStatus(`Going back to today`);
    },

    prev() {
      this.cal.prev();
    },
    next() {
      this.cal.next();
    },
    //#endregion Calendar controls functions

    //#region Calendar functions
    // called by event-color calendar event
    getEventColor(event) {
      const c =
        this.currentEventParsed?.input.id === event.id
          ? `${event.color} darken-1`
          : event.color;
      return c;
    },
    showEvent({ nativeEvent, event }) {
      const open = () => {
        this.selectedEvent = event;
        this.selectedEventParsed = this.$refs.calendar.parseEvent(event);
        this.setStatus(`showEvent(): this.selectedEvent=`);
        this.setStatus(JSON.stringify(this.selectedEvent, null, 3));
        this.setStatus(`showEvent(): this.selectedEventParsed=`);
        this.setStatus(JSON.stringify(this.selectedEventParsed, null, 3));
        this.seePickers = true;
        this.selectedElement = nativeEvent.target;
        setTimeout(() => (this.selectedOpen = true), 10);
      };

      if (this.selectedOpen) {
        this.selectedOpen = false;
        setTimeout(open, 10);
      } else {
        open();
      }

      nativeEvent.stopPropagation();
    },

    showEventOrig({ nativeEvent, event }) {
      if (!event) {
        return;
      }
      const { id } = event;
      // can be used as an activator for a control
      this.selectedElement = nativeEvent.target;
      this.selectedEvent = event;
      // this enables us to get the currentEventParsed (and all it's dependencies)
      this.selectedEventId = id;
      // selectedEventParsed used for past/future events (not included in cal.getVisibleEvents())
      this.selectedEventParsed = this.$refs.calendar.parseEvent(event);

      this.setStatus(
        `Selected calendar event ${this.atWorkOrVisiting} ${event.name} [${id}]`
      );
    },

    //#endregion Calendar functions

    getCurrentTime() {
      return this.cal
        ? this.cal.times.now.hour * 60 + this.cal.times.now.minute
        : 0;
    },
    roundTime(time, down = true) {
      const roundTo = 15; // minutes
      const roundDownTime = roundTo * 60 * 1000;

      return down
        ? time - (time % roundDownTime)
        : time + (roundDownTime - (time % roundDownTime));
    },
    updateTime() {
      this.updateTimeInterval = setInterval(
        () => this.cal.updateTimes(),
        60 * 1000
      );
    },

    getMillis(ts) {
      return DateTime.fromJSDate(this.cal.timestampToDate(ts))
        .toLocal()
        .toMillis();
    },

    updateSharedVisit() {
      this.update('graph');
      this.snackbarPrompt = false;
    },

    logSharedVisit(query) {
      if (query && query.shared) {
        this.selectedEvent = this.$route.params;

        const { name, date } = query;
        this.prompt = `Log shared event (${name} on ${date})?`;
        this.snackbarPrompt = true;
      }
    },
    findUnloggedVisits() {
      head(
        this.relevantEvents.filter(
          (v) => !v.loggedVisitId && !inFuture(v.start)
        )
      ).cata({
        Just: (unlogged) => this.logVisitNow(unlogged),
        Nothing: (err) => {
          this.setStatus(err ? err : 'No unlogged visits');
        },
      });
    },
    logVisitNow(unlogged) {
      this.selectedEvent = unlogged;
      this.prompt = `Log event?  ${this.selectedEvent.name} ${this.selectedEvent.date}`;
      this.snackbarPrompt = true;
    },
  },

  watch: {
    mailToString(val) {
      this.setStatus('email:', val);
    },

    ready() {
      this.findUnloggedVisits();
      let x = userSince(new Date(this.usernumber));
      this.setStatus(`Active for: ${x}`);
    },
    selectedGraph() {
      this.changeGraphName(this.selectedGraph);
      this.confirmationMessage = `Graph is now ${this.selectedGraph}`;
      this.snackbar = true;
    },

    confirmations(msg) {
      const {
        deleted,
        logged,
        loggedVisitId,
        confirmationColor,
        confirmationMessage,
      } = msg;
      this.confirmationColor = confirmationColor;
      this.confirmationMessage = confirmationMessage;
      if (deleted) {
        // TODO get a better way to refresh state to relevantEvents loses the deleted record
        this.setStatus('Deleted visit to', this.selectedEvent.name);
      } else {
        this.selectedEvent.color = logged ? 'primary' : 'secondary';
        this.selectedEvent.loggedVisitId = loggedVisitId;
        const then = DateTime.fromMillis(this.usernumber);
        const age = userSince(then);
        if (age < 32) {
          this.confirmationMessage =
            'Congratulations for adopting LCT. Stay safe out there.';
        }
      }
      this.snackbar = true;
    },
  },

  mounted() {
    this.ready = true;
    this.configureCalendar();
    this.updateTime();
    // log a shared visit (if data was in the route querystring)
    this.logSharedVisit(this.$route.params);
  },
};
</script>

<style scoped lang="scss">
.v-current-time {
  height: 2px;
  background-color: #a235ea;
  position: absolute;
  left: -1px;
  right: 0;
  pointer-events: none;

  &.first::before {
    content: '';
    position: absolute;
    background-color: #a235ea;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    margin-top: -5px;
    margin-left: -6.5px;
  }
}
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

.v-card--reveal {
  align-items: center;
  bottom: 0;
  justify-content: center;
  opacity: 1;
  position: absolute;
  width: 300;
  font-size: 15px;
}

.Calendar {
  width: 100vw;
  height: 80vh;
}

.CalendarWithStatus {
  height: 64vh;
}
</style>
