/**
 * This server connects Visitors with the Virus Exposure Graph hosted on RedisGraph.
 * Firsttime handshake protocol follows:
 *    1) App.vue sends a message to Server with username
 *    2) Server middleware creates new sessionID and userID
 *    3) Handsoff to connect()
 *    4) Server returns sessionID, userID, and username to Visitor
 *
 *  Subsequent visits:
 *    1) App.vue sends a message to Server with username and sessionID
 *    2) If middleware has a record of past connection, hand off to connect()
 *    2) Otherwise follow initial handshake at step 2 above.
 */

//#region Setup
const path = require('path');
const express = require('express');
const socketIO = require('socket.io');
const serveStatic = require('serve-static');
const crypto = require('crypto');
const randomId = () => crypto.randomBytes(8).toString('hex');
const {
  printJson,
  err,
  warn,
  highlight,
  info,
  success,
  special,
  url,
  printNow,
  getNow,
} = require('../src/utils/helpers.js');

const PORT = process.env.PORT || 3003;
const dirPath = path.join(__dirname, '../dist');

const { Cache } = require('../CacheClass');

const alertsCache = new Cache('../alerts.json');
const errorCache = new Cache('../errors.json');
const feedbackCache = new Cache('../feedback.json');

//#region Redis setup
const {
  graphName, // mapped to client nsp (aka namespace or community name)
  host,
  deleteVisit,
  findExposedVisitors,
  changeGraph,
  logVisit,
  onExposureWarning,
} = require('../redis');

const cache = require('../redisJsonCache');

// high-order function to handle safe creation of sessions cache
let setCache = function(key, path, node) {
  return cache.create(key, path, node).then(() => {
    setCache = function(key, path, node) {
      return cache.add(key, path, node);
    };
    return setCache;
  });
};
//#endregion

console.log(getNow());
console.log('RedisGraph host:', host);
console.log('social graph:', special(graphName), '\n');

const server = express()
  .use(serveStatic(dirPath))
  .listen(PORT, () => {
    printNow();
    console.log('Listening on:');
    console.log('\t\t', url(`http://localhost:${PORT}`, '\t\n'));
  });
const io = socketIO(server);

function report(sessionID, userID, username) {
  console.log(getNow());
  console.log(warn('Middleware handling socket:'));
  console.log(
    warn(
      'sessionID:',
      sessionID || 'No stored session',
      '\t',
      'userID:',
      userID || 'No userID',
      '\t',
      'username:',
      username || 'No username'
    )
  );
}
//#endregion

function getSession(data) {
  const { sessionID, socket, session } = data;
  if (!session) {
    // so we can create a session
    return;
  }

  const { userID, username } = session;

  if (session && userID && sessionID) {
    console.log(getNow());
    console.group(`Handshake: Known party: ${username}`);
    // if we have seen this session before, ensure the client uses the same
    // userID and username used in the last session
    if (session) {
      console.log(`Data for session ${sessionID}`);
      console.log(printJson(session));
      cache.printCache('sessions', '_' + sessionID);

      socket.sessionID = sessionID;
      socket.userID = userID;
      socket.username = username;
      console.log(
        highlight(`LEAVING io.use() with  ${sessionID}'s session data.`)
      );
    }
  }
}

function createSession(data) {
  // otherwise, setup the new user...
  const { socket, next, username } = data;

  // do we need to create a new session
  if (socket.sessionID && socket.userID) {
    // not if we have IDs
    return next();
  }

  console.log('\n', info(new Date().toLocaleString()));
  console.log(warn('Handshake: Unknown party'));
  console.log(warn(`Assigning new sessionID and userID for ${username}`));

  //...with a userID, and a sessionID
  socket.sessionID = randomId(); // these values gets attached to the socket so the client knows which session has their data and messages
  socket.userID = randomId();

  socket.username = username; // username is fixed by client

  console.log(success('Leaving io.use()'));
  // handle the connection, storing and returning the session data to client for storage.
  next();
}

io.use((socket, next) => {
  const { sessionID, userID, username } = socket.handshake.auth;
  // if first connection, prompt client for a username
  if (!username) {
    return next(new Error('No username'));
  }

  report(sessionID, userID, username);

  // see if we have a session for the username
  cache
    .get('sessions', '_' + sessionID)
    .then((session) =>
      getSession({
        sessionID,
        socket,
        session,
        next,
      })
    )
    .then(() =>
      createSession({
        socket,
        next,
        username,
      })
    );
});

io.on('connection', (socket) => {
  const { id: socketID, sessionID, userID, username } = socket;
  if (!userID) {
    console.log(err('NO USERID! How did the code get this far?'));
    return;
  }
  //#region Handling socket connection
  console.log('Client connected on socket ', socketID);
  const session = {
    userID: userID,
    username: username,
    lastInteraction: new Date().toLocaleString(),
    connected: true,
  };

  setCache('sessions', sessionID, session);

  // TODO restore
  // console.log('Returning session data to client');
  // emit session details so the client can store the session in localStorage
  socket.emit('session', {
    sessionID: sessionID,
    userID: userID,
    username: username,
  });
  // TODO restore
  // console.log(
  //   success(
  //     `socket ${socketID} joining ${username}'s room with userID ${userID}`
  //   )
  // );

  // join the "userID" room
  // we send alerts using the userID stored in redisGraph for visitors
  socket.join(userID);

  // check for pending alerts
  if (alertsCache.has(userID)) {
    const msg = 'Your warning was cached, and now you have it.';
    // sending to individual socketid (private message)
    io.to(socketID).emit('exposureAlert', msg);
    alertsCache.delete(userID);
    alertsCache.print();
  }

  //#endregion Handling socket connection

  //#region Handling Users

  // TODO restore?
  // fetch existing users
  // const users = sessionCache.all();
  // send users back to client so they know how widespread LCT usage is
  // (the more users are active, the safer the community)
  // socket.emit('users', [...users]);
  // const onlineUsers = users.filter((v) => v[1].connected);
  // console.group(`There are ${onlineUsers.length} online users:`);
  // console.log(printJson(onlineUsers));

  // notify existing users (this is only important if use has opted in to LCT Private Messaging)
  socket.broadcast.emit('userConnected', {
    userID: userID,
    username: username,
    connected: true,
  });
  console.log('Leaving io.on(connect)');
  console.groupEnd();
  //#endregion Handling Users

  //#region Visit API
  // socket.on('exposureWarning')
  // major function:
  //  1) broadcasts message to all users (online only?) when a case of covid is found in the community
  //  2) redisGraph queries for anyone connected to the positive case (ignoring the immunity some might have)
  //  3) returns the number of possible exposures to positive case
  socket.on('exposureWarning', async (data, ack) => {
    const { userID, reason } = data;
    let everybody = await io.allSockets();
    console.log('All Online sockets:', printJson([...everybody]));

    socket.broadcast.emit('alertPending', socket.userID);

    onExposureWarning(userID)
      .then((exposed) => {
        exposed.forEach((userID) => {
          console.log(warn('Processing '), userID);
          findExposedVisitors(userID).then((userIDs) =>
            alertOthers(socket, userIDs, reason, ack)
          );
        });
      })
      .catch((error) => console.error(error));
  });

  socket.on('manageAppointment', (data) => {
    console.log(getNow());

    console.log(highlight(printJson(data)));
  });

  socket.on('logVisit', (data, ack) => {
    // call the graph
    console.log(getNow());
    console.log(highlight('Visit to log:', printJson(data)));
    logVisit(data).then((res) => {
      console.log(res);
      ack(res);
    });
  });

  socket.on('deleteVisit', (data, ack) => {
    // call the graph
    console.log(printJson(data));
    deleteVisit(data)
      .then((res) => {
        console.log(res);
        ack(res);
      })
      .catch((error) => ack(error));
  });
  //#endregion

  //#region Utility handlers
  socket.on('changeGraph', (graphName) => {
    console.log('index.js switching to Sandbox');
    changeGraph(graphName);
  });

  socket.on('userFeedback', (data) => {
    feedbackCache.set(Date.now(), data);
    feedbackCache.save();
    feedbackCache.print(null, 'User Feedback:');
  });

  socket.on('client_error', (data) => {
    errorCache.set(Date.now(), data);
    errorCache.save();
    console.error('Incoming client_error!');
    errorCache.print(null, 'Errors:');
    console.error('See the errors.json later for details.');
  });

  //#endregion

  //#region Disconnect handlers
  socket.on('disconnectAsync', async () => {
    const matchingSockets = await io.in(socket.userID).allSockets();
    const isDisconnected = matchingSockets.size === 0;
    if (isDisconnected) {
      // notify other users
      socket.broadcast.emit('user disconnected', socket.userID);
      // update the connection status of the session
      cache.printCache('sessions');

      setCache('sessions', socket.sessionID, {
        userID: socket.userID,
        username: socket.username,
        lastInteraction: new Date().toLocaleString(),
        connected: false,
      }).then(() =>
        cache
          .filter('sessions', (v) => v[1].connected)
          .then((online) => {
            console.log(getNow());
            console.log(
              warn(
                `There are ${online.length} online sessions after disconnecting ${socket.sessionID}:`
              )
            );
            console.log(printJson(online));
          })
      );
    }
  });

  socket.on('disconnect', async () => {
    io.in(socket.userID)
      .allSockets()
      .then((matchingSockets) => {
        const isDisconnected = matchingSockets.size === 0;
        if (isDisconnected) {
          // notify other users
          socket.broadcast.emit('user disconnected', socket.userID);
          // update the connection status of the session
          cache.printCache('sessions');

          setCache('sessions', socket.sessionID, {
            userID: socket.userID,
            username: socket.username,
            lastInteraction: new Date().toLocaleString(),
            connected: false,
          }).then(() =>
            cache
              .filter('sessions', (v) => v[1].connected)
              .then((online) => {
                console.log(getNow());

                console.log(
                  warn(
                    `There are ${online.length} online sessions after disconnecting ${socket.sessionID}:`
                  )
                );
                console.log(printJson(online));
              })
          );
        }
      });
  });
  //#endregion
});

// alerts is an array of userIDs
const alertOthers = (socket, alerts, reason, ack) => {
  const msPerDay = 1000 * 60 * 60 * 24;

  const sendExposureAlert = (to, msg) => {
    console.log('Alerting:', to); // to is a userID (of the exposed visitor)
    socket.in(to).emit(
      'exposureAlert',
      msg,
      ack((socketID) => {
        console.log(success(socketID, 'confirms'));
      })
    );
  };

  const msg = `A fellow visitor warns, '${reason}.' For this reason, please get tested. Quarantine and warn others, if necessary.`;
  alerts.forEach((to) => {
    if (io.sockets.adapter.rooms.has(to)) {
      sendExposureAlert(to, msg);
      alertsCache.delete(to);
    } else {
      alertsCache.set(to, { cached: new Date() });
    }
  });

  alertsCache
    .purge((firstDate) => {
      (Date.now() - new Date(firstDate).getTime()) / msPerDay > 14;
    })
    .then((purged) => console.log('Purged alertsCache of', purged))
    .catch((err) => console.log('Purge alertsCache error:', err));

  // const ackWarning = (results, ack) => {
  //   const ret = `Alerting ${results._resultsCount} other visitors.`;
  //   if (results._resultsCount == 0) {
  //     if (ack) {
  //       ack(ret);
  //     }
  //     return;
  //   }
  //   return results;
  // };
};
//
