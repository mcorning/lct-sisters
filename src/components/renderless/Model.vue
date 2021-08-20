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

import { highlight, info, success, warn, printJson } from '../../utils/helpers';
import { getNow } from '../../utils/luxonHelpers';
import { firstOrNone, allOrNone } from '@/fp/utils.js';
import { Some } from '@/fp/monads/Maybe.js';

export default {
  props: {},

  mixins: [graphMixin, spaceMixin, timeMixin],

  computed: {
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
      graphName: this.$defaultGraphName,
      // TODO send this data down to Calendar
      /* combinations of update
       *   Add Visit (category==='You')
       *   Add Appointment (category==='Them')
       *   Update Visit field (category==='You' || id)
       *   Update Appointment field (category==='Them' || id)
       *   Delete Appointment (category==='Them')
       *   Delete Visit (category==='You')
       */
      actions: {
        isDay: {
          add: (data, f) => Visit.updatePromise(data, f),
          update: (data, f) => Visit.updateFieldPromise(data, f),
          delete: (data, f) => Visit.deletePromise(data, f),
        },
        isCategory: {
          add: (data, f) => Appointment.updatePromise(data, f),
          update: (data, f) => Appointment.updateFieldPromise(data, f),
          delete: (data, f) => Appointment.deletePromise(data, f),
        },
      },
    };
  },
  sockets: {
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

      this.updateState({ sessionID, userID, username });

      const data = { data: { id: 1, sessionID, userID, username } };
      Setting.update(data);

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
      this.pendingVisits.forEach((value, key) => {
        console.log('Logging pending visit:', key);
        this.emitFromClient('logVisit', value);
      });
    },

    exposureAlert(msg) {
      alert(msg);
    },
  },

  methods: {
    // TODO has this abstract approach been superseded by time.js and space.js?
    onUpdate(target, selectedEvent) {
      this.selectedEvent = selectedEvent;
      const f = this[target];
      f();
    },

    cache() {
      // TODO aren't we using monads now?
      Visit.update(this.selectedEvent).then((p) => {
        const msg = {
          logged: false,
          confirmationColor: 'success',
          confirmationMessage: `Updated visit to ${p.name}`,
        };
        this.$emit('updatedModel', msg);
      });
    },
    graph() {
      this.onLogVisit(this.selectedEvent);
    },

    onLogVisit(visit) {
      console.log(highlight(`App.js: Visit to process: ${printJson(visit)}`));

      const { id, name, start, end, loggedNodeId, graphName, interval } = visit;
      const query = {
        username: this.username,
        userID: this.$socket.client.userID,
        selectedSpace: name,
        start: start,
        end: end,
        date: new Date(start).toDateString(),
        interval: interval,
        loggedNodeId,
        graphName,
      };
      console.log(highlight(`App.js: Visit query: ${printJson(query)}`));

      // send the visit to the server
      this.updateVisitOnGraph(query)
        .then((redisResult) => {
          if (!redisResult.logged || !redisResult.id) {
            throw new Error(`Redis could not log Visit to  ${name}`);
          }
          const data = {
            visitId: id,
            loggedNodeId: redisResult.id,
            useGraphName: redisResult.graph,
          };
          console.log('updateVisitOnGraph() data:', data);
          Visit.updateById(data);
          const msg = {
            logged: true,
            confirmationColor: 'success',
            confirmationMessage: `${name} logged to ${data.useGraphName} on node ${data.loggedNodeId}`,
          };
          this.$emit('updatedModel', msg);
        })
        .catch((err) => {
          this.$emit('error', err);
        });
    },

    updateVisitOnGraph(query) {
      console.log('query to update graph:', printJson(query));
      return new Promise((resolve, reject) => {
        // send message to server
        try {
          this.emitFromClient(
            'logVisit',
            query,
            // and handle the callback
            (results) => {
              console.log(
                success('updateVisitOnGraph results:', printJson(results))
              );
              resolve(results);
            }
          );
        } catch (error) {
          reject(error);
        }
      });
    },

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

    getGraphName() {
      return this.graphName || this.$defaultGraphName;
    },

    // why are we passing in a payload when Model gets that itself from the server?
    // const { username, userID, sessionID } = payload;    // connectMe(payload) {
    connectMe() {
      if (this.isConnected) {
        return 'Already connected';
      }
      const settings = Setting.getSettings()
        ? Setting.getSettings()
        : { username: prompt('Username?') };
      const { username, userID, sessionID } = settings;

      const data = {
        username,
        userID,
        sessionID,
        id: 1,
      };
      if (this.$DEBUG) {
        console.info(warn('data:', JSON.stringify(data, null, 3)));
      }
      Setting.update(data);

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
  },

  watch: {
    loading() {
      console.log(success('\tMODEL mounted'));
      console.log('Visits: ', this.state.visits.length);
      this.connectMe();
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
    // so we can render children with Model data.
    // Step 1: Expose all data and methods that could be used by dynamic components
    return this.$scopedSlots.default({
      // Global assets
      state: this.state,
      isConnected: this.isConnected,

      onConnectMe: this.onConnectMe,

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

      //Warning assets
      visitCount: this.visitCount,
      hasVisits: this.hasVisits,
    });
  },
};
</script>
