<template>
  <v-row no-gutters>
    <v-col fluid id="calendarDiv" class="fill-height">
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
        <v-btn icon @click="openDiagnostics = true"
          ><v-icon>history</v-icon></v-btn
        >
      </v-toolbar>

      <v-sheet :class="checkEmergency">
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

      <v-bottom-sheet v-model="seePickers" max-width="550">
        <v-sheet>
          <event-edit-card
            v-if="!banner"
            :selectedEventParsed="selectedEventParsed"
            :mailToUri="mailToUri"
            :isConnected="isConnected"
            @logEvent="onLogEvent"
            @share="banner = true"
            @deleteEvent="onDeleteEvent"
            @enlargeQR="enlargeQR = true"
            @closeDateTimeCard="onCloseDateTimeCard"
          ></event-edit-card>

          <!-- this opens up when the Description field -->
          <v-banner v-model="banner">
            <v-row class="mt-0" no-gutters>
              <v-col cols="12">
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
              <v-btn color="green" text input-value @click="emailEvent">
                Email
              </v-btn>
            </v-row>
          </v-banner>
        </v-sheet>
      </v-bottom-sheet>

      <v-dialog v-model="enlargeQR" width="500">
        <v-card>
          <v-card-title>Event QR</v-card-title>
          <v-card-text>
            <v-row justify="space-around">
              <VueQRCodeComponent
                id="qr"
                ref="qr"
                :text="decodedUri"
                error-level="L"
              >
              </VueQRCodeComponent>
            </v-row>
          </v-card-text>
          <v-card-title class="mb-0 pb-1">Event URL:</v-card-title>
          <v-card-text class="text-caption">{{ decodedUri }}</v-card-text>

          <v-divider></v-divider>

          <v-card-actions>
            <v-spacer />
            <v-btn @click="enlargeQR = false"><v-icon>close</v-icon></v-btn>
            <v-spacer />
          </v-card-actions>
        </v-card>
      </v-dialog>
      <v-snackbar
        v-model="snackbar"
        top
        :color="confirmationColor"
        vertical
        timeout="-1"
      >
        <span v-html="confirmationMessage" />
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
    </v-col>
    <v-col v-if="openDiagnostics" no-gutters>
      <v-card flat>
        <v-btn absolute top right icon @click="openDiagnostics = false"
          ><v-icon>close</v-icon></v-btn
        >
        <v-btn plain text @click="emailDiagnostics" large class="mt-3"
          >Diagnostics</v-btn
        >
        <v-card-text>
          <pre class="text-body-2">{{ diagnosticOutput }}</pre>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
import EventEditCard from '@/components/cards/eventEditCard';
import VueQRCodeComponent from 'vue-qr-generator';

import { DateTime, makeTimes, userSince } from '@/utils/luxonHelpers';
import { printJson,getOnHours } from '@/utils/helpers';

export default {
  name: 'Calendar',
  // Step 4/4: expose Model's functions and props to component
  props: {
    selectedSpace: Object,
    isDefaultGraph: Boolean,
    state: Object,
    onUpdate: Function,
    setDefaultGraphName: Function,
    confirmations: Object, // = {name, deleted, shared, logged, loggedVisitId, msg, };
    usernumber: Number,
    getVisits: Function,
    isConnected: Boolean,
    updateGraphVisit: Function,
    emergency: Boolean,
    earnReward: Function,
    getVisitByID: Function,
  },
  components: {
    VueQRCodeComponent,
    EventEditCard,
  },
  computed: {
    // test(){
    //   const {
    //     place_id,
    //     name,
    //     date,
    //     start,
    //     end,
    //     graphName,
    //   } = this.selectedEvent;
    // },
    diagnosticOutput() {
      return this.diagnostics.join('\n');
    },
    checkEmergency() {
      if (!this.openDiagnostics) {
        return 'Calendar';
      }
      return this.$vuetify.breakpoint.mdAndUp ? 'EmergencyW' : 'EmergencyH';
    },
    gatheringLabel() {
      return this.selectedEvent && this.selectedEvent.indoor
        ? 'Room '
        : 'Description ';
    },
    gatheringHint() {
      // TODO this and label above need Maybe treatment
      return this.selectedEvent && this.selectedEvent.outdoor
        ? 'Outdoor events may need a description'
        : 'Indoor events may need a room ID';
    },

    decodedUri() {
      // the QR code generator needs to use the decoded URI
      return decodeURIComponent(this.mailToUri);
    },

    mailToUri() {
      // check for mounting state
      if (!this.selectedEvent) {
        return;
      }

      const { place_id, name, date, start, end, graphName } =
        this.selectedEvent;
      console.log(
        'mailToUri()->name, selectedEvent.name',
        name,
        this.selectedEvent.name
      );
      const printedName = `${name}`;
      // TODO replace with en[de]codeURI[Component]()
      // const escapedName = encodeURIComponent(printedName)
      // const escapedGraphName = encodeURIComponent(graphName)
      // do normal url encoding for the rest of the args
      // we will reverse this edit in space.js (but see note above in decodedUri())
      const uri = encodeURIComponent(
        `place_id=${place_id}&date=${date}&start=${start}&end=${end}&name=${printedName}&graphName=${graphName}`
      );
      const fullUri = `${this.origin}/?${uri}`;
      console.log('mailToUri()->uri', fullUri);
      return fullUri;
    },

    mailToString() {
      if (!this.alias) {
        return '';
      }
      const { place_id, name, date, start, end } = this.selectedEvent;
      const printedName = `${name}`;
      console.log('mailToString() > printedName', printedName);
      return `mailto:${this.alias}?subject=Join me at ${printedName.replace(
        /&/g,
        'and'
      )} on ${date}&body=Click this link to open LCT (then log the event from there):${
        this.newLine
      } ${this.mailToUri}  ${this.newLine}  ${
        this.newLine
      }      Name/Place-id: ${printedName}/${place_id} ${
        this.newLine
      }      Start time: ${new Date(start)}${
        this.newLine
      }      End time: ${new Date(end)}${this.newLine}${
        this.newLine
      }See you then...${this.newLine}${this.toName}`;
    },

    currentGraphName() {
      return this.state.currentGraphName;
    },

    // TODO PRI2 REFACTOR: all three events should be a cascading async-either that deletes expired events along the way
    // TODO NOTE: Classic ViewModel property here: Model provides primitive values
    // and relevantEvents transforms them for the UI as an array of two entities.
    // further refinement such as events in a date range would be handled as computed property or filter.
    expiredEvents() {
      // TODO should this property include all visits or only those for the selected day?
      try {
        const cutoffDateTime = DateTime.now().minus({ days: 10 }).toMillis();
        return this.getVisits().filter((v) => v.start < cutoffDateTime);
      } catch (error) {
        return [];
      }
    },
    relevantEvents() {
      // TODO should this property include all visits or only those for the selected day?
      try {
        const cutoffDateTime = DateTime.now().minus({ days: 10 }).toMillis();
        return this.getVisits().filter((v) => v.start > cutoffDateTime);
      } catch (error) {
        return [];
      }
    },
    unloggedEvents() {
      return this.relevantEvents.filter((v) => Number.isNaN(v.loggedVisitId));
    },

    intervalCount() {
      return this.range * (60 / this.intervalMinutes) + 2;
    },
    eventDetails() {
      // TODO This is where you decide what and how to display event details
      return this.selectedEvent.details;
    },
    nowY() {
      return this.cal ? this.cal.timeToY(this.cal.times.now) + 'px' : '-10px';
    },
  },
  data() {
    return {
      confirmationParam: null,
      openDiagnostics: this.emergency,
      diagnostics: [],
      enlargeQR: false,

      showStatus: true,
      qrText: '',

      seePickers: false,
      showQR: false,
      room: null,
      hasRoom: false,
      dev: false,
      origin: window.location.origin,
      banner: false,
      alias: null,
      toName: '',
      newLine: '%0a',
      updateTimeInterval: null,
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
      selectedEvent: null,
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
    // TODO why isn't this in Model?
    emailDiagnostics() {
      this.copyStatus();
      window.location = `mailto:mcorning@soteriaInstitute.org?subject=Diagnostics&body=[Please replace this line with your pasted diagnostics, and thanks a0xF4240 for helping make LCT better.]\n`;
    },

    log(diagnostic) {
      this.diagnostics.push(diagnostic);
    },

    toggleStatus() {
      this.showStatus = !this.showStatus;
    },

    openBanner() {
      this.banner = true;
      this.qrText = document.getElementById('qr');
    },

    copy: (e) => {
      alert('You just copied: ' + e.text);
    },
    onError: function () {
      alert('Failed to copy texts');
    },
    onDeleteEvent() {
      this.delete();
      this.seePickers = false;
    },

    makeDateTimes(newDateTimes) {
      const { pickedDate, pickedStartTime, pickedEndTime } = newDateTimes;
      const times = makeTimes(pickedDate, pickedStartTime, pickedEndTime);
      const { startTime, endTime } = times;

      this.seePickers = false;
      this.selectedEvent.date = pickedDate;
      this.selectedEvent.start = startTime;
      this.selectedEvent.end = endTime;
    },
    onLogEvent(newDateTimes) {
      this.makeDateTimes(newDateTimes);
      this.update('graph');
    },



    onCloseDateTimeCard(dto) {
      if (dto === 0) {
        this.seePickers = false;
        return;
      }
      const { date, start, end } = dto;
      const { on, hours } = getOnHours(start, end);
      this.selectedEvent.date = date;
      // TODO DCR use functional code to track invalid/reason/explanation
      this.selectedEvent.start = start;
      this.selectedEvent.end = end;
      // added for warnings Redis Stream
      this.selectedEvent.on = on;
      this.selectedEvent.hours = hours;
      this.update('cache');

      const graphName = this.selectedEvent.graphName;
      const id = this.selectedEvent.loggedVisitId;
      const param = { id, start, end, graphName };
      this.log(printJson(param));
      // graph.js wraps event to server in a Promise
      // result is always an object so we can easily add/change contents
      // without chaning the API
      this.updateGraphVisit(param).then((result) => {
        this.log(result.msg);
        this.seePickers = false;
      });
    },

    getMailToString() {
      const { place_id, name, date, start, end } = this.selectedEvent;
      const printedName = `${name}`;
      console.log('mailToString() > printedName: ', printedName);
      return `mailto:?subject=Join me at ${printedName.replace(
        /&/g,
        'and'
      )} on ${date}&body=Click this link to open LCT (then log the event from there):${
        this.newLine
      } ${this.mailToUri}  ${this.newLine}  ${
        this.newLine
      }      Name/Place-id: ${printedName}/${place_id} ${
        this.newLine
      }      Start time: ${new Date(start)}${
        this.newLine
      }      End time: ${new Date(end)}${this.newLine}${
        this.newLine
      }See you then...${this.newLine}${this.toName}`;
    },
    emailEvent() {
      this.seePickers = false;
      this.selectedEvent.name += ' ' + this.room ?? '';
      this.update('cache');

      const mailToString = this.getMailToString();
      console.log('emailEvent()->mailToString:', mailToString);
      this.log(`Setting window.location to:`);
      this.log(`${mailToString}`);
      window.location = mailToString;
    },

    delete(eventToHandle = this.selectedEvent) {
      this.onUpdate({ eventToHandle, deleteVisit: true });
      this.selectedOpen = false;
    },
    // TODO URGENT: rethink this management scheme now that we have to delete more than one expired event at once
    deleteExpired() {
      const eventToHandle = this.selectedEvent;
      this.onUpdate({ eventToHandle, deleteVisit: true });
      this.selectedOpen = false;
    },
    update() {
      this.log(`Updating cache with:`);
      const { name, date, start, end, id } = this.selectedEvent;
      this.log(printJson({ name, date, start, end, id }));
      const eventToHandle = this.selectedEvent;
      this.onUpdate({ eventToHandle, deleteVisit: false });
      this.selectedOpen = false;
    },
    onStateAvailable() {
      console.log('onStateAvailable for all components');
    },
    //#region Calendar controls functions

    scrollToTime() {
      const time = this.getCurrentTime();
      const first = Math.max(0, time - (time % 30) - 30);
      this.cal.scrollToTime(first);
    },

    onChange() {
      this.cal = this.$refs.calendar;
      this.scrollToTime();
    },

    configureCalendar() {
      // TODO Refactor if block to use grid under calendar for workers only
      if (this.isCategoryCalendar && this.isTakingAppointments) {
        this.tip =
          'You can add appointments by clicking a time interval for any selected day.';
        this.range = 8;

        this.log(
          `. intervalMinutes: ${this.intervalMinutes}  first-time: ${this.firstTime}  range: ${this.range}  intervalCount: ${this.intervalCount} `
        );
      } else {
        this.tip = 'Stay safe out there...';
      }
    },
    viewDay({ date }) {
      this.focus = date;
      console.log(`Going to ${date}`);
      this.log(`Going to ${date}`);
      this.type = 'day';
      this.currentDate = date;
    },
    setToday() {
      this.focus = '';
      this.viewDay(Date.now());
      this.log(`Going back to today`);
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
      return this.currentEventParsed?.input.id === event.id
        ? `${event.color} darken-1`
        : event.color;
    },
    showEvent({ nativeEvent, event }) {
      const open = () => {
        this.selectedEvent = event;
        this.selectedEventParsed = this.$refs.calendar.parseEvent(event);
        this.seePickers = true;
        this.banner = false;
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

      this.log(
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

    // used all the time now to ensure every event is logged to the graph
    openVue() {
      let x = userSince(new Date(this.usernumber));
      this.log(`Visior active for: ${Math.round(x, 0)} days`);

      if (!this.isConnected) {
        this.log('0) Visitor is offline');
        this.confirmationColor = 'orange';
        this.confirmationMessage =
          'You are offline. We will log your visit as soon as you get connected.';
        this.snackbar = true;
        return;
      }

      this.log('All events in calendar:');
      this.log(printJson(this.getVisits()));

      this.log('All relevant events (younger than 10 days):');
      this.log(printJson(this.relevantEvents));

      let ct = 0;
      this.expiredEvents.forEach((expiredEvent) => {
        this.log('Deleting', expiredEvent.name, 'from storage and graph');
        this.delete(expiredEvent);
        ct = +1;
      });
      if (ct > 0) {
        this.log(`Deleted ${this.ct} expired visits`);

        this.log(
          'All events in calendar (should now match all events in graph):'
        );
        this.log(printJson(this.getVisits()));
      }
      console.log('unloggedEvents', printJson(this.unloggedEvents));
      const m = this.unloggedEvents.map((expiredEvent) => {
        console.log('expiredEvent', printJson(expiredEvent));
        this.onUpdate({ expiredEvent, deleteVisit: false });
        return expiredEvent.shared;
      });
      console.log(m);
    },

    showConfirmation(msg) {
      this.confirmationMessage = msg;
      this.snackbar = true;
    },
    convertDateTime(val) {
      return new DateTime.fromISO(val).toLocaleString(DateTime.DATETIME_MED);
    },
    confirm(val) {
      this.confirmationColor = 'success';

      console.log(val);
      console.log(' ');
      let msg;
      //   // TODO refactor given latest TQR
      // if (val.shared) {
      //   this.earnReward({
      //     pid: val.place_id,
      //     name: val.name,
      //     uid: this.$socket.client.auth.userID,
      //   }).then((visitedOn) => {
      //     const dates = visitedOn.map((v) => this.convertDateTime(v));
      //     msg = `<p>You are earning LCT Reward points with ${
      //       val.name
      //     } with these visits:</p>${dates.join('<br/>')}`;
      //     this.showConfirmation(msg);
      //   });
      // } else
      if (val.deleteVisit) {
        this.confirmationColor = 'orange';
        msg = `Deleted visit to ${val.name} (namely, the ${val.loggedVisitId} node on the ${val.graphName} graph)`;
        // code is acting weird and delete is not seeing the loggedVisitId. investigating...
        // msg = `Deleted visit to ${val.name} graph visited ID: ${val.loggedVisitId}`;
      } else {
        msg = `Added visit to ${val.name} in ${val.graphName} graph returning nodeID: ${val.loggedVisitId}`;
      }
      this.showConfirmation(msg);
    },
  },

  watch: {
    emergency(val) {
      console.log(val);
    },
    mailToString(val) {
      this.log(`email: ${val}`);
    },

    ready() {
      this.openVue();
    },

    confirmations(val) {
      this.confirm(val);
    },

    confirmationParam(val) {
      this.confirm(val);
    },

    confirmationsOld(val) {
      const { name, deleted, shared, loggedVisitId } = val;
      let msg;
      if (deleted) {
        // TODO get a better way to refresh state to relevantEvents loses the deleted record
        this.log(`Deleted visit to ${this.selectedEvent.name}`);
      } else {
        this.selectedEvent.color = loggedVisitId >= 0 ? 'primary' : 'secondary';
        this.selectedEvent.loggedVisitId = loggedVisitId;
        const then = DateTime.fromMillis(this.usernumber);
        const age = userSince(then);
        msg +=
          age < 8
            ? '<br/>Oh, and welcome to the LCT community. Stay safe out there...'
            : '';
      }
      this.confirmationMessage = msg;
      console.log('confirmationMessage', this.confirmationMessage);

      if (shared) {
        this.earnReward({
          name: name,
          uid: this.$socket.client.auth.userID,
        }).then((sid) => {
          this.confirmationMessage += `<p>You are earning LCT Reward points (Confirmation number: ${sid}</p>`;
          this.snackbar = true;
        });
      } else {
        this.snackbar = true;
      }
    },
  },

  mounted() {
    this.configureCalendar();
    this.updateTime();
    // log a shared visit (if data was in the route querystring)
    // this.logSharedVisit(this.$route.params);
    if (Object.keys(this.$route.params).length) {
      this.confirmationParam = this.$route.params;
    }

    const query = this.$route.query;
    this.openDiagnostics = query.d && query.d === '1';
    this.ready = true;
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
.EmergencyW {
  width: 50vw;
  height: 88vh;
}
.EmergencyH {
  width: 100vw;
  height: 50vh;
}
pre {
  overflow-x: auto;
  white-space: pre-wrap;
  white-space: -moz-pre-wrap;
  white-space: -pre-wrap;
  white-space: -o-pre-wrap;
  word-wrap: break-word;
}
</style>
