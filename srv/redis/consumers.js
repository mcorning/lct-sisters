// you may find this read https://redis.io/topics/streams-intro
// very helpfull as a starter to understand the usescases and the parameters used
// SEE: https://github.com/luin/ioredis/blob/master/examples/redis_streams.js
//#region Setup
const {
  err,
  highlight,
  notice,
  success,
  printJson,
} = require('../../src/utils/helpers');
const { isEmpty } = require('../utils');
const { DateTime, formatTime } = require('../../src/utils/luxonHelpers');
const {
  groupBy,
  objectFromStream,
  objectFromStreamEntry,
} = require('../utils.js');
let options;
if (process.env.NODE_ENV === 'production') {
  console.log('Dereferencing process.env');
  options = {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
  };
} else {
  const lctJsonOptions = require('./redisJson.options.js');
  options = {
    host: lctJsonOptions.redisHost,
    port: lctJsonOptions.redisPort,
    password: lctJsonOptions.redisPassword,
  };
}

const Redis = require('ioredis');
const redis = new Redis(options);
console.log('Redis Options:', JSON.stringify(options, null, 3));

//#endregion Setup

const set = 'last-delivered-id';
const key = 'act:warnings';

function getLastDeliveredID(consumer) {
  return redis
    .hget(set, consumer)
    .then((id) => id)
    .catch((e) => console.log(err(e)));
}
function updateLastDeliveredID(consumer, id) {
  function report() {
    console.log(' ');
    console.log(notice(`HSET ${set} ${consumer} ${id}`));
    console.log(success(`last-delivered-id for ${consumer}: ${id}`));
  }
  return redis
    .hset(set, consumer, id)
    .then(() => report())
    .catch((e) => console.log(err(e)));
}

function addWarnings(biz) {
  if (!biz) {
    return;
  }
  const start = DateTime.now();
  const tag = formatTime(start.toMillis());
  console.log(tag);
  const end = '==================================';
  return redis.xadd(
    key,
    '*',
    'tag',
    tag,
    'place_id',
    biz,
    // ' start',
    // start,
    ' end',
    end
  );
}

//#region Functions
const TIMEOUT = 1000;
function blockForNewWarnings() {
  function report(id) {
    console.log(' ');
    console.log(notice(`XREAD BLOCK TIMEOUT STREAMS ${key} $`));
    console.log(success('BLOCKing on FIRST new message FROM:', printJson(id)));
    return id;
  }

  return redis
    .xread('BLOCK', TIMEOUT, 'STREAMS', key, '$')
    .then(() => addWarnings('anything'))
    .then((id) => report(id))
    .then((id) => getWarnings(id))
    .catch((e) => console.log(err(e)));
}

function getWarnings(ID = '0') {
  console.log('ID :>> ', ID);
  function report(id) {
    console.log(' ');
    console.log(notice(`XREAD BLOCK TIMEOUT STREAMS ${key} ${ID}`));
    console.log(success('BLOCKing on new message FROM:', printJson(id)));
    return id;
  }

  return (
    redis
      .xread('BLOCK', TIMEOUT, 'STREAMS', key, ID)
      .then(() => addWarnings('anything else'))
      // .then((id) => report(id))
      .then(() => addWarnings('NOPE. ALL DONE'))
      .then((id) => report(id))
      .catch((e) => console.log(err(e)))
  );
}

async function trimStream() {
  return redis
    .xtrim(key, 'MAXLEN', '~', 0)
    .then((nr) => console.log(highlight(`${nr} messages deleted`)));
}
/**
 * Given an array of values, return an array of promises that resolve to the values
 * @param arr - An array of values to be passed to the function.
 * @param fn - The function that will be called for each item in the array.
 * @returns The resolved IDs.
 */
async function keepPromises(arr, fn) {
  const unresolved = arr.map((val) => fn(val));

  const resolved = await Promise.all(unresolved).catch((e) => {
    console.log(e);
  });
  console.log(highlight('Promised IDs :>> ', resolved));
  return resolved;
}
//#endregion

async function init(proceed = false) {
  if (proceed) {
    await trimStream();
    await keepPromises(['Fika', 'SCC', 'The Barn'], addWarnings);
  }
}

async function test() {
  await init(true);
  const x = await redis.xread('BLOCK', TIMEOUT, 'STREAMS', key, '$');
  addWarnings('one more thing');
  console.log('x :>> ', x);
  // await blockForNewWarnings();
}
test();
