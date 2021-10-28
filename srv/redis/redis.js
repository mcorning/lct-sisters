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
  success,
} = require('../../src/utils/helpers');
// const { DateTime } = require('../../src/utils/luxonHelpers');

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

const host = options.host;

console.log(highlight('Redis Options:', printJson(options)));

let Graph = new RedisGraph(currentGraphName, null, null, options);
console.log(info(`At initialization, Redis Graph opened ${currentGraphName}`));
module.exports = {
  currentGraphName,
  host,
  getSessionID,
  deleteVisit,
  findExposedVisitors,
  changeGraph,
  logVisit,
  onExposureWarning,
  options,
  getVisitors,
  getExposures,
  getVisitTimes,
  getVisitedPaths,
  matchWithParamsQuery,
  matchAllNodesQuery,
  matchAllSpacesQuery,
  setStartEnd,
  confirmDates,
};
//#endregion Setup
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

  console.log('param:', param);
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

function getVisitors(graphNames, ack) {
  const query = 'MATCH (v:visitor) RETURN v.userID';
  const results = new Map();

  console.log('matchQuery(', query, ')');
  console.log('graphNames:', printJson(graphNames));

  graphNames.forEach((g) => {
    changeGraph(g);

    Graph.query(query)
      .then((res) => {
        while (res.hasNext()) {
          let record = res.next();
          let userID = record.get('v.userID');
          results.set(g, userID);
        }
        if (ack) {
          ack({
            msg: 'UserIDs of everybody on all used graphs',
            results: [...results],
          });
        }
      })
      .catch((e) => {
        console.error(e);
      });
  });
}

function getExposures({ graphNames, userID }, ack) {
  // Named paths matching.
  const q = getExposureQuery(userID);
  console.log('Exposure query:', q);

  const results = new Map();
  graphNames.map((g) => {
    console.log(
      info(
        `Searching graph ${currentGraphName} for ${userID}'s potential exposures.'`
      )
    );
    changeGraph(g);
    Graph.query(q).then((res) => {
      while (res.hasNext()) {
        const record = res.next();
        const userID = record.get('exposed.userID');
        const start = record.get('e.start');
        const end = record.get('e.end');
        const placeID = record.get('s.place_id');
        const payload = { userID, start, end, placeID };
        console.log(printJson(payload));
        results.set(g, payload);
      }
    });
  });
  if (ack) {
    // test.js handles callback
    ack({
      msg: 'ID(s) of all exposed visitors:',
      results: [...results],
    });
  }
}

function getVisitTimes({ graphNames, userID }, ack) {
  const q = `MATCH p=(:visitor{userID:'${userID}'})-[v:visited]->(s:space) RETURN v`;
  let visits = [];
  console.log(q);

  const query = (g) => {
    Graph.query(q).then((res) => {
      console.log(g);
      while (res.hasNext()) {
        let record = res.next();
        let v = record.get('v');
        visits = [
          ...visits,
          {
            id: v.id,
            start: v.properties.start,
            end: v.properties.end,
            graphName: g,
          },
        ];
      }
      console.log('visits:', printJson(visits));
      if (ack) {
        ack(visits);
      }
    });
  };

  graphNames.forEach((g) => {
    changeGraph(g);
    query(g);
  });
}

function changeGraph(graphName) {
  currentGraphName = graphName;
  Graph = new RedisGraph(graphName, null, null, options);
  console.log(highlight(`Graph now using ${graphName}`));
}
function getExposureQuery(userID) {
  const now = Date.now();

  return `MATCH (carrier:visitor{userID:'${userID}'})-[c:visited]->(s:space)<-[e:visited]-(exposed:visitor) 
    WHERE NOT (e.end<=c.start OR e.start>=c.end) AND c.start<${now}
    AND exposed.userID <> carrier.userID    
    RETURN exposed.userID,  id(exposed), s.place_id, id(s), c.start, c.end, id(c),  e.start, e.end, id(e) `;
}

//#region LAB
function confirmDates(data, ack) {
  const { userID, dates } = data;
  let m;
  console.log(dates);
  console.log('currentGraphName:', currentGraphName);
  const q = `MATCH p=(:visitor{userID:'${userID}'})-[e:visited]->(:space) return e`;
  console.log('confirmDates query:', q);
  const processResults = (res) => {
    while (res.hasNext()) {
      let record = res.next();
      const e = record.get('e');
      const d = dates.find((v) => v.id === e.id);
      console.log(warn('local dates:', d.id, d.start, d.end));
      console.log('graph edge:', e.id, e.properties.start, e.properties.end);
      if (e.properties.start !== d.start) {
        const setQ = `MATCH ()-[e:visited]->()  WHERE id(e)=${e.id} SET e.start=${d.start}`;
        console.log(setQ);
        Graph.query(setQ)
          .then((res) => {
            console.log(success(res._statistics._raw));
            return (m = [...m, { msg: res._statistics._raw }]);
          })
          .catch((e) => console.error('error in confirmDates():', e));
      }

      if (e.properties.end !== d.end) {
        const setQ2 = `MATCH ()-[e:visited]->()  WHERE id(e)=${e.id} SET e.end=${d.end}`;
        console.log(setQ2);
        Graph.query(setQ2)
          .then((res) => {
            console.log(success(res._statistics._raw));
            return (m = [...m, { msg: res._statistics._raw }]);
          })
          .catch((e) => console.error('error in confirmDates():', e));
      }
    }
  };
  Graph.query(q)
    .then((res) => {
      processResults(res);
      const msgs = m ?? 'No changes';
      return { msgs };
    })
    .then((results) => {
      if (ack) {
        ack(results);
      }
    })
    .catch((e) => console.error('error in confirmDates():', e));
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
    .cata({
      ok: (results) => returnResults(results),
      error: (results) => {
        // TODO shouldn't this return the same structure as ok (except logged=false)?
        console.log(results, 'Issues when logging to graph()');
      },
    });
}

// see if an alerted visitor has potential alerts to share
// function findExposedVisitors(userID, subject = false) {
function findExposedVisitors(userID) {
  return new Promise(function(resolve) {
    // be sure we have only valid visits to query
    deleteExpiredVisits().then(() =>
      Graph.query(
        `MATCH (a:visitor{userID:'${userID}'})-[v:visited]->(s:space)
      RETURN a.userID, a.name, id(a), s.name, id(s), v.start, v.end, id(v), id(s)`
      ).then((res) => {
        if (!res._results.length) {
          console.log(userID, 'exposed nobody');
          return resolve(userID);
        }

        // printExposedVisitors(res);
        const others = [
          ...new Set(res._results.map((v) => v._values).map((v) => v[0])),
        ];
        console.log('Exposed visitors:', others);
        resolve(others);
      })
    );
  });
}

// find any visitor who's start time is between the carrier's start and end times
function onExposureWarning({ graphName, userID }) {
  changeGraph(graphName);

  console.log(
    info(`Searching graph ${currentGraphName} for exposures to ${userID}`)
  );
  // TODO Be sure currentGraphName is appropriate for the visitor and not simply the default graph from the environment
  // const now = Date.now();
  // TODO refactor so this function and getExposures() uses the same query string
  // const getQuery = (userID) => {
  //   return `MATCH p=(carrier:visitor{userID:'${userID}'})-[c:visited]->(s:space)<-[e:visited]-(exposed:visitor)
  //   WHERE NOT (e.end<=c.start OR e.start>=c.end) AND c.start<${now}
  //   AND exposed.userID <> carrier.userID
  //   RETURN exposed.userID,  id(exposed), s.name, id(s), c.start, c.end, id(c),  e.start, e.end, id(e) `;
  // };
  const getUserIDs = (results, fnc) => [...new Set(results.map(fnc))];

  console.log(highlight(getExposureQuery(userID)));

  const updateGraph = () => {
    return Graph.query(getExposureQuery(userID))
      .toEither()
      .cata({
        // ok: (userIDs) => userIDs,
        ok: (res) => getUserIDs(res._results, (v) => v._values[0]),
        error: (error) => {
          console.log(error, 'ignored by Either');
        },
      });
  };

  // be sure we have only valid visits to query
  // return the Promise so index.onExposureWarning() can run its thenable
  return deleteExpiredVisits()
    .then(updateGraph)
    .then((userIDs) => userIDs);
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

// handled internally each time the graph gets called
// Example query:
// MATCH p=()-[v:visited]->() where (v.start<=1623628800000) RETURN p
function deleteExpiredVisits() {
  return new Promise((resolve, reject) => {
    const expiry = Date.now() - 86400000 * 14;
    let query = `MATCH ()-[v:visited]->() WHERE (v.start<=${expiry})  DELETE v`;
    console.log(warn('DELETE Expired Visits query:', query));
    // TODO Ensure proper graph ("Sisters" or sponsor) gets the query
    Graph.query(query)
      .then((results) => {
        const stats = results._statistics._raw;
        console.log(`stats: ${printJson(stats)}`);
        resolve({ deleted: true });
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
