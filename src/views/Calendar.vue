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
    </v-toolbar>
    <State @stateAvailable="onStateAvailable">
      <v-sheet slot-scope="{ relevantEvents }" :height="calendarHeight">
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
        </v-calendar>
        <v-menu
          v-model="selectedOpen"
          :close-on-content-click="false"
          :activator="selectedElement"
          offset-x
        >
          <v-card color="grey lighten-4" min-width="350px" flat>
            <v-toolbar :color="selectedEvent.color" dark>
              <v-btn icon>
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-toolbar-title v-html="selectedEvent.name"></v-toolbar-title>
              <v-spacer></v-spacer>
              <v-btn icon>
                <v-icon>mdi-heart</v-icon>
              </v-btn>
              <v-btn icon>
                <v-icon>mdi-dots-vertical</v-icon>
              </v-btn>
            </v-toolbar>
            <v-card-text>
              <span v-html="eventDetails"></span>
            </v-card-text>
            <v-card-actions>
              <v-btn text color="secondary" @click="selectedOpen = false">
                Cancel
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>
      </v-sheet>

      <div class="mt-5 mb-0 ml-15">
        <small>{{ status }}</small>
      </div>
    </State>
  </div>
</template>

<script>
import State from '@/components/renderless/State.vue';

export default {
  name: 'Calendar',
  props: {
    selectedSpace: Object,
  },
  components: {
    State,
  },
  computed: {
    intervalCount() {
      return this.range * (60 / this.intervalMinutes) + 2;
    },
    eventDetails() {
      // TODO This is where you decide what and how to display event details
      const x = this.selectedEvent.details;
      return x;
    },
  },
  data() {
    return {
      cal: null,
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
    };
  },
  methods: {
    onChange() {
      // TODO this is the first place you use Maybe monad
      const cal = this.$refs.calendar || null;
      const firstEvent = cal.getVisibleEvents().reduce((a, c) => {
        return a.startTimestampIdentifier < c.startTimestampIdentifier ? a : c;
      });
      const time = firstEvent ? firstEvent.start.time : '12:00';
      cal.scrollToTime(time);
      this.cal = cal;
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

    logVisit() {
      this.$emit('logVisit', this.selectedEventParsed);
    },
    //#endregion Calendar functions

    // newVisit() {
    //   const time = this.place.startTime || Date.now();
    //   const shift = this.place.shift;
    //   const place_id = this.place.place_id;
    //   this.addVisit(time, place_id, shift);
    // },
    // addVisit(
    //   time,
    //   place_id = this.place.place_id,
    //   stay = this.intervalMinutes
    // ) {
    //   console.log(time, place_id, stay);
    //   const starttime = this.roundTime(time);
    //   const endtime = starttime + stay;
    //   const entity = {
    //     id: randomId(),
    //     name: this.place.name,
    //     place_id: place_id,
    //     start: starttime,
    //     end: endtime,
    //     date: DateTime.fromMillis(starttime).toISODate(),
    //     category: 'You',

    //     timed: true,
    //     marked: getNow(),
    //     graphName: this.graphname,
    //     color: this.isDefaultGraph ? 'secondary' : 'sandboxmarked',
    //     loggedNodeId: '', // this will contain the internal id of the relationship in redisGraph
    //   };

    //   // TODO refactor for State
    //   //this.updateCache({ action: 'add', entity });
    // },

    roundTime(time, down = true) {
      const roundTo = 15; // minutes
      const roundDownTime = roundTo * 60 * 1000;

      return down
        ? time - (time % roundDownTime)
        : time + (roundDownTime - (time % roundDownTime));
    },
  },

  watch: {},

  mounted() {
    const self = this;
    self.configureCalendar();
    self.ready = true;
  },
};
</script>
