<script>
// Model's first job is make a connection to the server in case an Alert awaits// append: Append a value to a key
// Model's second job is to handle local state including ORM entities.
// import crypto from 'crypto';
// const randomId = () => crypto.randomBytes(8).toString('hex');

import Setting from '@/models/Setting';
import Visit from '@/models/Visit';
import Place from '@/models/Place';
import Reward from '@/models/Reward';
import Appointment from '@/models/Appointment';

import { timeMixin } from '@/js/time';
import { graphMixin } from '@/js/graph';
import { rewardMixin } from '@/js/reward';
import { spaceMixin } from '@/js/space';
import { warningMixin } from '@/js/warning';
import { redisMixin } from '@/js/redis';

import { success, printJson } from '@/utils/helpers';
import { firstOrNone, allOrNone } from '@/fp/utils.js';
import { Some } from '@/fp/monads/Maybe.js';

export default {
  props: {},

  mixins: [
    graphMixin,
    rewardMixin,
    spaceMixin,
    redisMixin,
    timeMixin,
    warningMixin,
  ],

  computed: {
    oid() {
      return this.settings.oid;
    },
    namespace() {
      return this.settings.namespace;
    },
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
      const { sid, biz, address, country, confirmedAddress } = this.settings;
      return { sid, biz, address, country, confirmedAddress };
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
    ownThePlace({ biz }) {
      // assume the caller of this function pressed the centerMap button on the infowindow
      this.updateSetting({ id: 1, biz, oid: this.$socket.client.auth.userID });
    },

    visitExists(loggedVisitId) {
      console.log(loggedVisitId);
      const x = Visit.query().where('loggedVisitId', loggedVisitId).exists();
      console.log('Visit ID:', loggedVisitId, x ? 'exists' : 'does not exist');
      return x;
    },
    getActualVisits() {
      return Visit.query()
        .where(
          (v) =>
            !(
              !v.start ||
              !v.end ||
              Number.isNaN(v.start) ||
              Number.isNaN(v.end)
            )
        )
        .get();
    },

    getVisits() {
      return Visit.query().all();
    },

    getPlaces() {
      return this.getVisits().map((v) => {
        return { name: v.name, placeID: v.place_id };
      });
    },
    getUnloggedVisits() {
      return Visit.query().where('loggedVisitId', '').get();
    },

    onUpdate({ eventToHandle, deleteVisit }) {
      if (deleteVisit) {
        const id = eventToHandle.id;
        const placeID = eventToHandle.placeID;
        const name = eventToHandle.name;
        const graphID = eventToHandle.loggedVisitId;
        this.deleteVisit(id);
        this.$emit('updatedModel', { placeID, name, id, graphID, deleteVisit });
        return;
      }

      // see time.js
      this.updateVisit(eventToHandle).then((result) =>
        this.$emit('updatedModel', result)
      );
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
    iWorkHere(place_id) {
      console.log(`iWorkHere(${place_id})`);
      this.updateSetting({ id: 1, workplace: place_id });
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

      return Some({
        settings,
        places,
        visits,
        appointments,
      });
    },
    updateUsernumber() {
      // as a date, this permits us to use the usernumber to see how long they've been using LCT
      const userNumber = Date.now();

      this.updateSetting({ id: 1, usernumber: userNumber });
      this.updateState({ settings: { usernumber: userNumber } });
    },

    updateSponsor({ biz, address, country, uid, confirmedAddress, promoText }) {
      const countryLowerCase =
        typeof country === 'string' ? country.toLowerCase() : '';
      this.emitFromClient(
        'addSponsor',
        {
          biz,
          address,
          country: countryLowerCase,
          uid,
          confirmedAddress,
          promoText,
        },
        ({ sid, pid }) => {
          console.log('addSponsor returns:', sid);
          console.log('addPromotion returns:', pid);
          console.log(
            'Model passing',
            biz,
            address,
            country,
            uid,
            confirmedAddress,
            promoText,
            sid,
            pid,
            'to Setting'
          );
          this.updateSetting({
            id: 1,
            biz,
            address,
            country,
            uid,
            confirmedAddress,
            promoText,
            sid,
            pid,
          });
        }
      );
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
    earnReward({ bid, uid }) {
      return new Promise((resolve) => {
        this.emitFromClient('earnReward', { bid, uid }, (visitedOn) => {
          console.log('visitedOn', visitedOn);
          resolve(visitedOn);
        });
      });
    },
    getRewardPoints({ bid, cid }) {
      return new Promise((resolve) => {
        this.emitFromClient('getRewardPoints', { bid, cid }, (visitedOn) => {
          console.log('visitedOn', visitedOn);
          resolve(visitedOn);
        });
      });
    },
    getWarnings() {
      return new Promise((resolve) => {
        this.emitFromClient('getWarnings', null, (warnings) => {
          console.log('warnings', warnings);
          resolve(warnings);
        });
      });
    },
    getAlerts() {
      this.getWarnings().then((alerts) => {
        // alerts is an object of warning objects
        // if (isEmpty(alerts)) {
        //   alert('Whew. No evidence of exposure.');
        //   return null;
        // }
        // check for workplace exposure
        const workplace = this.state.settings.workplace;
        console.log('workplace:>> ', workplace);
        console.log('Alerts:>>', printJson(alerts));
        Object.entries(alerts).forEach(([key, value]) => {
          if (key === workplace) {
            console.log('value[0] :>> ', value[0]);
            const score = value[0].score;
            const reliability = value[0].reliability;
            this.riskScore = { score, reliability };
            alert(
              `You have been exposed to COVID 19 at work ${
                value.length
              } times. \nTypical risk profile:\n${printJson(this.riskScore)}`
            );
          }
        });

        // check for public exposure
      });
    },

    addWarnings({ visitData, score, reliability }) {
      console.log('visitData, score, reliability');
      console.log(visitData, score, reliability);
      return new Promise((resolve) => {
        this.emitFromClient(
          'addWarnings',
          { visitData, score, reliability },
          (warnings) => {
            console.log('warnings', warnings);
            resolve(warnings);
          }
        );
      });
    },
    getVisitByID(id) {
      return Visit.get(id);
    },
    setNamespace(nsp) {
      this.updateSetting({ id: 1, namespace: nsp });
    },
    getNamespace() {
      return this.namespace;
    },
    getAllSettings() {
      const s = Setting.query().all();
      return s.length ? s[0] : s;
    },
    callUpdateRewardPoints({ bid, biz, sid }) {
      this.updateRewardPoints({ bid, biz, sid });
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
      Reward.$fetch(),
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
        ok: () => {
          this.loading = false;
        },
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
      ownThePlace: this.ownThePlace,
      odi: this.oid,
      getAllSettings: this.getAllSettings,

      // Steam events
      enterLottery: this.enterLottery,
      earnReward: this.earnReward,
      getRewardPoints: this.getRewardPoints,
      addWarnings: this.addWarnings,
      getAlerts: this.getAlerts,
      callUpdateRewardPoints: this.callUpdateRewardPoints,
      rewardMap: this.rewardMap,
      rewardingSponsors: this.rewardingSponsors,

      // Space assets in space.js
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
      setNamespace: this.setNamespace,
      getNamespace: this.getNamespace,
      iWorkHere: this.iWorkHere,

      // Time assets
      changeEvent: this.changeEvent,
      onUpdate: this.onUpdate,
      setDefaultGraphName: this.setDefaultGraphName,
      updateLoggedVisitId: this.updateLoggedVisitId,
      getVisits: this.getVisits,
      getPlaces: this.getPlaces,
      visitExists: this.visitExists,
      updateGraphVisit: this.updateGraphVisit,
      getVisitByID: this.getVisitByID,

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
