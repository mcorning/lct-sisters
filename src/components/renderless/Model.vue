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
  err,
  highlight,
  info,
  success,
  warn,
  printJson,
  roundTime,
} from '../../utils/helpers';
import { DateTime, getNow } from '../../utils/luxonHelpers';

export default {
  props: {},

  computed: {
    isDefaultGraph() {
      return this.graphName === this.$defaultGraphName;
    },

    relevantEvents() {
      // TODO should this property include all visits or only those for the selected day?
      const x = [...this.state.visits, ...this.state.appointments];
      return x;
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
      return this.settings?.username || '';
    },
  },

  data() {
    return {
      avgStay: 1000 * 60 * 30,
      state: {},
      selectedMarker: null,
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
      Setting.updatePromise(data)
        .then((s) => {
          console.info(
            info('Settings after session() event update:', printJson(s))
          );
        })
        .catch((e) => {
          console.error(err(printJson(e)));
        });

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
    onUpdateVisit(visit) {
      console.log(visit);
    },

    onLogVisit(payload) {
      const { action, visit } = payload;
      if (action === 'test') {
        return 'Funtion (onLogVisit) test passed';
      }
      const self = this;
      // TODO There's no UI here. Use a Maybe monad, instead.
      // you can keep a guard here, but the Log button on Calendar should not be enabled if not connected.
      if (!this.$socket.client.userID) {
        const msg = {
          confirmationColor: 'orange',
          confirmationMessage: `You are not connected to the server`,
        };
        return msg;
      }
      const { id, name, start, end, loggedNodeId, graphName, interval } = visit;
      console.log('What is visit.id?', id);
      this.selectedSpace = visit;
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
      console.log(highlight(`App.js: Visit to process: ${printJson(visit)}`));
      console.log(highlight(`App.js: Visit query: ${printJson(query)}`));

      // send the visit to the server
      this.updateVisitOnGraph(query).then((node) => {
        // here's where we update the logged field to the id of the graph node
        const data = {
          visitId: id,
          loggedNodeId: node.id,
          useGraphName: self.getGraphName(),
        };
        Visit.updateLoggedPromise(data).then((v) => {
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
    /**
     * Makers let us revisit a place.
     * Iterate visits entity
     * Find place using visit.place_id
     * Use filtered places to add Markers to map (map passed in to event handler)
     */ // TODO this is a good reason to refactor Place to include Visits
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

      Visit.updatePromise({ visit }).then((visits) => {
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

    funcx(payload) {
      const { action, entity } = payload;
      if (action === 'test') {
        return 'Funtion (funcx) test passed';
      }
      const first = entity.category === 'You' ? 'isDay' : 'isCategory';
      const second = action;
      const fun = this.actions[first][second];
      fun();
    },

    getGraphName() {
      return this.graphName || this.$defaultGraphName;
    },

    updateVisitOnGraph(query) {
      console.log('query to update graph:', printJson(query));
      return new Promise((resolve) => {
        this.emitFromClient('logVisit', query, (results) => {
          console.log(
            success('updateVisitOnGraph results:', printJson(results))
          );
          resolve(results);
        });
      });
    },

    // TODO Next fix: restore the callback so we can update the Visit record with the graphNodeID
    emitFromClient(eventName, data, ack) {
      if (!this.connected) {
        // const { username, userID, sessionID } = this.settings;
        this.connectMe(); //{ username, userID, sessionID });
      }
      this.$socket.client.emit(eventName, data, ack);
    },

    // why are we passing in a payload when Model gets that itself from the server?
    // const { username, userID, sessionID } = payload;    // connectMe(payload) {
    connectMe() {
      if (this.isConnected) {
        return 'Already connected';
      }
      const { username, userID, sessionID } = this.settings;

      if (!username) {
        console.log(warn('No username yet. Let us get them signed up...'));
        return;
      }

      const data = {
        data: {
          username,
          userID,
          sessionID,
          id: 1,
        },
      };

      console.info(warn('data:', JSON.stringify(data, null, 3)));
      Setting.updatePromise(data)
        .then((s) => {
          console.info(
            info('Settings after connectMe() update:', printJson(s))
          );
        })
        .catch((e) => {
          console.error(err(printJson(e)));
        });

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
      this.state = { ...this.state, ...newState };
      console.log(this.state);
    },

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
  },

  watch: {},

  mounted() {
    const self = this;
    Promise.all([
      Place.$fetch(),
      Visit.$fetch(),
      Appointment.$fetch(),
      Setting.$fetch(),
    ])
      .then((entities) => {
        const places = entities[0].places.filter((v) => v.name) || [];
        const visits =
          entities[1].visits?.filter(
            (v) =>
              !(
                Number.isNaN(v.end) ||
                Number.isNaN(v.start) ||
                !v.id ||
                v.id.startsWith('$')
              )
          ) || [];
        const appointments = entities[2].appointments || [];
        // there is only one settings array element
        const settings = entities[3].settings[0] || [];

        self.updateState({ places, visits, appointments, settings });

        self.validateEntities();

        self.connectMe();
        console.log(success('mounted Model component'));
        self.loading = false;
        this.$emit('stateAvailable', this.funcx);
      })
      .catch((err) => {
        throw err;
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
      state: this.state,
      onMarkerClicked: this.onMarkerClicked,
      onMarkerAdded: this.onMarkerAdded,
      onToWork: this.onToWork,
      onVisitPlace: this.onVisitPlace,
      onMakeAppointment: this.onMakeAppointment,
      relevantEvents: this.relevantEvents,
      isConnected: this.isConnected,
      onLogVisit: this.onLogVisit,
      onDeletePlace: this.onDeletePlace,
      changeEvent: this.changeEvent,
      onUpdateVisit: this.onUpdateVisit,
    });
  },
};
</script>
