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
const {
  printJson,
  err,
  highlight,
  info,
  success,
  special,
  warn,
  url,
  printNow,
  getNow,
  isEmpty,
} = require('../src/utils/helpers.js');
const PORT = process.env.PORT || 3003;
const dirPath = path.join(__dirname, '../dist');

//#region Redis setup
const {
  currentGraphName, // mapped to client nsp (aka namespace or community name)
  host,
  deleteVisit,
  logVisit,
  onExposureWarning,
  getGraphs,
  getVisitors,
  getExposures,
  getVisitTimes,
  getVisitedPaths,
  setStartEnd,
  confirmDates,
} = require('./redis/graph');

// experimental. not used as of 12.13.21
const {
  addSponsor,
  getSponsors,
  addPromotion,
  getPromotions,
  enterLottery,
  earnReward,
  getRewardPoints,
  addWarnings,
  getWarnings,
  addVisit,
  getVisits,
  randomId,
  getCountries,
} = require('./redis/streams');

const { confirmPlaceID, getPlaceID } = require('./googlemaps');

const cache = require('./redis/json');
cache.connectCache(true).then(() => {
  console.log(getNow());
  console.log('RedisGraph host:', host);
  console.log('Node sees Exposure graph:', special(currentGraphName), '\n');
});

// TODO CONSIDER: a better design for handling RedisJson async issues
// this is the first time we call RedisJson (smells fishy)
// if it wasn't we would have to ensure the first call is done like this
// so we don't have any null reference issues due to async timing
const getPendingAlerts = (newUserID, socketId) => {
  const message = `Checking pending alerts for ${newUserID}...`;

  const get = () => {
    cache
      .get('alerts', newUserID, message)
      .then((alert) => {
        if (!alert) return;

        // sending to individual socketid (private message)
        io.to(socketId).emit('exposureAlert', alert.riskScore);
        cache.del('alerts', newUserID);
      })
      .catch((e) => console.log(e));
  };

  try {
    get();
  } catch (error) {
    cache.connectCache().then(() => {
      get();
    });
  }
};
const deleteCacheItem = (key, to) => {
  cache.del(key, to);
};
const setCacheItem = (key, to, val) => {
  cache.set(key, to, val);
};

//#endregion

const server = express()
  .use(serveStatic(dirPath))
  .use('*', (req, res) => res.sendFile(`${dirPath}/index.html`))
  .listen(PORT, () => {
    printNow();
    console.log('Listening on:');
    console.log(url(`http://localhost:${PORT}`, '\n\n'));
  });
const io = socketIO(server);

io.on('connection', (socket) => {
  //#region Handling socket connection
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
  console.log(success(`Client ${newUserID} connected on socket ${socket.id}`));

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
  // used in tqrHandshake event handler
  socket.userID = newUserID;

  getPendingAlerts(newUserID, socket.id);

  // notify existing users (this is only important if use has opted in to LCT Private Messaging)
  socket.broadcast.emit('userConnected', {
    userID,
    username,
    connected: true,
  });
  console.log('Leaving io.on(connect)');
  console.log(
    '============================ io.on(connection) ================================='
  );
  //#endregion Handling socket connection

  //#region STREAM handlers
  socket.on(
    'promote',
    (
      { confirmedAddress, biz, country, promoText, promotionalDays, ssid },
      ack
    ) => {
      console.log(
        `promote(${biz} (${confirmedAddress}), ${promoText}, ${promotionalDays}`
      );
      addPromotion({
        confirmedAddress,
        biz,
        country,
        promoText,
        promotionalDays,
        ssid,
      }).then((newPromo) => {
        if (ack) {
          ack(newPromo);
        }
        // let everybody online now see the new promo
        const msg = { biz, promoText: newPromo.promoText };
        console.log(`newPromotion, ${printJson(msg)}`);
        socket.broadcast.emit('newPromotion', msg);
      });
    }
  );

  socket.on('getPromotions', ({ ssid, country }, ack) => {
    console.log('getPromotions() ssid :>> ', ssid);
    getPromotions({ ssid, country }).then((promos) => {
      if (ack) {
        ack(promos);
      }
    });
  });

  socket.on('addWarnings', ({ visitData, score, reliability }, ack) => {
    if (isEmpty(visitData) && ack) {
      ack('No Visit Data. Server should not be called.');
    }

    addWarnings({ visitData, score, reliability });

    getWarnings().then((warningIDS) => {
      console.log('warningIDS :>> ', warningIDS);
      if (ack) {
        ack(warningIDS);
      }
      socket.broadcast.emit('broadcastedAlert', warningIDS);
      socket.emit('alertsSent');
    });
  });

  socket.on('getWarnings', (_, ack) => {
    getWarnings().then((alerts) => {
      if (ack) {
        ack(alerts);
      }
    });
  });

  socket.on('enterLottery', (uid, ack) => {
    // add to the Lottery Stream
    enterLottery(uid).then((ssid) => {
      // notify the uid who shared the QR that they get credit
      socket.to(uid).emit('confirmShare', ssid);
      if (ack) {
        ack(ssid);
      }
    });
  });

  socket.on('redeemReward', ({ uid, cid, points }, ack) => {
    getRewardPoints({ uid, cid }).then((visitedOn) => {
      if (ack && visitedOn[cid].length >= points) {
        // Customer will remove uid rewards
        socket.to(cid).emit('rewardRedeemed', uid);
        // confirm wih Sponsor
        ack(`They, ${cid}, are redeemed`);
      }
    });
  });

  socket.on('getRewardPoints', ({ uid, cid }, ack) => {
    if (isEmpty(uid)) {
      return;
    }
    getRewardPoints({ uid, cid }).then((visitedOn) => {
      if (ack) {
        ack(visitedOn);
      }
    });
  });

  //#region Earning Reward Points
  // sent by Customer
  socket.on('offerHandshake', ({ cid, uid, transaction }) => {
    console.log('cid, uid, transaction :>> ', cid, uid, transaction); // sent to Sponsor
    socket.to(uid).emit('shakeHands', { cid, transaction });
  });

  // sent by Sponsor
  socket.on('readyForBusiness', ({ cid, uid, biz, transaction, country }) => {
    console.log(
      'cid, uid, biz, transaction, country :>> ',
      cid,
      uid,
      biz,
      transaction,
      country
    );
    if (transaction === 'earn points') {
      earnReward({ uid, biz, cid }).then((ssid) => {
        console.log(ssid);
        // send to Customer
        socket.to(cid).emit('doingBusinessWith', { uid, biz, country, ssid });
      });
    }
  });
  //#endregion

  socket.on(
    'addSponsor',
    (
      { biz, address, country, uid, confirmedAddress, promoText, userAgent },
      ack
    ) => {
      console.log(biz, country, confirmedAddress, promoText, userAgent);
      // add to the Sponsor Stream
      addSponsor({
        biz,
        address,
        country,
        uid,
        confirmedAddress,
        userAgent,
      }).then((ssid) => {
        if (ack) {
          console.log('ssid :>> ', ssid);
          ack({ ssid });
        }
      });
    }
  );
  socket.on('getSponsors', (country, ack) => {
    console.log(`getSponsors(${country})`);
    getSponsors(country).then((sponsors) => {
      if (ack) {
        ack(sponsors);
      }
    });
  });

  socket.on('getCountries', (_, ack) => {
    getCountries()
      .then((countries) => {
        if (ack) {
          ack(countries);
        }
      })
      .catch((e) => {
        console.log('e :>> ', e);
      });
  });

  socket.on('addVisit', ({ ssid, uid }, ack) => {
    console.log({ ssid, uid });
    // add to the Visits Stream
    addVisit({ ssid, uid }).then((id) => {
      if (ack) {
        ack(`added visit to STREAM with Visit ID: ${id}`);
      }
    });
  });

  socket.on('getVisits', (ssid, ack) => {
    console.log(ssid);
    getVisits(ssid).then((visits) => {
      if (ack) {
        ack(visits);
      }
    });
  });
  //#endregion STREAM handlers

  socket.on('getPlaceID', ({ address, country }, ack) => {
    function safeAck(results) {
      if (ack) {
        if (results.isAxiosError) {
          console.log(warn('Error', results.message));
          ack({ warning: results.message });
        } else {
          const { formatted_address, place_id } = results;
          console.log(
            highlight(
              'Acknowledging client',
              printJson({
                formatted_address,
                place_id,
              })
            )
          );
          ack({
            formatted_address,
            place_id,
          });
        }
      }
    }
    function safeWarn(e) {
      if (ack) {
        console.log(warn('Warning client of no results'));
        ack({
          warning: 'Cannot find an address based on your input.',
          error: e,
        });
      }
    }

    getPlaceID({ address, country })
      .then((result) =>
        // reverse geocode to compare given address with google's address
        // but only if getPlaceID() returns a value to compare
        confirmPlaceID(result)
          .then((finalResult) => safeAck(finalResult))
          .catch((e) => safeWarn(e))
      )
      .catch((e) => safeWarn(e));
  });

  //#region Visit API
  socket.on('exposureWarning', ({ graphName, riskScore }, ack) => {
    // separated to enable unit testing
    callOnExposureWarning(
      {
        graphName,
        riskScore,
      },
      ack
    );
  });
  // TODO do this for all the event handlers
  const callOnExposureWarning = async ({ graphName, riskScore }, ack) => {
    // riskScore will make its way into exposure alert message in sendExposureAlert()

    const everybody = await io.allSockets();
    console.log('All Online sockets:', printJson([...everybody]));

    //#region Functions called by onExposureWarning() below
    console.log('exposureWarning() > ', graphName, riskScore, userID);
    // called when onExposureWarning() Promise resolves below
    const sendExposureAlert = (to, alert) => {
      console.log('Alerting:', to, 'with', alert); // to is a userID (of the exposed visitor)
      socket.to(to).emit('exposureAlert', alert);
    };

    // handler for alerMap below
    const vMap = (x) => {
      const { placeID, exposedOn, exposedFor, nominalTime } = x;
      return {
        placeID,
        exposedOn,
        exposedFor,
        nominalTime,
      };
    };
    const alertMap = (v) => v.map((x) => vMap(x));
    // onExposureWarning() needs to group alerts by place_id
    const groupBy = (arr, fn) =>
      arr
        .map(typeof fn === 'function' ? fn : (val) => val[fn])
        .reduce((acc, val, i) => {
          acc[val] = (acc[val] || []).concat(arr[i]);
          return acc;
        }, {});
    //#endregion

    // delegate to Promise in redis.js
    onExposureWarning({
      graphName,
      userID,
    })
      .then((exposures) => {
        // TODO Use a Map here. it's much easier to de/serialize across boundaries
        Object.entries(exposures).forEach(([key, value]) => {
          console.log(`${key}: ${printJson(value)}`);
          const x = alertMap(value);
          console.log(x);
          const alert = groupBy(value, 'placeID');
          console.log(alert);
          const data = {
            alert,
            riskScore,
          };
          if (io.sockets.adapter.rooms.has(key)) {
            sendExposureAlert(key, data);
            deleteCacheItem('alerts', key);
          } else {
            setCacheItem('alerts', key, {
              cached: new Date(),
              data,
            });
          }
          if (ack) {
            ack({ message: exposures });
          }
        });
      })
      .catch((error) => {
        if (ack) {
          ack({ error });
        }
      });
  };

  // TODO what is this function? it's called by graph.js, but why?
  socket.on('updateVisit', (param, ack) => {
    setStartEnd(param, ack);
  });

  socket.on('logVisit', (data, ack) => {
    // call the graph
    console.log(getNow());
    console.log(ack);
    console.log(highlight('Visit to log:', printJson(data)));

    function safeAck(results) {
      if (ack) {
        console.log(highlight('Acknowledging client', printJson(results)));
        ack(results);
      }
    }

    // delegate to redis/redis.js
    // TODO add a guard in the either-async (e.g., missing graphName)
    logVisit(data)
      .toEither()
      .map((x) => {
        console.log(info('logVisit.map():', JSON.stringify(data, null, 3)));
        return x;
      })
      .cata({
        ok: (results) => safeAck(results),
        error: (e) => {
          console.error(err(e.stack, 'Issues calling redis.logVisit()'));
          const erx = { error: e.stack };
          ack(erx);
        },
      });
  });

  // (note: using 'params' suggests an object of parameters
  //        using 'param' suggests a single primitive parameter
  socket.on('deleteVisit', (params, ack) => {
    console.log(printJson(params));

    const safeAck = (results) => {
      if (ack) {
        ack(results);
      }
    };
    // call the graph
    deleteVisit(params)
      .toEither()
      .map((results) => {
        console.log('Results of delete:', results);
        return results;
      })
      .cata({
        ok: (results) => safeAck(results),
        error: (results) => {
          console.error(err(results, 'Issues calling redis.logVisit()'));
        },
      });
  });
  //#endregion Visit API

  //#region Utility handlers
  socket.on('userFeedback', (data) => {
    console.log('userFeedback', data);
    // TODO ADD: use Redis Streams for error logs
    //   feedbackCache.set(Date.now(), data);
    //   feedbackCache.save();
    //   feedbackCache.print(
    //     null,
    //     'User Feedback:'
    //   );
  });

  socket.on('client_error', (data) => {
    // TODO ADD: use Redis Streams for error logs
    // errorCache.print(null, 'Errors:');
    console.error('Incoming client_error!');
    console.log(data);
    console.error(err('See the errors STREAM for details.'));
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

  //#region Redis Monitor functions
  socket.on('getGraphs', (_, ack) => {
    ack(getGraphs());
  });
  socket.on('getVisitors', (graphNames, ack) => {
    getVisitors(graphNames, ack);
  });
  socket.on('getExposures', ({ graphNames }, ack) => {
    getExposures({ graphNames, userID }, ack);
  });
  socket.on('getVisitTimes', ({ graphNames }, ack) => {
    getVisitTimes({ graphNames, userID })
      .then((results) => results.flat())
      .then((all) => {
        if (all.length) {
          console.log('visit dates:', all);
          const graphName = all[0]._graph._graphId;
          const visits = all[0]._results.map((c) => {
            const v = c.get('v');
            return {
              id: v.id,
              start: v.properties.start,
              end: v.properties.end,
              graphName,
            };
          });

          if (ack) {
            ack(visits);
          }
        } else if (ack) {
          ack(all);
        }
      });
  });

  socket.on('confirmDates', ({ dates }, ack) => {
    confirmDates({ userID, dates })
      .then((res) => {
        const results = res.map((v, i) => ({
          loggedVisitId: dates[i].id,
          propertiesSet: v.getStatistics().propertiesSet(),
        }));
        console.log(results);
        if (ack) {
          ack(results);
        }
      })
      .catch((e) => console.error(e));
  });

  socket.on('validateVisits', (_, ack) => {
    console.log('validateVisits:', userID, ack);
    getVisitTimes(userID, (spaces) => {
      if (ack) {
        ack([...spaces]);
      }
    });
  });

  socket.on('getVisitedPaths', (_, ack) => {
    console.log('getVisitedPaths:', userID, ack);
    getVisitedPaths(userID, (paths) => {
      if (ack) {
        ack([...paths]);
      }
    });
  });
  //#endregion Redis Monitor functions
});
