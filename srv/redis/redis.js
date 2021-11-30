// See https://github.com/RedisGraph/redisgraph.js/blob/master/examples/redisGraphExample.js
const RedisGraph = require('redisgraph.js').Graph;
// require('../../src/fp/monads/EitherAsync');
require('either-async');

//#region Setup
const {
  printJson,
  warn,
  info,
  highlight,
  logVisitors,
} = require('../../src/utils/helpers');
const { DateTime, Interval } = require('../../src/utils/luxonHelpers');
const nominalTime = 'hours';

let options, currentGraphName, defaultGraphName;

if (process.env.NODE_ENV === 'production') {
  console.log('Dereferencing process.env');
  options = {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
  };
  defaultGraphName = process.env.VUE_APP_NAMESPACE;
  currentGraphName = defaultGraphName;
} else {
  console.log('Dereferencing redisConfig.js');

  const graphOptions = require('./redisGraph.options.js');
  options = {
    host: graphOptions.redisHost,
    port: graphOptions.redisPort,
    password: graphOptions.redisPassword,
  };
  defaultGraphName = graphOptions.graphName;
  currentGraphName = defaultGraphName;
}

//#region Redis Connection Pooling code
// still not sure how to use pool.
// this code has created a key on the lctGraph database
// so i suspect that we should use redisPool to create a redis graph
// var redisPool = require('redis-connection-pool')('myRedisPool', {
//   host: options.host, // default
//   port: options.port, //default
//   // optionally specify full redis url, overrides host + port properties
//   // url: "redis://username:password@host:port"
//   max_clients: 30, // default
//   perform_checks: false, // checks for needed push/pop functionality
//   database: 0, // database number to use
//   options: {
//     auth_pass: options.password,
//   }, //options for createClient of node-redis, optional
// });
// redisPool.set('test-key', 'foobar', function(err) {
//   console.log(err ? err : 'No connection pool errors when set used');
//   redisPool.get('test-key', function(err, reply) {
//     console.log(reply); // 'foobar'
//     console.log(err ? err : 'No connection pool errors when get used');
//   });
// });
//#endregion Redis Connection Pooling code

const host = options.host;

console.log(highlight('Redis Options:', printJson(options)));

let Graph = new RedisGraph(currentGraphName, null, null, options);
const Redis = require('ioredis');
const redis = new Redis(options);

console.log(info(`At initialization, Redis Graph opened ${currentGraphName}`));
module.exports = {
  currentGraphName,
  host,
  getSessionID,
  deleteVisit,
  changeGraph,
  logVisit,
  onExposureWarning,
  options,
  getGraphs,
  getVisitors,
  getExposures,
  getVisitTimes,
  getVisitedPaths,
  matchWithParamsQuery,
  matchAllNodesQuery,
  matchAllSpacesQuery,
  setStartEnd,
  confirmDates,
  enterLottery,
};
//#endregion Setup
function enterLottery(uid) {
  return redis.xadd('lottery', '*', 'uid', uid);
}

function getSessionID(param, ack) {
  const { userID } = param;
  const q = `MATCH (v:visitor{userID:'${userID}'}) RETURN v.sessionID`;
  Graph.query(q).then((res) => {
    const sessionID = res.get('sessionID');
    console.log('sessionID', sessionID);
    if (ack) {
      // test.js handles callback
      ack({
        msg: 'SessionID for ' + userID,
        results: sessionID,
      });
    }
  });
}

function getVisitedPaths(userID, ack) {
  const q = `MATCH p=(:visitor{userID:'${userID}'})-[v:visited]->(s:space) RETURN p`;
  let paths = [];
  Graph.query(q).then((res) => {
    while (res.hasNext()) {
      let record = res.next();
      let p = record.get('p');
      paths = [...paths, p];
    }
    if (ack) {
      ack(paths);
    }
  });
}

async function setStartEnd(param, ack) {
  const { id, start, end, graphName } = param;
  changeGraph(graphName);

  console.log('setStartEnd(param):', param);
  const q = `MATCH ()-[v:visited]->() WHERE id(v)=${id} SET v.start=${start}, v.end=${end}`;
  console.log(q);
  Graph.query(q)
    .then((r) => {
      if (ack) {
        ack({ msg: `Query complete: ${r._statistics._raw[0]}` });
      }
    })
    .catch((e) => console.error('error in setStartEnd():', e));
}

async function matchWithParamsQuery(param, ack) {
  console.log(param);

  // const p = { userID: 'b6644acc815efb64' };
  // console.log(p);
  console.log(param);
  const s = new Set();
  const q = [
    'MATCH p=(v:visitor{userID:$userID})-[c:visited]->(s:space)<-[e:visited]-(o:visitor)',
    'WHERE (o.userID <> v.userID) RETURN o.userID',
  ].join('\n');

  // Match with parameters.
  const res = await Graph.query(q, param).catch((e) =>
    console.error('error in matchWithParamsQuery():', e)
  );

  while (res.hasNext()) {
    let record = res.next();
    const userId = record.get('o.userID');
    console.log('o.userID:', userId);
    s.add(userId);
  }
  if (ack) {
    ack({ msg: 'UserID(s) of visitors sharing spacetime:', results: [...s] });
  }
}
async function matchAllNodesQuery(param, ack) {
  console.log(param);

  // Named paths matching.
  const q = 'MATCH n=() RETURN n';
  const res = await Graph.query(q);
  const nodeCt = res._resultsCount;
  console.log('nodeCount:', nodeCt);

  if (ack) {
    ack({
      msg: 'Number of visitor and space nodes on the graph',
      results: nodeCt,
    });
  }
}
async function matchAllSpacesQuery(param, ack) {
  console.log(param);
  const s = new Set();

  const q = 'MATCH (:visitor)-[:visited]->(s:space) RETURN s.name, id(s)';
  const res = await Graph.query(q);
  while (res.hasNext()) {
    let record = res.next();
    let name = record.get('s.name');
    let id = record.get('id(s)');
    console.log('s.name:', name, 'id(s):', id);
    s.add({ name, id });
  }
  if (ack) {
    ack({
      msg: 'Name(s) of visited space(s):',
      results: [...s],
    });
  }
}

function getGraphs() {
  return 'In development. Meantime, use LCT locally.';
}

function getVisitors(graphNames, ack) {
  console.log('getVisitors(): graphNames', graphNames);
  const query = 'MATCH (v:visitor) RETURN v.userID';
  let promises = [];

  const p = (title) => {
    // this code is optimized to work with vuetify Lists
    return new Promise((resolve, reject) => {
      changeGraph(title);
      let items = [];
      Graph.query(query)
        .then((res) => {
          while (res.hasNext()) {
            let record = res.next();
            let title = record.get('v.userID');
            items = [...items, { title }];
          }
          resolve({ title, items });
        })
        .catch((e) => {
          reject(e);
        });
    });
  };

  graphNames.forEach((graphName) => {
    promises = [...promises, p(graphName)];
  });
  const results = Promise.all(promises);
  results.then((visitors) => {
    // r is an array of Map results, one Map from each resolved Promise
    const msg = `UserIDs in all ${graphNames.length} used graph${
      graphNames.length > 1 ? 's' : ''
    }`;
    console.log(logVisitors(printJson(visitors)));

    if (ack) {
      ack({ msg, visitors });
    }
  });
}
function getExposures({ graphNames, userID }, ack) {
  const query = getExposureQuery(userID);
  console.log('Exposure query:', query);

  let promises = [];
  function getDate(start) {
    const date = new Date(start);
    const formatted_date =
      date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
    return formatted_date;
  }
  const p = (graphName) => {
    // this code is optimized to work with vuetify Lists
    return new Promise((resolve, reject) => {
      changeGraph(graphName);
      let exposures = [];
      Graph.query(query)
        .then((res) => {
          while (res.hasNext()) {
            const record = res.next();
            const userID = record.get('exposed.userID');
            const start = record.get('e.start');
            const end = record.get('e.end');
            const placeID = record.get('s.place_id');
            const date = getDate(start);
            exposures = [
              ...exposures,
              { graphName, userID, date, start, end, placeID },
            ];
          }
          resolve(exposures);
        })
        .catch((e) => {
          reject(e);
        });
    });
  };

  graphNames.forEach((graphName) => {
    promises = [...promises, p(graphName)];
  });
  const results = Promise.all(promises);
  results.then((r) => {
    // r is an array of arrays of results, one top level element from each resolved Promise
    // so let's flatten r
    const exposures = r.flat();
    const msg =
      graphNames.length > 1
        ? `All userIDs in all ${graphNames.length} graphs used`
        : `All ${exposures.length} userIDs in ${graphNames[0]} graph`;
    console.log(logVisitors('Exposures:'));
    console.log(logVisitors(printJson(exposures)));

    if (ack) {
      ack({ msg, exposures });
    }
  });
}

function visitPromise(graphName, query) {
  return new Promise((resolve, reject) => {
    changeGraph(graphName);

    Graph.query(query)
      .then((res) => resolve(res))
      .catch((e) => reject(e));
  });
}

// use parallel processing to handle all graphNames at once
function getVisitTimes({ graphNames, userID }) {
  const query = `MATCH p=(:visitor{userID:'${userID}'})-[v:visited]->(s:space) RETURN v`;

  console.log(query);

  let promises = [];
  graphNames.forEach((graphName) => {
    promises = [...promises, visitPromise(graphName, query)];
  });
  return Promise.all(promises);
}

function changeGraph(graphName) {
  currentGraphName = graphName;
  Graph = new RedisGraph(graphName, null, null, options);
}
function getExposureQuery(userID) {
  const now = Date.now();

  return `MATCH (carrier:visitor{userID:'${userID}'})-[c:visited]->(s:space)<-[e:visited]-(exposed:visitor) 
    WHERE NOT (e.end<=c.start OR e.start>=c.end) AND c.start<${now}
    AND exposed.userID <> carrier.userID    
    RETURN exposed.userID,  id(exposed), s.place_id, id(s), c.start, c.end, id(c),  e.start, e.end, id(e) `;
}

//#region LAB
function confirmDates({ userID, dates }) {
  // return new Promise((resolve, reject) => {
  console.log('Confirming dates:', printJson(dates));
  /*
    dates can look like this:
    0:{graphName: 'Sisters OR', id: 56, start: 1635546600000, end: 1635548400000}
    1:{graphName: 'Sisters OR', id: 52, start: 1635534000000, end: 1635535800000}
    2:{graphName: 'Sisters OR', id: 51, start: 1635546600000, end: 1635548400000}
    3:{graphName: 'Sisters OR', id: 49, start: 1635798600000, end: 1635800400000}
    4:{graphName: 'Sisters OR', id: 57, start: 1635548400000, end: 1635550200000}
    */
  const getGraphQueryPromise = (e) => {
    return new Promise((resolve, reject) => {
      const q = `MATCH p=(:visitor{userID:'${userID}'})-[e:visited]->(:space) WHERE id(e)=${e.id} SET e.start=${e.start}, e.end=${e.end}`;
      console.log(q);
      changeGraph(e.graphName);
      Graph.query(q)
        .then((res) => resolve(res))
        .catch((e) => reject(e));
    });
  };

  const promises = dates.map((e) => getGraphQueryPromise(e));

  return Promise.all(promises);
}
//#endregion LAB

//#region READ Graph
function logVisit(data) {
  const { visitId, userID, place_id, start, end, graphName } = data;
  changeGraph(graphName);

  const query = `MERGE (v:visitor{  userID: '${userID}'}) 
      MERGE (s:space{ place_id:'${place_id}'}) 
      MERGE (v)-[r:visited{start:${start}, end:${end}}]->(s)
      RETURN id(r)`;
  console.log('logVisit():');
  // TODO ensure proper graphName
  console.log(query);

  // OK event handler that converts redis results into lct object
  function returnResults(results) {
    const id = results.next().get('id(r)');
    return {
      id,
      place_id,
      graphName,
      visitId,
      logged: true,
    };
  }

  // return this either-async to client
  return Graph.query(query)
    .toEither()
    .map((results) => {
      // keep graph clean in parallel
      deleteExpiredVisits();
      // pass on results of Graph.query()
      return results;
    })
    .cata({
      ok: (results) => returnResults(results),
      error: (results) => {
        // TODO shouldn't this return the same structure as ok (except logged=false)?
        console.log(results, 'Issues when logging to graph()');
      },
    });
}

// find any visitor who's start time is between the carrier's start and end times
// this function starts by deleting invalid expired nodes
// then updateGraph queries for exposed visitors returning a set of userIDs
// TODO NOTE: we can improve the intel returned to the exposed by including at least the dates
// of exposure, if not also the place (or vice versa)
// if the place is Costco, an exposed visitor might discount the risk;
// from a small coffee shop during a 30 minute stay might increase the perceived exposure risk
// Also
// we group by userID so there is only one alert sent, but it has all the exposures in it
function onExposureWarning({ graphName, userID }) {
  changeGraph(graphName);

  console.log(
    info(`Searching graph ${currentGraphName} for exposures to ${userID}`)
  );

  // updateGraph map handler
  const getResults = (data) => {
    let exposures = new Array();

    while (data.hasNext()) {
      let r = data.next();
      let exposedID = r.get('exposed.userID');
      let placeID = r.get('s.place_id');
      // carrier
      let startC = DateTime.fromMillis(r.get('c.start'));
      let endC = DateTime.fromMillis(r.get('c.end'));
      let carrierWasThere = Interval.fromDateTimes(startC, endC);

      // exposed
      let start = DateTime.fromMillis(r.get('e.start'));
      let end = DateTime.fromMillis(r.get('e.end'));
      let exposedWasThere = Interval.fromDateTimes(start, end);

      // exposure
      let exposedOn = exposedWasThere.start.toLocaleString(
        DateTime.DATE_MED_WITH_WEEKDAY
      );

      let exposure = carrierWasThere.intersection(exposedWasThere);
      let exposedFor = exposure.end
        .diff(exposure.start, nominalTime)
        .as(nominalTime);

      console.log('exposedOn:', exposedOn);
      console.log('exposedFor:', exposedFor, nominalTime);

      exposures.push({
        exposedID,
        placeID,
        exposedOn,
        exposedFor,
        nominalTime,
      });
    }
    // console.log('exposures', printJson(exposures));
    console.log(' ');
    const groupBy = (arr, fn) =>
      arr
        .map(typeof fn === 'function' ? fn : (val) => val[fn])
        .reduce((acc, val, i) => {
          acc[val] = (acc[val] || []).concat(arr[i]);
          return acc;
        }, {});
    const g = groupBy(exposures, 'exposedID');
    console.log('redis.js: grouped by userID :>', printJson(g));

    return g;
  };

  console.log(highlight(getExposureQuery(userID)));

  // called after cleaning up graph
  const updateGraph = () => {
    return Graph.query(getExposureQuery(userID))
      .toEither()
      .map((data) => getResults(data))
      .cata({
        ok: (res) => res,
        error: (error) => {
          console.log(error, 'ignored by Either');
        },
      });
  };

  // be sure we have only valid visits to query
  // return the Promise so index.onExposureWarning() can run its thenable
  return deleteExpiredVisits()
    .then(updateGraph)
    .then((exposed) => exposed);
}
//#endregion READ Graph

//#region DELETE Graph Nodes
// delegated by index.js to handle socket.on('deleteVisit')
function deleteVisit(params) {
  const { loggedVisitId, graphName } = params;
  changeGraph(graphName);
  let query = `MATCH ()-[v:visited]->() WHERE id(v)=${loggedVisitId}  DELETE v`;

  // return this either-async to client
  return Graph.query(query)
    .toEither()
    .cata({
      ok: (results) => results._statistics._raw[0],
      error: (results) => {
        console.log(results, 'Issues when deleting node on graph()');
      },
    });
}

// handled internally each time the graph gets called by
//    onExposureWarning()
//    logVisit()
// Example query:
// MATCH p=()-[v:visited]->() where (v.start<=1623628800000) RETURN p
function deleteExpiredVisits() {
  return new Promise((resolve, reject) => {
    const expiry = Date.now() - 86400000 * 10;
    let query = `MATCH ()-[v:visited]->() WHERE (v.start<${expiry})  DELETE v`;
    console.log(warn('DELETE Expired Visits query:', currentGraphName, query));
    // TODO Ensure proper graph ("Sisters" or sponsor) gets the query
    Graph.query(query)
      .then((results) => {
        const stats = results.getStatistics();
        console.log(`stats: ${printJson(stats)}`);
        resolve({ deleted: true, stat: stats._raw[0] });
      })
      .catch((error) => {
        console.error(error);
        reject({ deleted: false, error: error });
      });
  });
}
//#endregion DELETE Graph Nodes

//#region Cheatsheet
// if we store these output Cypher commands in a text file, we can bulk import them into Redis
// run this command in the terminal (outside of redis-cli)
// cat sistersCommands.txt | redis-cli --pipe

// or see https://github.com/RedisGraph/redisgraph-bulk-loader for the python way...

/*
CREATE a RELATIONSHIP between MATCHed nodes:
MERGE (v:visitor{  userID: '476d58a6686e556c'}) 
      MERGE (s:space{ name: 'Fika Sisters Coffeehouse'}) 
      MERGE (v)-[r:visited{start:1631904300000, end:1631906100000}]->(s)
      RETURN id(r)
READ visitors 
  for a given space
MATCH p=()-[*]->(:space{name:'Fika Sisters Coffeehouse'}) RETURN p

with a given visitor
  MATCH p=(carrier:visitor{userID:'4505a807b136df46'})-[c:visited]->(s:space)<-[e:visited]-(exposed:visitor) RETURN p


READ all expired RELATIONSHIPs:
MATCH p=()-[v:visited]->() where (v.start<=1623628800000) RETURN p

READ all NODES:
MATCH n=() RETURN n

READ all RELATIONSHIPs:
MATCH p=()-[*]->() RETURN p

READ Exposed Visitors:
MATCH (carrier:visitor{userID:'a6d5d013e9c5858b'})-[c:visited]->(s:space)<-[e:visited]-(exposed:visitor) 
    WHERE (e.end>=c.start OR e.start>= c.end) 
    AND exposed.userID <> carrier.userID    
    RETURN exposed.userID,  id(exposed), s.name, id(s), c.start, c.end, id(c),  e.start, e.end, id(e)
old:
MATCH  (:visitor{userID:'03390bd5fc1a7e1b'})-[v:visited]->(s:space) RETURN  s.name, id(s), v.start

FIND a user:
MATCH p=(:visitor{userID:'27bb5febacb30911'})-[v:visited]->(s:space) RETURN p

FILTER graph by RELATIONSHIP internal id:
MATCH p=()-[v:visited]->() where id(v)=9 RETURN p


UPDATE existing RELATIONSHIP
MATCH ()-[v:visited]->() where id(v)=0 set v.start=1617911100000, v.end=1617912000000
MATCH (v:visitor{ name: 'dciFoyle', userID: 'dab6b36ae9a3b438'})-[r:visited{start:1618257600000, end:1618261200000, interval:'4/12/2021, 1:00 PM TO 4/12/2021, 2:00 PM'}]->(s:space{ name: 'Sisters'}) SET r.start=1618261200000, r.end=1618264800000, r.interval='hour later'"



DELETE 
relationship:
MATCH ()-[v:visited]->() WHERE id(v)=0 DELETE v
all relationships:
MATCH ()-[v:visited]->()  DELETE v


*/

//#endregion
