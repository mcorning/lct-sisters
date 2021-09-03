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

import { highlight, info, success, warn, printJson } from '../../utils/helpers';
import { getNow } from '../../utils/luxonHelpers';
import { firstOrNone, allOrNone } from '@/fp/utils.js';
import { Some } from '@/fp/monads/Maybe.js';
import { head } from 'pratica';

export default {
  props: {},

  mixins: [graphMixin, spaceMixin, timeMixin, warningMixin],

  computed: {
    // preferredGraphName() {
    //   return this.state.settings.preferredGraph;
    // },

    needsUsername() {
      return !this.state.settings.username;
    },

    unloggedVisits() {
      return this.visits.filter((v) => !v.loggedNodeId);
    },

    hasUnloggedVisits() {
      return this.unloggedVisits.length;
    },

    isDefaultGraph() {
      return this.graphName === this.$defaultGraphName;
    },

    isConnected() {
      return !!this.$socket.connected;
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
    username() {
      return this.settings.username || prompt('User name?');
    },
  },

  data() {
    return {
      avgStay: 1000 * 60 * 30,
      state: {},
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
  sockets: {
    // emitted by server with status of update (success or failure)
    // TODO NOTE: this is one other use case where we wrap a function in a Promise as an EitherAsync
    visitLogged(redisResult) {
      const getahead = (updateResults) => {
        head(updateResults).cata({
          Just: (updateResult) => this.$emit('updatedModel', updateResult),
          Nothing: (updateResult) => this.$emit('updatedModel', updateResult),
        });
      };

      new Promise((resolve, reject) => {
        this.updateLoggedNodeId({ redisResult, resolve, reject });
      })
        .toEither()
        .cata({
          ok: (updateResults) => getahead(updateResults),
          error: (err) => {
            console.log(err, 'Issues in logging visit to graph()');
          },
        });
    },
    // visitLoggedPreFp(redisResult) {
    //   console.log('redisResult', redisResult);
    //   const { id, place, graphName, visitId, logged } = redisResult;
    //   console.log(id, logged);
    //   if (!logged || id < 0) {
    //     this.$emit(
    //       'error',
    //       new Error(`Redis could not log Visit to  ${place}`)
    //     );
    //   }
    //   const data = {
    //     visitId: visitId,
    //     loggedNodeId: id,
    //     graphName,
    //     color: 'primary', // use parameter if we need a different color for Sandbox graph
    //   };
    //   console.log('updateVisitOnGraph() data:', data);
    //   this.updateLoggedNodeId(data);
    //   const msg = {
    //     logged: true,
    //     confirmationColor: 'success',
    //     confirmationMessage: `${place} logged to ${data.graphName} graph on node ${data.loggedNodeId}`,
    //   };
    //   console.log('emitting updatedModel with:', msg);
    //   this.$emit('updatedModel', msg);
    // },

    /*
     * 👂 Listen to socket events emitted from the socket server
     */
    connect() {
      console.log(getNow());
      console.log(success('Connected to the socket server.\n'));
    },

    // sent from Server after Server has all the data it needs to register the Visitor
    // TODO better style uses a single object as arg. function deconstructs vars.
    //    socket.emit('session', {
    //        sessionID,
    //        userID,
    //        username,
    //        graphName,
    //    });
    session({ sessionID, userID, username, graphName }) {
      console.assert(
        sessionID && userID && username,
        `Session event missing args: ${sessionID} ${userID} ${username}`
      );

      // TODO Not good: you are updating the state var before you update the entity. what if the entity fails?
      this.updateState({ sessionID, userID, username, graphName });
      const data = { id: 1, sessionID, userID, username };
      // TODO Not good: How do you know the update succeeded?
      // Setting.update(data);
      this.updateSetting(data);

      // attach the session session data to the next reconnection attempts
      console.log(
        info(
          'Socket auth before update in session():',
          printJson(this.$socket.client.auth)
        )
      );
      this.$socket.client.auth = {
        username,
        userID,
        sessionID,
      };
      console.log(
        info(
          'Socket auth after update in session():',
          printJson(this.$socket.client.auth)
        )
      );

      // attach the userID to the client object for easy reference on server
      this.$socket.client.userID = userID;

      console.group(info('Step 2:Handling Session event from Server: >'));
      console.log(success('Session ID', sessionID));
      console.log(success('User Name:', username));
      console.log(success('User ID:', userID));
      console.log(success('graphName used by redis', graphName));
      console.log('Entire Model:', this.state);
      console.groupEnd();
      // TODO Are we still using pendingVisits here? or are we doing that in Warning.vue?
      this.pendingVisits.forEach((value, key) => {
        console.log('Logging pending visit:', key);
        this.emitFromClient('logVisit', value);
      });
    },

    exposureAlert(msg) {
      alert(msg + '\nWorking on snackbar or banner');
    },
  },

  methods: {
    onExposureWarning(reason) {
      this.emitFromClient('exposureWarning', reason);
    },

    // TODO has this abstract approach been superseded by time.js and space.js?
    onUpdate(target, selectedEvent) {
      this.selectedEvent = selectedEvent;
      const f = this[target];
      f();
    },

    cache() {
      // TODO aren't we using monads now?
      this.updateVisit(this.selectedEvent);
      // TODO isn't updateVisit async
      // this.$emit('updatedModel', msg);
    },
    // called by Calendar when logging a Visit
    graph() {
      this.onLogVisit(this.selectedEvent);
    },

    // called when there are unlogged visits
    logVisits() {
      const x = this.unloggedVisits.length;
      this.unloggedVisits.forEach((visit) => {
        this.onLogVisit(visit);
      });
      return `Logged ${x} visits.`;
    },

    // NOTE: compared to the original onLogVisit(), reducing LOC from 40 to 10 is admirable
    // and far easier to reason over and maintain
    onLogVisit(visit) {
      const { id, name, start, end } = visit;
      const query = {
        visitId: id,
        place: name,
        start: start,
        end: end,
        graphName: this.getGraphName(),
        userID: this.$socket.client.userID,
      };
      console.log(highlight(`Model.vue's Visit query: ${printJson(query)}`));
      this.emitFromClient('logVisit', query);
    },

    // onLogVisitOrig(visit) {
    //   console.log(highlight(`App.js: Visit to process: ${printJson(visit)}`));

    //   const { id, name, start, end, loggedNodeId, graphName, interval } = visit;
    //   const query = {
    //     username: this.username,
    //     userID: this.$socket.client.userID,
    //     selectedSpace: name,
    //     start: start,
    //     end: end,
    //     date: new Date(start).toDateString(),
    //     interval: interval,
    //     loggedNodeId,
    //     graphName,
    //   };
    //   console.log(highlight(`App.js: Visit query: ${printJson(query)}`));

    //   // send the visit to the server
    //   this.updateVisitOnGraph(query)
    //     .then((redisResult) => {
    //       if (!redisResult.logged || !redisResult.id) {
    //         this.$emit('error', new Error(`Redis could not log Visit to  ${name}`));
    //       }
    //       const data = {
    //         visitId: id,
    //         loggedNodeId: redisResult.id,
    //         graphName: redisResult.graph,
    //       };
    //       console.log('updateVisitOnGraph() data:', data);
    //       Visit.updateById(data);
    //       const msg = {
    //         logged: true,
    //         confirmationColor: 'success',
    //         confirmationMessage: `${name} logged to ${data.graphName} on node ${data.loggedNodeId}`,
    //       };
    //       this.$emit('updatedModel', msg);
    //     })
    //     .catch((err) => {
    //       console.log(err);
    //       this.$emit('error', err);
    //     });
    // },

    // updateVisitOnGraph(query) {
    //   console.log('query to update graph:', printJson(query));
    //   return new Promise((resolve, reject) => {
    //     // send message to server
    //     try {
    //       this.emitFromClient(
    //         'logVisit',
    //         query,
    //         // and handle the callback
    //         (results) => {
    //           console.log(
    //             success('updateVisitOnGraph results:', printJson(results))
    //           );
    //           resolve(results);
    //         }
    //       );
    //     } catch (error) {
    //       reject(error);
    //     }
    //   });
    // },

    redisGraphCallback: (results) => {
      console.log(success('updateVisitOnGraph results:', printJson(results)));
      return results;
    },

    emitFromClient(eventName, data, ack) {
      if (!this.isConnected) {
        this.$emit('updatedModel', {
          logged: false,
          confirmationColor: 'orange',
          confirmationMessage: 'Model not updated. Graph not connected.',
        });
        return;
      }
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

    // why are we passing in a payload when Model gets that itself from the server?
    // const { username, userID, sessionID } = payload;    // connectMe(payload) {
    connectMe() {
      if (this.isConnected) {
        return 'Already connected';
      }
      if (this.needsUsername) {
        return 'Need username';
      }

      const { username, userID, sessionID } = this.state.settings;

      const data = {
        username,
        userID,
        sessionID,
        id: 1,
      };
      if (this.$DEBUG) {
        console.info(warn('data:', JSON.stringify(data, null, 3)));
      }
      // Setting.update(data);
      this.updateSetting(data);

      this.$socket.client.auth = {
        username,
        userID,
        sessionID,
      };
      const msg = sessionID
        ? `${username} connected to server with session ${sessionID}`
        : `Step 1: first server contact with ${username}. Awaiting reply in session event for sessionID and userID.`;
      this.$socket.client.open();
      return msg;
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
    updateUsername(username) {
      this.updateSetting({ id: 1, username: username });
      this.updateState({ settings: { username: username } });
    },
  },

  watch: {
    loading() {
      console.log(success('\tMODEL mounted'));
      console.log('Visits: ', this.state.visits.length);
      console.log('Default Graph:', this.getGraphName());
      this.connectMe();
    },
    'state.settings.lastVaccinationDate'(n) {
      console.log(n);
      this.updateSetting({ id: 1, lastVaccinationDate: n });
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
      needsUsername: this.needsUsername,
      updateUsername: this.updateUsername,
      state: this.state,
      updateState: this.updateState,
      isConnected: this.isConnected,
      isDefaultGraph: this.isDefaultGraph,
      connectMe: this.connectMe,

      // Space assets
      onMarkerClicked: this.onMarkerClicked,
      onMarkerAdded: this.onMarkerAdded,
      onToWork: this.onToWork,
      onVisitPlace: this.onVisitPlace,
      onMakeAppointment: this.onMakeAppointment,
      onShareGathering: this.onShareGathering,
      onDeletePlace: this.onDeletePlace,

      // Time assets
      changeEvent: this.changeEvent,
      onUpdate: this.onUpdate,
      getGraphName: this.getGraphName,
      changeGraphName: this.changeGraphName,
      setDefaultGraphName: this.setDefaultGraphName,

      //Warning assets
      visitCount: this.visitCount,
      hasVisits: this.hasVisits,
      hasUnloggedVisits: this.hasUnloggedVisits,
      logVisits: this.logVisits, // takes an array of visits as input
      onExposureWarning: this.onExposureWarning,
    });
  },
};
</script>
