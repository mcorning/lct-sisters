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
// const { DateTime } = require('../src/utils/luxonHelpers');
const PORT = process.env.PORT || 3003;
const dirPath = path.join(__dirname, '../dist');

const { Cache } = require('../CacheClass');

// const alertsCache = new Cache('../alerts.json');
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
  getVisitors,
  getExposures,
  getVisitedSpaces,
  matchQueryWithParamsQuery,
} = require('./redis/redis');

const cache = require('./redis/redisJsonCache2');
cache.connectCache(true).then(() => {
  console.log(getNow());
  console.log('RedisGraph host:', host);
  console.log('Node sees Exposure graph:', special(currentGraphName), '\n');
});

const getPendingAlerts = (newUserID, socketId) => {
  const message = `Checking pending alerts for ${newUserID}...`;

  const get = (newUserID, socketId, message) => {
    cache.get('alerts', newUserID, message).then((alert) => {
      if (!alert) return;

      // sending to individual socketid (private message)
      io.to(socketId).emit('exposureAlert', alert.riskScore);
      cache.del('alerts', newUserID);
    });
  };

  try {
    get(newUserID, socketId, message);
  } catch (error) {
    cache.connectCache().then(() => {
      get(newUserID, socketId, message);
    });
  }
};
const deleteCacheItem = (key, to) => {
  // cache.connectCache().then(() => {
  cache.del(key, to);
  // });
};
const setCacheItem = (key, to, val) => {
  // cache.connectCache().then(() => {
  cache.set(key, to, val);
  // });
};

// TODO experiment: moving sessionID store from RedisJson to RedisGraph
// TODO this code was unreliable with frequent craches
// high-order function to handle safe creation of sessions cache
// let setCacheBad = function(key, path, node) {
//   return cache.create(key, path, node).then(() => {
//     setCache = function(key, path, node) {
//       return cache.add(key, path, node);
//     };
//     return setCache;
//   });
// };
//#endregion

const server = express()
  .use(serveStatic(dirPath))
  .use('*', (req, res) => res.sendFile(dirPath + '/index.html'))
  .listen(PORT, () => {
    printNow();
    console.log('Listening on:');
    console.log(url(`http://localhost:${PORT}`, '\n\n'));
  });
const io = socketIO(server);

io.on('connection', (socket) => {
  const { sessionID, userID, username, usernumber } = socket.handshake.auth;

  console.log(
    'sessionID:',
    sessionID,
    'userID:',
    userID,
    'username:',
    username,
    'usernumber:',
    usernumber
  );
  const newSessionID = sessionID || randomId(); // these values gets attached to the socket so the client knows which session has their data and messages
  const newUserID = userID || randomId();

  console.log(
    '============================ io.on(connection) ================================='
  );
  //#region Handling socket connection
  console.log(success('Client connected on socket ', socket.id));

  // TODO experiment: moving sessionID store from RedisJson to RedisGraph
  // const session = {
  //   userID: newUserID,
  //   username,
  //   lastInteraction: new Date().toLocaleString(),
  //   connected: true,
  // };
  // setCache('sessions', newSessionID, session);

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
  // if (alertsCache.has(newUserID)) {
  //   const msg = 'Your warning was cached, and now you have it.';
  //   // sending to individual socketid (private message)
  //   io.to(socket.id).emit('exposureAlert', msg);
  //   alertsCache.delete(newUserID);
  //   alertsCache.print();
  // }
  getPendingAlerts(newUserID, socket.id);
  //#endregion Handling socket connection

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

  //#region Visit API
  socket.on('exposureWarning', async (riskScore, ack) => {
    let everybody = await io.allSockets();
    console.log('All Online sockets:', printJson([...everybody]));

    // alerts is an array of userIDs
    const alertOthers = (socket, alerts, riskScore) => {
      const sendExposureAlert = (to, riskScore) => {
        console.log('Alerting:', to); // to is a userID (of the exposed visitor)
        socket.to(to).emit(
          'exposureAlert',
          riskScore //,
          // ack((socket.id) => {
          //   console.log(success(socket.id, 'confirms'));
          // })
        );
      };

      alerts.forEach((to) => {
        if (io.sockets.adapter.rooms.has(to)) {
          sendExposureAlert(to, riskScore);
          deleteCacheItem('alerts', to);
        } else {
          setCacheItem('alerts', to, {
            cached: new Date(),
            riskScore,
          });
        }
      });
    };

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
      .catch((error) => console.error(err(error)));
  });

  socket.on('updateVisit', ({ query, param }, ack) => {
    matchQueryWithParamsQuery({ query, param }, ack);
    if (ack) {
      ack();
    }
  });

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
          console.error(err(results, 'Issues calling redis.logVisit()'));
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
    console.error(err('See the errors.json later for details.'));
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
          console.groupEnd();
        }
      });
  });
  //#endregion
  //"O8irXhpkZFLXxQo9AAAy"

  //#region Graph testing
  socket.on('getVisitors', (query, ack) => {
    getVisitors(ack);
  });
  socket.on('getExposures', (param, ack) => {
    getExposures({ param, ack });
  });
  socket.on('getVisitedSpaces', (param, ack) => {
    getVisitedSpaces(param, ack);
  });

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
    getVisitors(query)
      .toEither()
      // TODO all inspect() to either-async
      .map((x) => {
        console.log(info('getVisitors():', x));
        return x;
      })
      .cata({
        // ok: (results) => socket.emit('visitLogged', results),
        ok: (results) => handleAck(results),
        error: (results) => {
          console.log(err(results, 'Issues calling redis.logVisit()'));
        },
      });
  });
  //#endregion
});

//
