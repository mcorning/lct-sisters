<script>
// State's first job is make a connection to the server in case an Alert awaits// append: Append a value to a key
// State's second job is to handle local state including ORM entities.

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
  getNow,
  printJson,
} from '../../utils/colors';

export default {
  props: {},

  computed: {
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
    visits() {
      return Visit.all().visits;
    },
  },

  data() {
    return {
      state: {},
      pendingVisits: new Map(),
      loading: true,
      graphName: '',
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

      this.update({ sessionID, userID, username });

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
      console.log('Entire State:', this.state);
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
    getGraphName() {
      return this.graphName || this.$defaultGraphName;
    },

    logVisit(visit) {
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

    // why are we passing in a payload when State gets that itself from the server?
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

    update(newState) {
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
    throwError(payload) {
      const { source, error, comment } = payload;
      const msg = `ERROR: ${error.message} at ${source} (${comment})`;
      console.error(msg);
      this.snackBarText = msg;
      this.showSnackbar = true;
      this.$emit('error', {
        payload,
      });
    },
  },

  async mounted() {
    const self = this;
    Promise.all([
      Place.$fetch(),
      Visit.$fetch(),
      Appointment.$fetch(),
      Setting.$fetch(),
    ])
      .then((entities) => {
        const places = entities[0].places || [];
        const visits = entities[1].visits || [];
        const appointments = entities[2].appointments || [];
        // there is only one settings array element
        const settings = entities[3].settings[0] || [];

        self.update({ places, visits, appointments, settings });

        self.validateEntities();

        self.connectMe();
        console.log(success('mounted State component'));
        self.loading = false;
      })
      .catch((err) =>
        this.throwError({
          source: 'Calendar.mounted()',
          error: err,
          comment: 'This is bad.',
        })
      );
  },

  render() {
    // The first user of State will not see data if we render() while loading
    if (this.loading) {
      return { loading: this.loading };
    }

    // Pass *all* our props and function into our scoped slot
    // so we can render children with State data.
    // Step 1: Expose all data and methods that could be used by dynamic components
    return this.$scopedSlots.default({
      state: this.state,
      isConnected: this.isConnected,
      logVisit: this.logVisit,
    });
  },
};
</script>
