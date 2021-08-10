<script>
// Model's first job is make a connection to the server in case an Alert awaits// append: Append a value to a key
// Model's second job is to handle local state including ORM entities.
import crypto from 'crypto';
const randomId = () => crypto.randomBytes(8).toString('hex');

import Setting from '@/models/Setting';
import Visit from '@/models/Visit';
import Place from '@/models/Place';
import Appointment from '@/models/Appointment';

import {
  highlight,
  info,
  success,
  warn,
  printJson,
  roundTime,
} from '../../utils/helpers';
import { DateTime, getNow } from '../../utils/luxonHelpers';
import { firstOrNone, allOrNone } from '@/fp/utils.js';
import { Some } from '@/fp/monads/Maybe.js';

export default {
  props: {},

  computed: {
    isDefaultGraph() {
      return this.graphName === this.$defaultGraphName;
    },

    isConnected() {
      return !!this.$socket.connected;
    },
    settings() {
      return Setting.all()[0];
    },
    sessionID() {
      return this.settings?.sessionID;
    },
    username() {
      return this.settings?.username || prompt('User name?');
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
    onUpdate(target, selectedEvent) {
      this.selectedEvent = selectedEvent;
      const f = this[target];
      f();
    },

    cache() {
      Visit.update(this.selectedEvent).then((p) => {
        const msg = {
          type: 'success',
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

      // const self = this;

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
            confirmationColor: 'success',
            confirmationMessage: `${name} logged to ${data.useGraphName} on node ${data.loggedNodeId}`,
          };
          this.$emit('updatedModel', msg);
        })
        .catch((err) => {
          this.$emit('error', err);
        });
      // .then((node) => {
      //   // here's where we update the logged field to the id of the graph node
      //   const data = {
      //     visitId: id,
      //     loggedNodeId: node.id,
      //     useGraphName: self.getGraphName(),
      //   };
      //   Visit.updateById(data).then((v) => {
      //     console.log(success(`Returned Visit:`, printJson(v)));
      //     console.log(highlight(`Updated Visit to:`, printJson(visit)));
      //   });
      //   const msg = {
      //     confirmationColor: 'success',
      //     confirmationMessage: `${name} logged to ${self.getGraphName()} on node ${
      //       node.id
      //     }`,
      //   };
      //   return msg;
      // });
    },

    redisGraphCallback: (results) => {
      console.log(success('updateVisitOnGraph results:', printJson(results)));
      return results;
    },

    // updateVisitOnGraph(query) {
    //   console.log('query to update graph:', printJson(query));

    //   Promise.resolve(() => {
    //     // send message to server
    //     this.emitFromClient('logVisit', query, this.redisGraphCallback);
    //   })
    //     .toEither()
    //     .cata({
    //       ok: console.log,
    //       error: (e) => console.log(`error: ${e}`),
    //     });
    // },

    emitFromClient(eventName, data, ack) {
      if (!this.isConnected) {
        this.$emit('updatedModel', {
          confirmationColor: 'orange',
          confirmationMessage: 'Model not updated. Graph not connected.',
        });
        return;
      }
      this.$socket.client.emit(eventName, data, ack);
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
    onLogVisitOrig(visit) {
      // you can keep a guard here, but the Log button on Calendar should not be enabled if not connected.
      if (!this.$socket.connected) {
        const msg = {
          type: 'warning',
          confirmationColor: 'orange',
          confirmationMessage: `You are not connected to the server`,
        };
        return msg;
      }
      const self = this;
      console.log(highlight(`App.js: Visit to process: ${printJson(visit)}`));

      const { id, name, start, end, loggedNodeId, graphName, interval } = visit;
      // this.selectedSpace = visit;
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

      // send the visit to the server
      this.updateVisitOnGraph(query).then((node) => {
        // here's where we update the logged field to the id of the graph node
        const data = {
          visitId: id,
          loggedNodeId: node.id,
          useGraphName: self.getGraphName(),
        };
        Visit.updateById(data).then((v) => {
          console.log(success(`Returned Visit:`, printJson(v)));
          console.log(highlight(`Updated Visit to:`, printJson(visit)));
        });
        const msg = {
          confirmationColor: 'success',
          confirmationMessage: `${name} logged to ${self.getGraphName()} on node ${
            node.id
          }`,
        };
        return msg;
      });
    },

    // TODO this is a good reason to refactor Place to include Visits
    /**
     * Makers let us revisit a place.
     * Iterate visits entity
     * Find place using visit.place_id
     * Use filtered places to add Markers to map (map passed in to event handler)
     */

    deserializeVisitAsMarker(visits) {
      if (!visits) {
        return;
      }

      // TODO Refactor for Model
      this.place_map = this.state.place.getPlaceMap();
      this.markersMap = new Map();
      console.groupCollapsed(
        warn(
          `deserializeVisitAsMarker(visits) making ${visits.length} markers:`
        )
      );
      if (visits) {
        this.visitSet = new Set(visits);
        visits.forEach((visit, index) => {
          if (!visit.place_id) {
            // these are appointments not visits
            return;
          }
          const place = this.place_map.get(visit.place_id);
          // if visit and place are not related, notify and skip further processing
          if (!place) {
            alert(
              `Visit ${visit.id} does not have a Place corresponding to ${visit.place_id}`
            );
            return;
          }

          console.log('Using place:', printJson(place));
          let m = {
            title: visit.name,
            label: { text: 'V' + index, color: 'white' },
            name: visit.name,
            place_id: visit.place_id,
            position: { lat: place.lat, lng: place.lng },
          };
          this.markersMap.set(visit.name, m);
          this.$emit('log', `added marker for ${visit.name}`);
        });
        console.groupEnd();
      }
    },

    onMarkerClicked(marker) {
      this.selectedMarker = marker;
      this.updateState({ currentPlace: marker.name });
    },
    onToWork() {},
    // called by
    //  * onGo() with the shift startTime or
    //  * Visit button in Googlemaps
    onVisitPlace() {
      const place = Place.find(this.selectedMarker.place_id);
      const starttime = roundTime(Date.now());
      const endtime = starttime + this.avgStay;
      const visit = {
        id: randomId(),
        name: place.name,
        place_id: place.place_id,
        start: starttime,
        end: endtime,
        date: DateTime.fromMillis(starttime).toISODate(),
        category: 'You',

        timed: true,
        marked: getNow(),
        graphName: this.graphname,
        loggedNodeId: '', // this will contain the internal id of the relationship in redisGraph

        // TODO setup isDefaultGraph
        color: this.isDefaultGraph ? 'secondary' : 'sandboxmarked',
      };

      // TODO NOTE: For then() to work up here, Visit.update() must return the $create() Promise.
      Visit.update(visit).then((visits) => {
        this.updateState(visits);
        this.$router.push({
          name: 'Time',
        });
      });
    },

    onMakeAppointment() {
      alert('Under construction');
    },

    onMarkerAdded(place) {
      Place.updatePromise(place).then((result) => {
        this.$emit('cacheUpdated', result[0]);
      });
    },

    onDeletePlace(placeId) {
      Place.delete(placeId);
    },

    // TODO this is 1/2 the refactore to reduce the load on Spaces component
    addPlace(payload) {
      const { place, placesService, fields } = payload;
      placesService.getDetails(
        {
          placeId: place.placeId,
          fields: fields,
        },
        (place, status) => {
          if (status === 'OK') {
            // getDetails() returns the place
            Place.updatePromise(place).then((result) => {
              this.$emit('cacheUpdated', result[0]);
            });
          } else {
            throw new Error('GoogleMap.addPlaceWithID(space)', status);
          }
        }
      );
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

      console.info(warn('data:', JSON.stringify(data, null, 3)));
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
      console.log('Updated state:');
      console.log(printJson(this.state));
    },

    //deprecated. Visit and Appointment handle deleting old entries
    validateEntities() {
      // ensure we have identifiable entities that have valid start and end dates
      Visit.validateVisits().then((invalidVisits) => {
        if (invalidVisits.length > 0) {
          console.groupCollapsed(warn('Invalid visit(s):'));
          console.log(printJson(invalidVisits));
        }
        console.groupEnd();
      });
      Appointment.validateAppointments().then((invalidAppointments) => {
        if (invalidAppointments.length > 0) {
          console.groupCollapsed(warn('Invalid appointments:'));
          console.log(printJson(invalidAppointments));
        }
        console.groupEnd();
      });
    },

    mountedPrototype() {
      // We are dealing here with and array. reference object element only with ok map:
      Visit.$fetch()
        .map((response) => response) //this is promise map. here we pass the identity monad.
        .toEither()
        .map((all) => all.visits) //this is Either map
        .matchWith({
          // firstOrNone is a utility function for arrays to fetch the first element or a None.
          ok: (v) => firstOrNone(v).map(console.log),
          error: (err) => {
            // let global error handler take over so we see the error in the snackbar.
            this.$emit('error', {
              err,
            });
          },
        });
    },

    getSomeEntityData(source) {
      return (
        allOrNone(source)
          // .inspect(`${v[0].constructor.name}:\n`)
          .inspect()
          .match({
            Some: (v) => v,
            None: () => [],
          })
      );
    },

    getFirstEntityData(source) {
      return firstOrNone(source)
        .inspect()
        .match({
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
    manageData(entities) {
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
      this.connectMe();
    },
  },

  // strictly speaking, Promise.all() returns a promise, so we could use EitherAsync here, as well...
  // so that's why we use mounted() below
  mountedBigly() {
    const self = this;
    Promise.all([
      Setting.$fetch(),
      Place.$fetch(),
      Visit.$fetch(),
      Appointment.$fetch(),
    ])

      .then((entities) => {
        const [allSettings, allPlaces, allVisits, allAppointments] = entities;

        const settings = self.getFirstEntityData(allSettings.settings);

        const places = self.filterSomeEntityData(
          (v) => v.name,
          allPlaces.places
        );

        const visits = self.filterSomeEntityData(this.filter, allVisits.visits);

        const appointments = self.getSomeEntityData(
          allAppointments.appointments
        );

        self.updateState({
          settings,
          places,
          visits,
          appointments,
        });

        self.connectMe();
        self.loading = false;
      })
      .catch((err) => {
        throw err;
      });
  },

  mounted() {
    Promise.all([
      Setting.$fetch(),
      Place.$fetch(),
      Visit.$fetch(),
      Appointment.$fetch(),
    ])
      .toEither()
      .map((entities) => this.manageData(entities))
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
      onDeletePlace: this.onDeletePlace,

      // Time assets
      changeEvent: this.changeEvent,
      onUpdate: this.onUpdate,
    });
  },
};
</script>
