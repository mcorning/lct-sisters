/**
 * There are two redis graphs:
 *    official (with some given name, e.g., 'Sisters')
 *    Sandbox (with that name)
 *
 * In production, we instantiate the official graph by default.
 *    We will instantiate Sandbox when the query includes that name.
 *
 *  In development, Sandbox is default is default graph.
 */

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
console.log(info(`Redis Graph ${currentGraphName} opened`));
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
  getVisitedSpaces,
  getVisitedPaths,
  matchQuery,
  matchWithParamsQuery,
  matchNamedPathsQuery,
  matchAllNodesQuery,
  matchAllSpacesQuery,
  matchQueryWithParamsQuery,
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
  console.log(q);
  Graph.query(q).then((res) => {
    while (res.hasNext()) {
      let record = res.next();
      let p = record.get('p');
      console.log(printJson(p));
      paths = [...paths, p];
    }
    console.log(paths);
    if (ack) {
      ack(paths);
    }
  });
}

function getVisitedSpacesForUser(userID, ack) {
  const q = `MATCH p=(:visitor{userID:'${userID}'})-[v:visited]->(s:space) RETURN v`;
  let visits = [];
  console.log(q);
  Graph.query(q).then((res) => {
    while (res.hasNext()) {
      let record = res.next();
      let v = record.get('v');
      console.log(printJson(v.id));
      visits = [
        ...visits,
        {
          id: v.id,
          start: v.properties.start,
          end: v.properties.end,
        },
      ];
    }
    console.log(visits);
    if (ack) {
      ack(visits);
    }
  });
}

// TODO can we use the entityMap to escape html elsewhere (e.g., warning email)
// and you should probably move this code to utils.js
// var entityMap = {
//   '&': '&amp;',
//   '<': '&lt;',
//   '>': '&gt;',
//   '"': '&quot;',
//   "'": '&#39;',
//   '/': '&#x2F;',
// };
function matchQuery(ack) {
  // Match query.
  const query = 'MATCH (v:visitor) RETURN v.userID';
  console.log('matchQuery(', query, ')');
  Graph.query(query)
    .then((res) => {
      const s = new Set();
      while (res.hasNext()) {
        let record = res.next();
        let userID = record.get('v.userID');
        console.log(printJson(userID));
        s.add({ userID });
      }
      if (ack) {
        ack({ msg: 'UserIDs of everybody on the graph', results: [...s] });
      }
      console.log(res.getStatistics().queryExecutionTime());
    })
    .catch((e) => {
      console.error(e);
    });
}

async function matchQueryWithParamsQuery(data, ack) {
  // TODO Research multiple params for redisgraph...
  const { query, param } = data;
  const { id, start, end } = param;
  console.log('query:', query);
  console.log('param:', param);
  //...in the meantime, just use macros
  const q = `MATCH ()-[v:visited]->() WHERE id(v)=${id} set v.start=${start}, v.end=${end}`;
  console.log(q);
  Graph.query(q).catch((e) =>
    console.error('error in matchQueryWithParamsQuery():', e)
  );

  if (ack) {
    ack({ msg: 'Query complete' });
  }
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

function getVisitors(ack) {
  matchQuery(ack);
}
function getExposures({ param, ack }) {
  matchNamedPathsQuery({ param, ack });
}
function getVisitedSpaces(param, ack) {
  getVisitedSpacesForUser(param, ack);
}

// test.js handles tha ack for the client
// function getTest({ query, param }, ack) {
//   switch (query) {
//     case 'matchAllSpacesQuery':
//       matchAllSpacesQuery(param, ack);
//       break;
//     case 'matchQuery':
//       matchQuery(param, ack);
//       break;
//     case 'matchWithParamsQuery':
//       matchWithParamsQuery(param, ack);
//       break;
//     case 'matchNamedPathsQuery':
//       matchNamedPathsQuery(param, ack);
//       break;
//     case 'matchAllNodesQuery':
//       matchAllNodesQuery(param, ack);
//       break;

//     default:
//       break;
//   }
// }

// function testGraphX(query, userID) {
//   console.log('redis.getVisitors():', query);
//   // OK event handler that converts redis results into lct object
//   function returnResults(results) {
//     const id = results.next().get('userID');
//     return {
//       id,
//     };
//   }

//   // return this either-async to client
//   return Graph.query(query, { userID })
//     .toEither()
//     .cata({
//       ok: (results) => returnResults(results),
//       error: (results) => {
//         // TODO shouldn't this return the same structure as ok (except logged=false)?
//         console.log(results, 'Issues when testing graph');
//       },
//     });
// }

function changeGraph(graphName) {
  currentGraphName = graphName;
  Graph = new RedisGraph(graphName, null, null, options);
  console.log(highlight(`Graph now using ${graphName}`));
}

//#region LAB
async function matchNamedPathsQuery({ param, ack }) {
  const { userID } = param;
  console.log(param);
  const now = Date.now();
  // Named paths matching.
  const q = `MATCH (carrier:visitor{userID:'${userID}'})-[c:visited]->(s:space)<-[e:visited]-(exposed:visitor) 
    WHERE NOT (e.end<=c.start OR e.start>=c.end) AND c.start<${now}
    AND exposed.userID <> carrier.userID    
    RETURN exposed.userID,  id(exposed), s.name, id(s), c.start, c.end, id(c),  e.start, e.end, id(e) `;
  console.log(userID);
  console.log(Graph._graphId);
  console.log(q);

  const s = new Set();

  const res = await Graph.query(q);
  while (res.hasNext()) {
    const record = res.next();
    const userID = record.get('exposed.userID');
    const start = record.get('e.start');
    const end = record.get('e.end');
    const space = record.get('s.name');
    const payload = { userID, start, end, space };
    console.log(printJson(payload));
    s.add(payload);
  }
  if (ack) {
    // test.js handles callback
    ack({
      msg: 'ID(s) of all exposed visitors:',
      results: [...s],
    });
  }
}

function logVisit(data) {
  // TODO CONSIDER: if we want to store sessionID, we pass it in through data arg
  // but this may have side effectes in MERGE since i think we would have to always
  // pass both userID and sessionID to the graph (test this premise)
  // const { visitId, userID, place, start, end, graphName, sessionID } = data;
  const { visitId, userID, place, start, end, graphName } = data;

  // if (action.edit) {
  //   this.deleteVisit({loggedVisitId:visitId})
  // }
  function escapeHtml(string) {
    return String(string).replace(/[&<>"'/]/g, function(s) {
      // here we just escape strings characters
      return `\\${s}`;
      // this is how you escape HTML
      // return entityMap[s];
    });
  }

  // TODO ALERT: put this back after you work out the optimal query design
  // if ((graphName && graphName !== currentGraphName)) {
  changeGraph('Test');
  // changeGraph(graphName);
  // }

  // TODO CONSIDER: if we want to store sessionID, we pass it in through data arg
  // const query = `MERGE (v:visitor{  userID: '${userID}', sessionID:'${sessionID}'})
  const query = `MERGE (v:visitor{  userID: '${userID}'}) 
      MERGE (s:space{ name: '${escapeHtml(place)}'}) 
      MERGE (v)-[r:visited{start:${start}, end:${end}}]->(s)
      RETURN id(r)`;
  console.log('logVisit():');
  console.log(query);

  // OK event handler that converts redis results into lct object
  function returnResults(results) {
    const id = results.next().get('id(r)');
    return {
      id,
      place,
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

//#endregion LAB

//#region READ Graph
// see if an alerted visitor has potential alerts to share
function findExposedVisitors(userID, subject = false) {
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

        printExposedVisitors(res);
        const others = [
          ...new Set(res._results.map((v) => v._values).map((v) => v[0])),
        ];
        resolve(others);
      })
    );
  });

  function printExposedVisitors(res) {
    console.log(success(`\n${subject ? 'Patient Zero' : 'Exposed'}:`));
    const rec = res._results[0];
    console.log(rec.get('id(a)'), userID, rec.get('a.name'), 'visited:');

    while (res.hasNext()) {
      let record = res.next();
      let start = new Date(record.get('v.start') / 1).toLocaleString();
      let end = new Date(record.get('v.end') / 1).toLocaleString();
      let vid = record.get('id(v)');
      let sid = record.get('id(s)');

      console.log(
        ' '.repeat(19),
        vid < 10 ? ' ' : '',
        vid,
        ' '.repeat(vid / 100),
        record.get('v.start'),
        '=',
        start,
        ' '.repeat(25 - start.length),

        record.get('v.end'),
        '=',
        end,
        ' '.repeat(25 - end.length),

        sid < 10 ? ' ' : '',
        sid,
        record.get('s.name')
      );
    }
  }
}

// find any visitor who's start time is between the carrier's start and end times
function onExposureWarning(userID) {
  console.log('Searching graph with', userID);
  console.log(info('Current graph name:', currentGraphName));
  const now = Date.now();
  // TODO refactor so this function and getExposures() uses the same query string
  const getQuery = (userID) => {
    return `MATCH p=(carrier:visitor{userID:'${userID}'})-[c:visited]->(s:space)<-[e:visited]-(exposed:visitor)
    WHERE NOT (e.end<=c.start OR e.start>=c.end) AND c.start<${now}
    AND exposed.userID <> carrier.userID    
    RETURN exposed.userID,  id(exposed), s.name, id(s), c.start, c.end, id(c),  e.start, e.end, id(e) `;
  };
  const getUserIDs = (results, fnc) => [...new Set(results.map(fnc))];

  console.log(highlight(getQuery(userID)));

  const updateGraph = () => {
    return Graph.query(getQuery(userID))
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
// delegated in index.js to handle socket.on('deleteVisit')
function deleteVisit(data) {
  const { loggedVisitId, graphName } = data;

  if (graphName && graphName !== currentGraphName) {
    changeGraph(graphName);
  }

  // Graph.query() arg
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

//#region Old code -- delete or refactor soon

// TODO refactor using cli table
// function printExposureWarnings(res) {
//   console.log(
//     warn(`
//     Visits on or after exposure by ${userID}:
//     `)
//   );
//   // console.log(
//   //   '123456791123456789212345679012345678931234567901234567894123456795123456789612345678981234567899123456789100'
//   // );
//   while (res.hasNext()) {
//     let record = res.next();
//     let startC = new Date(record.get('c.start') / 1).toLocaleString();
//     let endC = new Date(record.get('c.end') / 1).toLocaleString();
//     let startE = new Date(record.get('e.start') / 1).toLocaleString();
//     let endE = new Date(record.get('e.end') / 1).toLocaleString();

//     let userID = record.get('exposed.userID');
//     let exposedId = record.get('id(exposed)');
//     let eid = record.get('id(e)');
//     let sid = record.get('id(s)');

//     console.log(
//       userID,
//       'left',
//       record.get('e.end') >= record.get('c.start') ? 'after' : 'before',
//       'carrier arrived'
//     );
//     console.log(endE, startC);

//     console.log(
//       userID,
//       'arrived',
//       record.get('e.start') <= record.get('c.end') ? 'before' : 'after',
//       'carrier left'
//     );
//     console.log(startE, endC);
//     console.log(' ');
//     printTable(
//       exposedId,
//       eid,
//       sid,
//       userID,
//       record,
//       startC,
//       endC,
//       startE,
//       endE
//     );
//   }
// }

// function printTable(
//   exposedId,
//   eid,
//   sid,
//   userID,
//   record,
//   startC,
//   endC,
//   startE,
//   endE
// ) {
//   console.log(
//     exposedId < 10 ? ' ' : '',
//     exposedId,

//     userID,
//     ' '.repeat(20 - userID.length),

//     eid < 10 ? ' ' : '',
//     eid,
//     record.get('c.start'),
//     '=',
//     startC,
//     ' '.repeat(25 - startC.length),
//     record.get('c.end'),
//     '=',
//     endC,
//     ' '.repeat(25 - endC.length),

//     record.get('e.start'),
//     '=',
//     startE,
//     ' '.repeat(25 - startE.length),
//     record.get('e.end'),
//     '=',
//     endE,
//     ' '.repeat(25 - endE.length),

//     sid < 10 ? ' ' : '',
//     sid,
//     record.get('s.name')
//   );
// }
// }

// delegated in index.js to handle socket.on('logVisit')
// Can add a visit to the graph or can edit the time(s) of a logged visit [when the data includes the logged field (which is the id of the Relationship)]
// Example query:
// MERGE (v:visitor{ name: 'hero', userID: '439ae5f4946d2d5d'}) MERGE (s:space{ name: 'Fika Sisters Coffeehouse'}) MERGE (v)-[:visited{start:'1615856400000'}]->(s)
// function logVisit(data) {
//   return new Promise((resolve, reject) => {
//     const {
//       username,
//       userID,
//       selectedSpace,
//       start,
//       end,
//       date,
//       interval,
//       loggedVisitId,
//       graphName,
//     } = data;
//     if (graphName && graphName !== graphName) {
//       changeGraph(graphName);
//     }

//     // update visit with loggedVisitId
//     // or add a new visit
//     // note: be sure any freeform text field (like username and selectedSpace) is wrapped in ""
//     // (otherwise, an apostrophe will throw an exception)
//     let query = loggedVisitId
//       ? `MATCH ()-[v:visited]->() WHERE id(v)=${loggedVisitId}
//       SET
//       v.start=${start},
//       v.end=${end},
//       v.date='${date}',
//       v.interval='${interval}'
//       RETURN id(v)`
//       : `MERGE (v:visitor{ name: "${username}", userID: '${userID}'})
//       MERGE (s:space{ name: "${selectedSpace}"})
//       MERGE (v)-[r:visited{start:${start}, end:${end}, date: '${date}', interval: '${interval}'}]->(s)
//         RETURN id(r)`;

//     console.log(warn(`${graphName} visit query: ${query}`));
//     Graph.query(query)
//       .then((results) => {
//         let x = results.next();
//         let id = x.get('id(r)');
//         if (!id) {
//           throw `${graphName} returned unexpected null id after update.`;
//         }

//         const stats = results._statistics._raw;
//         console.log(special(`Logged visit stats: ${printJson(stats)}`));
//         console.log(special(`New Visit graph ID: ${printJson(id)}`));
//         resolve({
//           graph: graphName,
//           logged: true,
//           id: id,
//         });
//       })
//       .then(() => deleteExpiredVisits())
//       .catch((error) => {
//         console.log(error);
//         reject({
//           logged: false,
//           error: error,
//         });
//       });
//   });
// }
//#endregion Update Graph
//#endregion

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
