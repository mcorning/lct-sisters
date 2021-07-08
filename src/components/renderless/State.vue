<script>
import Setting from '@/models/Setting';
import Visit from '@/models/Visit';
import Place from '@/models/Place';
import Appointment from '@/models/Appointment';

import { err, info, success, warn, printJson } from '../../utils/colors';

export default {
  props: {
    initialState: {
      type: Object,
    },
  },

  computed: {
    settings() {
      return Setting.all()[0];
    },
    sessionID() {
      return this.settings?.sessionID;
    },
    username() {
      return this.settings?.username || 'default';
    },
  },

  data() {
    return {
      // We can initialize our state using the
      // prop `initialState`
      state: this.initialState,
    };
  },
  sockets: {
    /*
     * 👂 Listen to socket events emitted from the socket server
     */
    connect() {
      console.log(success('Connected to the socket server.'));
      this.isConnected = true;
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
      console.log('Entire State:', ...this.state);
      console.groupEnd();
    },
  },

  methods: {
    onConnectMe(payload) {
      const { username, userID, sessionID } = payload;
      if (!username) {
        console.log(warn('No username yet. Let us get them signed up...'));
        return;
      }

      const data = { data: { ...payload, id: 1 } };

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
        : `Step 1: first server contact with ${username}. Awaiting reply in session event..`;
      console.log(info(msg));
      this.$socket.client.open();
    },

    update(newState) {
      // Copy all properties from newState on to
      // this.state, overriding anything on this.state
      this.state = { ...this.state, ...newState };
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

  mounted() {
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

        console.log(success('mounted State component'));
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
    // Pass *all* our props and function into our scoped slot
    // so we can render children with State data.
    return this.$scopedSlots.default({
      state: this.state,
      update: this.update,
      onConnectMe: this.onConnectMe,
    });
  },
};
</script>
