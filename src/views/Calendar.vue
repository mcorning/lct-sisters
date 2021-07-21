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
          @click:more="viewDay"
          @click:date="viewDay"
          @click:event="showEvent"
        >
          <template v-slot:event="{ timed, eventSummary }">
            <div class="v-event-draggable" v-html="eventSummary()"></div>
            <div v-if="timed" class="v-event-drag-bottom"></div>
          </template>
        </v-calendar>
      </v-sheet>
    </State>

    <div class="mt-5 mb-0 ml-15">
      <small>{{ status }}</small>
    </div>
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
    cal() {
      // TODO why is cal() undefined?
      return this.ready ? this.$refs.calendar : null;
    },
  },
  data() {
    return {
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
      intervalCount: 24,
      intervalMinutes: 30,

      selectedElement: null,
      selectedEventId: '',
      selectedEventParsed: null,

      status: 'Ready',
    };
  },
  methods: {
    onStateAvailable() {
      console.log('onStateAvailable for all components');
    },
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
      if (!event) {
        return;
      }
      const { id } = event;
      // can be used as an activator for a control
      this.selectedElement = nativeEvent.target;

      // this enables us to get the currentEventParsed (and all it's dependencies)
      this.selectedEventId = id;
      // selectedEventParsed used for past/future events (not included in cal.getVisibleEvents())
      this.selectedEventParsed = this.$refs.calendar.parseEvent(event);

      this.status = `Selected calendar event ${this.atWorkOrVisiting} ${event.name} [${id}]`;

      // determine which dialog to render
      this.showDialog();
    },
    //#endregion Calendar functions
  },

  watch: {
    ready() {
      console.log('stop');
    },
  },
  mounted() {
    this.ready = true;
  },
};
</script>
