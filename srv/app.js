const RedisGraph = require('redisgraph.js').Graph;
require('either-async');

const { DateTime } = require('../src/utils/luxonHelpers');
const { success, printJson } = require('../src/utils/helpers');
let options;

if (process.env.NODE_ENV === 'production') {
  console.log('Dereferencing process.env');
  options = {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
  };
} else {
  console.log('Dereferencing redisConfig.js');

  const graphOptions = require('./redis/redisGraph.options.js');
  options = {
    host: graphOptions.redisHost,
    port: graphOptions.redisPort,
    password: graphOptions.redisPassword,
  };
}
const Redis = require('ioredis');
const redis = new Redis(options);
let Graph = new RedisGraph('lab', null, null, options);

//#region
// const redisPool = require('redis-connection-pool')('myRedisPool', {
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

// redisPool.set('test-key', 'foobar', function() {
//   redisPool.get('test-key', function(err, reply) {
//     console.log(reply); // 'foobar'
//   });
// });
//#endregion

const channel = 'events';
let lastID = 0;

function makeGraph({ placeID, uid, start, end, tag }) {
  function addNode({ place_id, uid, start, end }) {
    const query = `MERGE (v:visitor{  uid: '${uid}'}) 
      MERGE (s:space{ place_id:'${place_id}'}) 
      MERGE (v)-[r:visited{start:${start}, end:${end}}]->(s)
      RETURN id(r)`;
    console.log('logVisit():');
    console.log(query);

    // OK event handler that converts redis results into lct object
    function returnResults(results) {
      const id = results.next().get('id(r)');
      return {
        id,
        place_id,
        logged: true,
      };
    }

    // return this either-async to client
    return Graph.query(query)
      .toEither()
      .map((results) => {
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
  function deleteNode({ place_id, uid, start, end }) {
    let query = `MATCH (v:visitor{  uid: '${uid}'})-[r:visited{start:${start}, end:${end}}]->(s:space{ place_id:'${place_id}'})   DELETE r`;
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

  if (tag === '+') {
    addNode({ place_id: placeID, uid, start, end });
  } else if (tag === '-') {
    // where is deleteNode getting loggedVisitId from?
    deleteNode({ place_id: placeID, uid, start, end });
  }
}

function addEvent({ placeID, uid, start, end, tag }) {
  return redis.xadd(
    channel,
    '*',
    'placeID',
    placeID,
    'uid',
    uid,
    'start',
    start,
    'end',
    end,
    'tag',
    tag
  );
}
function consumer() {
  return redis.xread(['STREAMS', channel, lastID]).then((stream) => {
    console.log(JSON.stringify(stream, null, 3));

    const visits = new Map(stream);
    console.log(
      `Reading visits from channel ${channel}, found ${visits.size} visits.`
    );
    let zipped;
    visits.forEach((visitData, channel) => {
      console.log(channel);
      let visits = new Map(visitData);
      visits.forEach((visit, id) => {
        console.log('visit ID:', id);
        let names = visit.filter((v, i) => i % 2 === 0);
        let values = visit.filter((v, i) => i % 2 !== 0);
        zipped = names.map(function(name, i) {
          return { [name]: values[i] };
        });
        console.log(JSON.stringify(zipped, null, 3));
        let event = zipped.reduce((a, c) => {
          return { ...a, ...c };
        }, {});
        console.log(event);
        // we may want to record stats
        let results = makeGraph(event);
        console.log(results);
      });
    });
    return zipped;
  });
}
function test1() {
  const add = false;
  let now, then, data;
  if (add) {
    //#region Simulate changing event to tomorrow
    // TODO PROVE:
    // that LCT records a delete event in the stream for the original event
    // and adds an event to the stream for the updated event
    now = DateTime.now();
    then = now.plus({ hours: 1 });
    data = {
      placeID: 'ChIJFWkctxkxv1QRLhhGQdCn4gE',
      uid: '2ebbb7d06677456a',
      start: now.toMillis(),
      end: then.toMillis(),
      tag: '+',
    };
    addEvent(data).then((id) => console.log(id));

    data = {
      placeID: 'ChIJFWkctxkxv1QRLhhGQdCn4gE',
      uid: '2ebbb7d06677456a',
      start: now.toMillis(),
      end: then.toMillis(),
      tag: '-',
    };
    addEvent(data).then((id) => console.log(id));

    now = DateTime.now();
    then = now.plus({ days: 1 });
    data = {
      placeID: 'ChIJFWkctxkxv1QRLhhGQdCn4gE',
      uid: '2ebbb7d06677456a',
      start: now.toMillis(),
      end: then.toMillis(),
      tag: '+',
    };
    addEvent(data).then((id) => console.log(id));
    //#endregion

    now = DateTime.now();
    then = now.plus({ hours: 1 });
    data = {
      placeID: 'ChIJ7x-9lsowv1QRRHltX_h74S8',
      uid: '2ebbb7d06677456a',
      start: now.toMillis(),
      end: then.toMillis(),
      tag: '+',
    };
    addEvent(data).then((id) => console.log(id));

    now = DateTime.now();
    then = now.plus({ hours: 1 });
    data = {
      placeID: 'ChIJ7x-9lsowv1QRRHltX_h74S8',
      uid: 'df494086c836d25b',
      start: now.toMillis(),
      end: then.toMillis(),
      tag: '+',
    };
    addEvent(data).then((id) => console.log(id));
  }
  // graph all events
  //   consumer().then((results) => console.log(success(printJson(results))));
}
function test2(uid, ack) {
  redis.xadd('lottery', '*', 'uid', uid).then((confirmed) => {
    if (ack) ack(confirmed);
  });
}
function test(arg) {
  if (arg === 1) {
    test1();
  } else if (arg === 2) {
    test2('test');
  }
}
test(2);
