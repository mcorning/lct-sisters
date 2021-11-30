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
import { redisMixin } from '@/js/redis';

import { highlight, success, printJson } from '@/utils/helpers';
import { firstOrNone, allOrNone } from '@/fp/utils.js';
import { Some } from '@/fp/monads/Maybe.js';

export default {
  props: {},

  mixins: [graphMixin, spaceMixin, redisMixin, timeMixin, warningMixin],

  computed: {
    // preferredGraphName() {
    //   return this.state.settings.preferredGraph;
    // },
    isConnected() {
      return !!this.$socket.connected;
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
    sponsor() {
      const { sid, biz } = this.settings;
      return { sid, biz };
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
      diagnostics: [],
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
    visitExists(loggedVisitId) {
      console.log(loggedVisitId);
      const x = Visit.query()
        .where('loggedVisitId', loggedVisitId)
        .exists();
      console.log('Visit ID:', loggedVisitId, x ? 'exists' : 'does not exist');
      return x;
    },
    getVisits() {
      const x = Visit.query()
        .get()
        .filter(
          (v) =>
            !(
              !v.start ||
              !v.end ||
              Number.isNaN(v.start) ||
              Number.isNaN(v.end)
            )
        );
      return x;
    },
    getPlaces() {
      const x = this.getVisits().map((v) => {
        return { name: v.name, placeID: v.place_id };
      });
      return x;
    },
    getUnloggedVisits() {
      const x = Visit.query()
        .where('loggedVisitId', '')
        .get();
      return x;
    },

    onExposureWarning(riskScore, ack) {
      const graphName = this.getPoi().namespace;
      this.emitFromClient(
        'exposureWarning',
        {
          graphName,
          riskScore,
        },
        ack
      );
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

    // called by Calendar when logging, editing, or deleting a Visit
    graph(deleteVisit) {
      if (deleteVisit) {
        this.onDeleteNode(
          this.selectedEvent.graphName,
          this.selectedEvent.loggedVisitId
        );
        // if we deleted the graph node, then we should delete the cache entry, too
        // but we assume the node delete operation succeeds. what if it doesn't?
        this.cache(true);

        return;
      }
      // TODO actually, this poor man's polymorphism here feels like it needs a functional approach
      this.onLogVisit(this.selectedEvent);
    },

    onLogVisit(visit) {
      const { id: visitId, name, place_id, start, end } = visit;
      // get ref to vue model (to avoid this as Window and buffer below)
      const vm = this;

      function redisGraphCallback(results) {
        const { id, graphName, logged } = results;
        console.log(
          success(
            'redisGraphCallback:updateVisitOnGraph results:',
            printJson(results)
          )
        );
        vm.$emit('updatedModel', { name, place_id, graphName, id, logged });
        // now update Visit entity (picking up the visitId from the closure)
        vm.updateLoggedVisitId({ visitId, name, graphName, id, logged });
      }

      const query = {
        visitId,
        place: name,
        place_id,
        start,
        end,
        graphName: this.getPoi().namespace,
        userID: this.$socket.client.auth.userID,
        sessionID: this.sessionID,
      };
      console.log(highlight(`Model.vue's Visit query: ${printJson(query)}`));

      this.emitFromClient('logVisit', query, redisGraphCallback);
    },

    emitFromClient(eventName, data, ack) {
      this.$socket.client.emit(eventName, data, ack);
    },

    clearLocationSettings() {
      this.setPoi({
        namespace: '',
        location: '',
        viewport: '',
        global_code: '',
        zoom: '',
      });
    },
    setDefaultMapCenter(center) {
      const centerVal = center ? JSON.stringify(center) : center;
      this.updateSetting({ id: 1, default_map_center: centerVal });
    },

    setPoi({ namespace, global_code, location, viewport, zoom }) {
      try {
        this.updateSetting({
          id: 1,
          namespace,
          global_code,
          location,
          viewport,
          zoom,
        });
        return;
      } catch (error) {
        return error;
      }
    },
    getPoi() {
      return {
        namespace: this.state.settings.namespace,
        global_code: this.state.settings.global_code,
        zoom: this.state.settings.zoom,
        location:
          this.state.settings.location &&
          JSON.parse(this.state.settings.location),
        viewport:
          this.state.settings.viewport &&
          JSON.parse(this.state.settings.viewport),
      };
    },

    updateState(newState) {
      // Copy all properties from newState on to
      // this.state, overriding anything on this.state
      // TODO NOTE: if any of the props in newState are undefined, iterating halts
      // should we be using Maybes here?
      // TODO CONSIDER: using getters on the entities instead of this state object
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

    updateSponsor(data) {
      console.log('Model passing', data, 'to Setting');
      this.updateSetting({ id: 1, ...data });
    },
    updateSession(data) {
      console.log('Model passing', data, 'to Setting');
      this.updateSetting({ id: 1, ...data });
    },
    incrementWarningsReceived() {
      return this.incrementWarnings();
    },
    setVaccinationStatus(n) {
      this.updateSetting({ id: 1, vaccinationStatus: n });
    },
    setSpecial(vals) {
      this.updateSetting({ id: 1, ...vals });
    },
    setPreferredGraph(graphName) {
      this.updateSetting({ id: 1, preferredGraph: graphName });
    },
    enterLottery(uid) {
      return new Promise((resolve) => {
        this.emitFromClient('enterLottery', uid, (sid) => resolve(sid));
      });
    },
  },

  watch: {
    test(val) {
      console.log(val);
    },
    loading() {
      console.log(success('\tMODEL mounted'));
      console.log('Visits: ', this.state.visits.length);
      Visit.convertLoggedVisitId();
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
      setSpecial: this.setSpecial,
      setPreferredGraph: this.setPreferredGraph,
      diagnostics: this.diagnostics,
      getGraphs: this.getGraphs,
      getRedisGraphs: this.getRedisGraphs,
      updateSponsor: this.updateSponsor,
      sponsor: this.sponsor,
      enterLottery: this.enterLottery,

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
      clearLocationSettings: this.clearLocationSettings,
      setDefaultMapCenter: this.setDefaultMapCenter,
      updateLatLng: this.updateLatLng,

      // Time assets
      changeEvent: this.changeEvent,
      onUpdate: this.onUpdate,
      setDefaultGraphName: this.setDefaultGraphName,
      updateLoggedVisitId: this.updateLoggedVisitId,
      getVisits: this.getVisits,
      getPlaces: this.getPlaces,
      visitExists: this.visitExists,
      updateGraphVisit: this.updateGraphVisit,

      //Warning assets
      visitCount: this.visitCount,
      hasVisits: this.hasVisits,
      logVisits: this.logVisits, // takes an array of visits as input
      onExposureWarning: this.onExposureWarning,
      getUnloggedVisits: this.getUnloggedVisits,
      incrementWarningsReceived: this.incrementWarningsReceived,
      setVaccinationStatus: this.setVaccinationStatus,

      // Monitor assets
      getVisitors: this.getVisitors,
      getExposures: this.getExposures,
      getVisitTimes: this.getVisitTimes,
      validateVisits: this.validateVisits,
    });
  },
};
</script>
