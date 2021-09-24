<script>
// Model's first job is make a connection to the server in case an Alert awaits// append: Append a value to a key
// Model's second job is to handle local state including ORM entities.
// import crypto from 'crypto';
// const randomId = () => crypto.randomBytes(8).toString('hex');

import Setting from '@/models/Setting';
import Visit from '@/models/Visit';
import Place from '@/models/Place';
import Appointment from '@/models/Appointment';

import { timeMixin } from '@/js/time';
import { graphMixin } from '@/js/graph';
import { spaceMixin } from '@/js/space';
import { warningMixin } from '@/js/warning';

import { highlight, success, printJson } from '../../utils/helpers';
import { firstOrNone, allOrNone } from '@/fp/utils.js';
import { Some } from '@/fp/monads/Maybe.js';

export default {
  props: {},

  mixins: [graphMixin, spaceMixin, timeMixin, warningMixin],

  computed: {
    // preferredGraphName() {
    //   return this.state.settings.preferredGraph;
    // },
    isConnected() {
      return !!this.$socket.connected;
    },

    unloggedVisits() {
      return this.visits.filter((v) => !v.loggedVisitId);
    },

    hasUnloggedVisits() {
      return this.unloggedVisits.length;
    },

    isDefaultGraph() {
      return this.graphName === this.$defaultGraphName;
    },

    hasVisits() {
      return this.state.visits.length > 0;
    },
    visits() {
      return this.state.visits;
    },
    visitCount() {
      return this.state.visits.length;
    },
    settings() {
      return this.state.settings;
    },
    sessionID() {
      return this.settings.sessionID;
    },
    needsUsername() {
      return !this.settings.username;
    },
    usernumber() {
      return this.settings.usernumber;
    },
  },

  data() {
    return {
      test: null,
      state: {},
      avgStay: 1000 * 60 * 30,
      selectedMarker: null,
      selectedEvent: null,
      pendingVisits: new Map(),
      loading: true,
      graphName: '',
      // TODO send this data down to Calendar
      /* combinations of update
       *   Add Visit (category==='You')
       *   Add Appointment (category==='Them')
       *   Update Visit field (category==='You' || id)
       *   Update Appointment field (category==='Them' || id)
       *   Delete Appointment (category==='Them')
       *   Delete Visit (category==='You')
       */
      // actions: {
      //   isDay: {
      //     add: (data, f) => Visit.updatePromise(data, f),
      //     update: (data, f) => Visit.updateFieldPromise(data, f),
      //     delete: (data, f) => Visit.deletePromise(data, f),
      //   },
      //   isCategory: {
      //     add: (data, f) => Appointment.updatePromise(data, f),
      //     update: (data, f) => Appointment.updateFieldPromise(data, f),
      //     delete: (data, f) => Appointment.deletePromise(data, f),
      //   },
      // },
    };
  },

  methods: {
    getVisits() {
      // return this.visits.filter((v) => !v.loggedVisitId);
      const x = Visit.query().get();
      return x;
    },
    getUnloggedVisits() {
      // return this.visits.filter((v) => !v.loggedVisitId);
      const x = Visit.query()
        .where('loggedVisitId', '')
        .get();
      return x;
    },
    onExposureWarning(reason) {
      this.emitFromClient('exposureWarning', reason);
    },

    // TODO has this abstract approach been superseded by time.js and space.js?
    onUpdate(target, selectedEvent, deleteVisit = false) {
      this.selectedEvent = selectedEvent;
      const f = this[target];
      f(deleteVisit);
    },

    cache(deleteVisit) {
      if (deleteVisit) {
        const id = this.selectedEvent.id;
        this.deleteVisit(id);
        this.$emit('updatedModel', { id, deleted: true });

        return;
      }
      this.updateVisit(this.selectedEvent);
    },

    // called by Calendar when logging or deleting a Visit
    graph(deleteVisit) {
      if (deleteVisit) {
        this.onDeleteNode(
          this.selectedEvent.loggedVisitId,
          this.getGraphName()
        );
        // if we deleted the graph node, then we should delete the cache entry, too
        // but we assume the node delete operation succeeds. what if it doesn't?
        this.cache(true);
        return;
      }
      // TODO actually, this poor man's polymorphism here feels like it needs a functional approach
      this.onLogVisit(this.selectedEvent);
    },

    // called when there are unlogged visits
    logVisits() {
      return new Promise((resolve) => {
        const x = this.unloggedVisits.length;
        this.unloggedVisits.forEach((visit) => {
          this.onLogVisit(visit);
        });
        resolve(`Logged ${x} visits.`);
      });
    },

    // NOTE: compared to the original onLogVisit(), reducing LOC from 40 to 10 is admirable
    // and far easier to reason over and maintain
    onLogVisit(visit) {
      const { id: visitId, name, start, end } = visit;
      // get ref to vue model (to avoid this as Window and buffer below)
      const vm = this;

      function redisGraphCallback(results) {
        const { id, place, graphName, logged } = results;
        console.log(
          success(
            'redisGraphCallback:updateVisitOnGraph results:',
            printJson(results)
          )
        );
        vm.$emit('updatedModel', { place, graphName, id, logged });
        // now update Visit entity (picking up the visitId from the closure)
        vm.updateLoggedVisitId({ visitId, place, graphName, id, logged });
      }

      const query = {
        visitId,
        place: name,
        start: start,
        end: end,
        graphName: this.getGraphName(),
        userID: this.$socket.client.auth.userID,
      };
      console.log(highlight(`Model.vue's Visit query: ${printJson(query)}`));
      this.emitFromClient('logVisit', query, redisGraphCallback);
    },

    emitFromClient(eventName, data, ack) {
      this.$socket.client.emit(eventName, data, ack);
    },

    // TODO Why isn't this a computed prop?
    getGraphName() {
      return this.graphName || this.$defaultGraphName;
    },
    changeGraphName(name) {
      const newName = name
        ? name
        : this.graphName === '' || this.graphName === 'Sandbox'
        ? this.$namespace
        : 'Sandbox';
      this.graphName = newName;
      this.$defaultGraphName = this.graphName;
      this.updateSetting({ id: 1, preferredGraph: this.graphName });
      return newName;
    },

    setPoi(namespace, location, viewport) {
      this.updateSetting({ id: 1, namespace, location, viewport });
      this.updateState({ settings: { namespace, location, viewport } });
    },
    getPoi() {
      return {
        namespace: this.state.settings.namespace || 'Sisters',
        plus_code: '7FR4+J8 Sisters, Oregon',
        location: (this.state.settings.location &&
          JSON.parse(this.state.settings.location)) || {
          lat: 44.298087,
          lng: -121.5479629,
        },
        viewport: (this.state.settings.viewport &&
          JSON.parse(this.state.settings.viewport)) || {
          south: 44.277691,
          west: -121.5841261,
          north: 44.302512,
          east: -121.534241,
        },
      };
    },

    updateState(newState) {
      // Copy all properties from newState on to
      // this.state, overriding anything on this.state
      // TODO NOTE: if any of the props in newState are undefined, iterating halts
      // should we be using Maybes here?
      this.state = { ...this.state, ...newState };
      if (this.$DEBUG) {
        console.log('Updated state:');
        console.log(printJson(this.state));
      }
    },

    getSomeEntityData(source) {
      return allOrNone(source).match({
        Some: (v) => v,
        None: () => [],
      });
    },

    getFirstEntityData(source) {
      return firstOrNone(source).match({
        Some: (v) => v,
        None: () => [],
      });
    },

    filterSomeEntityData(f, source) {
      return allOrNone(source).match({
        Some: (v) => v.filter(f),
        None: () => [],
      });
    },

    filterFunctionForValidVisits: (v) =>
      !(
        Number.isNaN(v.end) ||
        Number.isNaN(v.start) ||
        !v.id ||
        v.id.startsWith('$')
      ),

    filterFunctionForNamedPlaces: (v) => v.name,

    // remember to use the entity name with each fetched objects
    initState(entities) {
      const [allSettings, allPlaces, allVisits, allAppointments] = entities;

      const settings = this.getFirstEntityData(allSettings.settings);
      if (!settings.usernumber) {
        this.updateUsernumber();
      }

      this.$defaultGraphName =
        settings.preferredGraph || this.$defaultGraphName;
      const places = this.filterSomeEntityData(
        this.filterFunctionForNamedPlaces,
        allPlaces.places
      );

      const visits = this.filterSomeEntityData(
        this.filterFunctionForValidVisits,
        allVisits.visits
      );

      const appointments = this.getSomeEntityData(allAppointments.appointments);

      const some = Some({
        settings,
        places,
        visits,
        appointments,
      });
      return some;
    },
    updateUsernumber() {
      // as a date, this permits us to use the usernumber to see how long they've been using LCT
      const userNumber = Date.now();

      this.updateSetting({ id: 1, usernumber: userNumber });
      this.updateState({ settings: { usernumber: userNumber } });
    },
    updateSession(data) {
      console.log('Model passing', data, 'to Setting');
      this.updateSetting({ id: 1, ...data });
    },
  },

  watch: {
    test(val) {
      console.log(val);
    },
    loading() {
      console.log(success('\tMODEL mounted'));
      console.log('Visits: ', this.state.visits.length);
      console.log('Default Graph:', this.getGraphName());
    },
    'state.settings.vaccinationStatus'(n) {
      console.log(n);
      this.updateSetting({ id: 1, vaccinationStatus: n });
    },
    'state.settings.lastFluShot'(n) {
      console.log(n);
      this.updateSetting({ id: 1, lastFluShot: n });
    },
  },

  mounted() {
    Promise.all([
      Setting.$fetch(),
      Place.$fetch(),
      Visit.$fetch(),
      Appointment.$fetch(),
    ])
      .toEither()
      .map((entities) => this.initState(entities))
      .map((someData) =>
        someData.match({
          Some: (data) => this.updateState(data),
          None: () => console.log('No Data!'),
        })
      )
      .cata({
        ok: () => (this.loading = false),
        error: (err) => {
          // let global error handler take over so we see the error in the snackbar.
          this.$emit('error', err);
        },
      });
  },

  render() {
    // The first user of Model will not see data if we render() while loading
    if (this.loading) {
      return { loading: this.loading };
    }

    // Pass *all* our props and function into our scoped slot
    // so we can render children with Model data and we can expose state changing functions.
    // Step 1/4: Expose all data and methods that could be used by dynamic components
    //    In views/*.vue files:
    //    Step 2/4: don't forget to ref a Model function next
    //    Step 3/4: assign slotted props to component's props
    //    in component/*.vue files:
    //    Step 4/4: expose Model's functions and props to component
    // See Time.vue and Calendar.vue for the other three steps.
    return this.$scopedSlots.default({
      // Global assets
      usernumber: this.usernumber,
      updateUsernumber: this.updateUsernumber,
      updateSession: this.updateSession,
      state: this.state,
      updateState: this.updateState,
      isDefaultGraph: this.isDefaultGraph,
      connectMe: this.connectMe,
      isConnected: this.isConnected,
      needsUsername: this.needsUsername,
      // Space assets
      onMarkerClicked: this.onMarkerClicked,
      onMarkerAdded: this.onMarkerAdded,
      onToWork: this.onToWork,
      onVisitPlace: this.onVisitPlace,
      onSharePlace: this.onSharePlace,
      onMakeAppointment: this.onMakeAppointment,
      onShareGathering: this.onShareGathering,
      onDeletePlace: this.onDeletePlace,
      setPoi: this.setPoi,
      getPoi: this.getPoi,

      // Time assets
      changeEvent: this.changeEvent,
      onUpdate: this.onUpdate,
      getGraphName: this.getGraphName,
      changeGraphName: this.changeGraphName,
      setDefaultGraphName: this.setDefaultGraphName,
      updateLoggedVisitId: this.updateLoggedVisitId,
      getVisits: this.getVisits,

      //Warning assets
      visitCount: this.visitCount,
      hasVisits: this.hasVisits,
      hasUnloggedVisits: this.hasUnloggedVisits,
      logVisits: this.logVisits, // takes an array of visits as input
      onExposureWarning: this.onExposureWarning,
      getUnloggedVisits: this.getUnloggedVisits,
    });
  },
};
</script>
