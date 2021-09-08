<template>
  <div id="calendarDiv" class="fill-height">
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
        <span>Current default graph: {{ getGraphName() }}</span>
      </v-tooltip>
    </v-toolbar>

    <v-sheet :height="calendarHeight">
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
      <v-menu
        v-model="selectedOpen"
        :close-on-content-click="false"
        :activator="selectedElement"
        offset-x
        max-width="400"
      >
        <v-card color="grey lighten-4" min-width="350px" flat>
          <v-toolbar :color="selectedEvent.color" dark>
            <v-toolbar-title v-html="selectedEvent.name"></v-toolbar-title>
            <v-spacer></v-spacer>
          </v-toolbar>
          <!-- <v-card-text> -->
          <PickersMenu
            :changeEvent="changeEvent"
            :selectedEventParsed="selectedEventParsed"
          />
          <!-- </v-card-text> -->
          <!-- <v-card-text> -->
          <v-row v-if="dev" class="ml-5" align="center" no-gutters>
            <v-col cols="8">
              <v-select
                v-model="selectedGraph"
                :items="graphs"
                prepend-icon="mdi-graphql"
                menu-props="auto"
                :label="graphSelectLabel"
                single-line
                dense
              ></v-select>
            </v-col>
          </v-row>
          <!-- </v-card-text> -->
          <v-card-actions>
            <v-btn text color="secondary" @click="selectedOpen = false">
              Cancel
            </v-btn>
            <v-btn text color="secondary" @click="update('cache')">
              Update
            </v-btn>
            <v-btn text color="secondary" @click="update('graph')">
              Log
            </v-btn>
            <v-btn text color="secondary" @click="banner = true">Share </v-btn>
          </v-card-actions>
          <v-divider />
          <v-banner v-model="banner">
            <v-card-title>Share a Gathering</v-card-title>
            <v-card-subtitle
              >Send event link to others who will join you</v-card-subtitle
            >
            <v-text-field
              v-model="room"
              label="Room (optional)"
              hint="If your gathering is indoors, add a Room ID, if necessary"
            ></v-text-field>

            <v-row no-gutters>
              <v-col cols="7">
                <v-text-field
                  v-model="alias"
                  label="Email alias:"
                  hint="Email a person directly or send to yourself and forward"
                ></v-text-field
              ></v-col>
              <v-spacer />
              <v-col cols="4">
                <v-text-field
                  v-model="toName"
                  hint="Name used at the end of your invitation "
                  label="Your name:"
                ></v-text-field></v-col
            ></v-row>
            <v-card-actions>
              <v-btn color="green" text input-value @click="emailEvent">
                Email
              </v-btn>
              <v-spacer />
              <v-btn color="red" text @click="banner = false"
                >Dismiss
              </v-btn></v-card-actions
            >

            <!-- <template v-slot:actions="{ dismiss }">
              <v-btn color="green" text input-value @click="emailEvent">
                Email
              </v-btn>
              <v-btn color="red" text @click="dismiss">Dismiss </v-btn>
            </template> -->
          </v-banner>
        </v-card>
      </v-menu>
    </v-sheet>

    <div class="mt-5 mb-0 ml-15">
      <small>{{ status }}</small>
    </div>
    <v-snackbar v-model="snackbar" :color="confirmationColor"
      >{{ confirmationMessage }}
      <template v-slot:action="{ attrs }">
        <v-btn color="black" text v-bind="attrs" @click="snackbar = false">
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script>
import PickersMenu from '@/components/menus/pickersMenu.vue';
import { DateTime } from '@/utils/luxonHelpers';

export default {
  name: 'Calendar',
  // Step 4/4: expose Model's functions and props to component
  props: {
    selectedSpace: Object,
    isConnected: Boolean,
    isDefaultGraph: Boolean,
    state: Object,
    onUpdate: Function,
    changeGraphName: Function,
    setDefaultGraphName: Function,
    getGraphName: Function,
    confirmations: Object,
  },
  components: {
    PickersMenu,
  },
  computed: {
    graphSelectLabel() {
      return `Exposure Graphs (${this.getGraphName()})`;
    },

    mailToTag() {
      if (!this.alias) {
        return '';
      }
      const { place_id, name, date, start, end } = this.selectedEvent;
      const escapedName = name.replace(/ /g, '_'); // urls need space escaped to %25
      console.log(escapedName);
      // do normal url encoding for the rest of the args
      const uri = encodeURIComponent(
        `place_id=${place_id}&date=${date}&start=${start}&end=${end}&name=${escapedName}`
      );
      console.log(uri);

      return `<a href=  "mailto:${
        this.alias
      }?subject=Join me at ${name} on ${date}&body=To add this event to your LCT app click this link (copy and paste the url into a messaging client like WhatsApp):${
        this.newLine
      } ${this.origin}/?${uri}  ${this.newLine}
      ${this.newLine}  ${
        this.newLine
      }      Name/Place-id: ${name}/${place_id} ${
        this.newLine
      }      Start time: ${new Date(start)}${
        this.newLine
      }      End time: ${new Date(end)}${this.newLine}${
        this.newLine
      }See you then...">Share Email</a>`;
    },
    mailToString() {
      if (!this.alias) {
        return '';
      }
      const { place_id, name, date, start, end } = this.selectedEvent;
      const printedName = `${name}${this.room ? `:_${this.room}` : ''}`;
      const escapedName = printedName.replace(/ /g, '_'); // we will reverse this edit in space.js
      console.log(escapedName);
      // do normal url encoding for the rest of the args
      const uri = encodeURIComponent(
        `place_id=${place_id}&date=${date}&start=${start}&end=${end}&name=${escapedName}`
      );
      console.log(uri);

      return `mailto:${
        this.alias
      }?subject=Join me at ${printedName} on ${date}&body=To add this event to your LCT app click this link (copy and paste the url into a messaging client like WhatsApp):${
        this.newLine
      } ${this.origin}/?${uri}  ${this.newLine}
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
        const x = [...this.state.visits, ...this.state.appointments];
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

      status: 'Ready',
      graphName: this.$defaultGraphName,

      snackbar: false,
      confirmationColor: 'success',
      confirmationMessage: '',
    };
  },

  methods: {
    emailEvent() {
      if (this.mailToString) {
        console.log('setting window.location to:', this.mailToString);
        window.location = this.mailToString;
      } else {
        this.status = 'No email address entered. No mail sent.';
      }
      this.banner = false;
    },

    changeGraph() {
      this.selectedGraph = this.changeGraphName();
    },

    delete(target, graph) {
      const deleteVisit = true;
      // TODO implement this in Model
      this.onUpdate(target, this.selectedEvent, graph, deleteVisit);
      this.selectedOpen = false;
    },
    update(target, graph) {
      this.onUpdate(target, this.selectedEvent, graph);
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
        this.status += `. intervalMinutes: ${this.intervalMinutes}  first-time: ${this.firstTime}  range: ${this.range}  intervalCount: ${this.intervalCount} `;
      } else {
        this.tip = 'Stay safe out there...';
      }
    },
    //#region Calendar controls functions
    viewDay({ date }) {
      this.focus = date;
      console.log(`Going to ${date}`);
      this.status = `Going to ${date}`;
      this.type = 'day';
      this.currentDate = date;
    },
    setToday() {
      this.focus = '';
      this.viewDay(Date.now());
      this.status = `Going back to today`;
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

      this.status = `Selected calendar event ${this.atWorkOrVisiting} ${event.name} [${id}]`;
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

    changeTimeStamp(cts) {
      const { year, month, day, hour, minute } = cts;
      let dt = DateTime.local(year, month, day, hour, minute);
      return this.roundTime(dt.toMillis());
    },

    changeEvent(cts) {
      const { start, end } = cts;
      this.selectedEvent.start = this.changeTimeStamp(start);
      this.selectedEvent.end = this.changeTimeStamp(end);
      this.selectedEvent.date = start.date;
    },
  },

  watch: {
    ready() {
      console.log(this.$defaultGraphName, '/', this.getGraphName());
    },
    selectedGraph() {
      this.changeGraphName(this.selectedGraph);
      this.confirmationMessage = `Graph is now ${this.selectedGraph}`;
      this.snackbar = true;
    },

    confirmations(msg) {
      const { logged, confirmationColor, confirmationMessage } = msg;
      this.confirmationColor = confirmationColor;
      this.confirmationMessage = confirmationMessage;
      this.selectedEvent.color = logged ? 'primary' : 'secondary';
      this.snackbar = true;
    },
  },
  //   created(){
  //   this.$socket.$subscribe('exposureAlert');

  // },

  mounted() {
    this.ready = true;
    this.configureCalendar();
    this.updateTime();
  },
  // beforeDestroy() {
  //   debugger
  //   clearInterval(this.updateTimeInterval);
  //   this.$socket.$unsubscribe('exposureAlert');
  // },
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
</style>
