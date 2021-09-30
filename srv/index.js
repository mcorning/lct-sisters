//  ngrok http 3003 -host-header="localhost:3003"

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
// require('../src/fp/monads/EitherAsync');
require('either-async');

const path = require('path');
const express = require('express');
const socketIO = require('socket.io');
const serveStatic = require('serve-static');
const crypto = require('crypto');
const randomId = () => crypto.randomBytes(8).toString('hex');
const {
  printJson,
  // err,
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
  currentGraphName, // mapped to client nsp (aka namespace or community name)
  host,
  deleteVisit,
  findExposedVisitors,
  changeGraph,
  logVisit,
  onExposureWarning,
  testGraph,
} = require('./redis/redis');

const cache = require('./redis/redisJsonCache');

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
console.log('Node sees Exposure graph:', special(currentGraphName), '\n');

const server = express()
  .use(serveStatic(dirPath))
  .use('*', (req, res) => res.sendFile(dirPath + '/index.html'))
  .listen(PORT, () => {
    printNow();
    console.log('Listening on:');
    console.log(url(`http://localhost:${PORT}`, '\n\n'));
  });
const io = socketIO(server);

// function report(sessionID, userID, username) {
//   console.log(info('2) Middleware handling socket:'));
//   console.log(
//     info(
//       'sessionID:',
//       sessionID || 'No stored session',
//       '\t',
//       'userID:',
//       userID || 'No userID',
//       '\t',
//       'username:',
//       username || 'No username'
//     )
//   );
// }
//#endregion

// function getSession(data) {
//   const { sessionID, socket, session, next } = data;
//   console.groupCollapsed(info('3) getSession(): data:', sessionID));
//   if (!session) {
//     // so we can create a session
//     console.log('\t Going to create a session now...');
//     console.groupEnd;
//     //return;
//     next();
//   }

//   const { userID, username } = session;

//   // TODO what if this isn't true?
//   if (session && userID && sessionID) {
//     console.log(getNow());
//     console.log(info(`4) Handshake: Known party: ${username}`));
//     // if we have seen this session before, ensure the client uses the same
//     // userID and username used in the last session
//     console.log(info(printJson(session)));
//     console.groupEnd;

//     socket.sessionID = sessionID;
//     socket.userID = userID;
//     socket.username = username;

//     console.log(
//       success(`5) LEAVING io.use() with  ${sessionID}'s session data.`)
//     );
//     return;
//   }
// }

// function createSession(data) {
//   // otherwise, setup the new user...
//   const { socket, next, username } = data;
//   const { sessionID, userID } = socket.handshake.auth;
//   console.groupCollapsed(
//     '4) createSession(): username/auth',
//     data.unsername,
//     printJson(socket.handshake.auth)
//   );

//   // do we need to create a new session?
//   if ((socket.sessionID || sessionID) && (socket.userID || userID)) {
//     // not if we have IDs
//     console.groupEnd;
//     return next();
//   }

//   console.log('\n', info(new Date().toLocaleString()));
//   console.log(warn('5) Handshake: Unknown party'));
//   console.log(warn(`\tAssigning new sessionID and userID for ${username}`));

//   //...with a userID, and a sessionID
//   socket.sessionID = randomId(); // these values gets attached to the socket so the client knows which session has their data and messages
//   socket.userID = randomId();
//   socket.username = username; // username is fixed by client

//   console.log(success('Leaving io.use()'));
//   // handle the connection where we cache and return the session data to client for local storage.
//   console.groupEnd;

//   return next();
// }

// io.use((socket, next) => {
//   console.log('1) Entering getSession middleware');
//   const { sessionID } = socket.handshake.auth;
//   cache.get('sessions', '_' + sessionID).then((session) => {
//     if (!session) {
//       console.log('Creating session');
//       socket.sessionID = randomId(); // these values gets attached to the socket so the client knows which session has their data and messages
//       socket.userID = randomId();
//     }
//     next();
//   });
// });

// io.use((socket, next) => {
//   console.log(
//     '========================== io.use ==================================='
//   );
//   console.log('1) Entering io.use()');
//   const { sessionID, userID, username } = socket.handshake.auth;
//   console.assert(username, 'Expected a username (or usernumber). Got null.');
//   // if first connection, prompt client for a username
//   if (!username) {
//     return next(new Error('No username'));
//   }

//   report(sessionID, userID, username);

//   // see if we have a session for the username
//   // cache
//   //   .get('sessions', '_' + sessionID)
//   //   .then((session) =>
//   //     getSession({
//   //       sessionID,
//   //       socket,
//   //       session,
//   //       next,
//   //     })
//   //   )
//   //   .then(() =>
//   //     createSession({
//   //       socket,
//   //       username,
//   //       next,
//   //     })
//   //   )
//   //   .catch((e) => console.log(err('Error in cache:', e)));
// });

io.on('connection', (socket) => {
  const {
    socketID,
    sessionID,
    userID,
    username,
    usernumber,
  } = socket.handshake.auth;
  // if (!userID) {
  //   console.log(err('NO USERID! How did the code get this far?'));
  //   return;
  // }  // const { id: socketID, sessionID, userID } = socket;
  // const username = socket.handshake.username;
  console.log(sessionID, userID, username, usernumber);
  const newSessionID = sessionID || randomId(); // these values gets attached to the socket so the client knows which session has their data and messages
  const newUserID = userID || randomId();

  console.log(
    '============================ io.on(connection) ================================='
  );
  //#region Handling socket connection
  console.log(success('Client connected on socket ', socketID));
  const session = {
    userID: newUserID,
    username,
    lastInteraction: new Date().toLocaleString(),
    connected: true,
  };

  setCache('sessions', newSessionID, session);

  if (!sessionID) {
    console.log('Returning session data to client', newSessionID, newUserID);

    // emit new session details so the client can store the session in localStorage
    socket.emit('newSession', {
      sessionID: newSessionID,
      userID: newUserID,
      username,
    });
  }

  // join the "userID" room
  // we send alerts using the userID stored in redisGraph for visitors
  socket.join(newUserID);

  // check for pending alerts
  if (alertsCache.has(newUserID)) {
    const msg = 'Your warning was cached, and now you have it.';
    // sending to individual socketid (private message)
    io.to(socketID).emit('exposureAlert', msg);
    alertsCache.delete(newUserID);
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
  console.log(
    '============================ io.on(connection) ================================='
  );
  //#endregion Handling Users

  //#region Visit API
  // socket.on('exposureWarning')
  // major function:
  //  1) broadcasts message to all users (online only?) when a case of covid is found in the community
  //  2) redisGraph queries for anyone connected to the positive case (ignoring the immunity some might have)
  //  3) returns the number of possible exposures to positive case
  socket.on('exposureWarning', async (riskScore, ack) => {
    let everybody = await io.allSockets();
    console.log('All Online sockets:', printJson([...everybody]));

    // do all connected visitors handle this event? i find no alertPending event handlers
    // socket.broadcast.emit('alertPending', riskScore);
    const userID = socket.handshake.auth.userID;
    onExposureWarning(userID)
      .then((exposed) => {
        exposed.forEach((userID) => {
          console.log(warn('Processing '), userID);
          findExposedVisitors(userID).then((userIDs) =>
            alertOthers(socket, userIDs, riskScore, ack)
          );
        });
      })
      .catch((error) => console.error(error));
  });

  socket.on('manageAppointment', (data) => {
    console.log(getNow());

    console.log(highlight(printJson(data)));
  });

  // socket.on('logVisit', (data, ack) => {
  socket.on('logVisit', (data, ack) => {
    // call the graph
    console.log(getNow());
    console.log(ack);
    console.log(highlight('Visit to log:', printJson(data)));

    function handleAck(results) {
      if (ack) {
        const x = results || 'no results';
        console.log(highlight('acknowledging client', printJson(x)));
        ack(results);
        return;
      }
      console.log('No ack()');
    }

    // delegate to redis/redis.js
    logVisit(data)
      .toEither()
      // TODO all inspect() to either-async
      .map((x) => {
        console.log(info('logVisit.map():', JSON.stringify(data, null, 3)));
        return x;
      })
      .cata({
        // ok: (results) => socket.emit('visitLogged', results),
        ok: (results) => handleAck(results),
        error: (results) => {
          console.log(results, 'Issues calling redis.logVisit()');
        },
      });
  });

  socket.on('deleteVisit', (data, ack) => {
    // call the graph
    console.log(printJson(data));
    deleteVisit(data)
      .then((res) => {
        console.log('Results of delete:', res);
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
  socket.on('testGraph', (payload, ack) => {
    const {query, param}=payload
    testGraph({ query, param }, ack);
  });

  //#region Graph testing
  socket.on('testGraphX', (query, ack) => {
    // call the graph
    console.log(getNow());
    console.log(ack);
    console.log(highlight('Visit to log:', printJson(query)));

    function handleAck(results) {
      if (ack) {
        const x = results || 'no results';
        console.log(highlight('acknowledging client', printJson(x)));
        ack(results);
        return;
      }
      console.log('No ack()');
    }

    // delegate to redis/redis.js
    testGraph(query)
      .toEither()
      // TODO all inspect() to either-async
      .map((x) => {
        console.log(info('testGraph():', x));
        return x;
      })
      .cata({
        // ok: (results) => socket.emit('visitLogged', results),
        ok: (results) => handleAck(results),
        error: (results) => {
          console.log(results, 'Issues calling redis.logVisit()');
        },
      });
  });
  //#endregion

  //#region Disconnect handlers
  socket.on('disconnectAsync', async () => {
    const matchingSockets = await io.in(socket.userID).allSockets();
    const isDisconnected = matchingSockets.size === 0;
    if (isDisconnected) {
      socket.emit('disconnected');
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
                `There are ${online.length} online sessions after disconnecting ${socket.id}:`
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
          socket.emit('disconnected');

          // notify other users
          socket.broadcast.emit('user disconnected', socket.userID);
          // update the connection status of the session
          console.group(`${socket.id} disconnecting`);
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
                    `There are ${online.length} online sessions after disconnecting ${socket.id}:`
                  )
                );
                console.log(printJson(online));
              })
          );
          console.groupEnd();
        }
      });
  });
  //#endregion
});

// alerts is an array of userIDs
// const alertOthers = (socket, alerts, reason, ack) => {
const alertOthers = (socket, alerts, riskScore) => {
  const msPerDay = 1000 * 60 * 60 * 24;

  const sendExposureAlert = (to, riskScore) => {
    console.log('Alerting:', to); // to is a userID (of the exposed visitor)
    socket.to(to).emit(
      'exposureAlert',
      riskScore //,
      // ack((socketID) => {
      //   console.log(success(socketID, 'confirms'));
      // })
    );
  };

  alerts.forEach((to) => {
    if (io.sockets.adapter.rooms.has(to)) {
      sendExposureAlert(to, riskScore);
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
