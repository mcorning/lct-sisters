<script>
export default {
  props: {
    initialState: {
      type: Object,
    },
  },

  data() {
    return {
      // We can initialize our state using the
      // prop `initialState`
      state: this.initialState,
      isConnected: false,
    };
  },
  sockets: {
    /*
     * 👂 Listen to socket events emitted from the socket server
     */
    connect() {
      console.log('Connected to the socket server.');
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
      console.group('Handling Session event from Server');

      Setting.updatePromise({ data: { id: 1, sessionID, userID, username } });
      // attach the session ID to the next reconnection attempts
      this.$socket.client.auth = { sessionID };
      this.sessionID = sessionID;
      console.log(success('Session ID', this.sessionID));

      // save the ID of the user
      // TODO isn't userID already assigned in middleware? and why assign to client instead of .auth?
      this.$socket.client.userID = userID;
      this.userID = userID;
      console.log('User ID:', this.userID);

      this.username = username;
      console.log('User Name:', this.username);

      // sessions always load with the configured exposure graph
      // setting the current graph to Sandbox only happens after connecting to the server
      this.graphName = graphName;
      console.log('graphName used by redis', this.graphName);

      console.groupEnd();
    },

    // Exposure dialogs
    alertPending() {
      this.alertPending = true;
    },

    exposureAlert(alert, ack) {
      this.exposureAlert = true;
      this.alertText = alert;
      if (ack) {
        ack(this.$socket.client.id);
      }
      this.auditor.logEntry(alert, 'Alert');
    },
  },

  methods: {
    update(newState) {
      // Copy all properties from newState on to
      // this.state, overriding anything on this.state
      this.state = { ...this.state, ...newState };
    },
  },

  render() {
    // Pass our state and the update function into
    // our scoped slot so we can render children.
    return this.$scopedSlots.default({
      state: this.state,
      update: this.update,
    });
  },
};
</script>
