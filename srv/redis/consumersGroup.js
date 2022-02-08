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

const here = 'consumers';
const set = 'last-delivered-id';
const key = 'act:warnings',
  groupName = 'alerts',
  mpc = 'mpc',
  klc = 'klc',
  msp = 'msp',
  newMessages = '>',
  allMessages = '0',
  IDs = newMessages;

function getLastDeliveredID(consumer) {
  return redis
    .hget(set, consumer)
    .then((id) => id)
    .catch((e) => console.log(err(e)));
}
function updateLastDeliveredID(consumer, id) {
  function report(messages) {
    console.log(' ');
    console.log(notice(`HSET ${set} ${consumer} ${id}`));
    console.log(success(`last-delivered-id for ${consumer}: ${id}`));
  }
  return redis
    .hset(set, consumer, id)
    .then((messages) => report(messages))
    .catch((e) => console.log(err(e)));
}
async function getWarningIDFor(consumer) {
  const id = await getLastDeliveredID(consumer);
  if (!id) {
    updateLastDeliveredID(consumer, 0);
    return 0;
  }
  return id;
}

async function getWarnings(consumer) {
  const id = await getWarningIDFor(consumer);

  const ID = id === '0' ? '0' : '$';
  function report(messages) {
    console.log(' ');
    console.log(notice(`XREAD BLOCK 0 STREAMS ${key} ${ID}`));
    console.log(
      success('New messages:', `for ${consumer}`, printJson(messages))
    );
  }

  return redis
    .xread('STREAMS', key, ID)
    .then((messages) => report(messages))
    .catch((e) => console.log(err(e)));
}

function addWarnings(biz) {
  const start = DateTime.now();
  const tag = formatTime(start.toMillis());
  const end = '=================================='; //start.plus({ minutes: 25 });
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
function groupInfo() {
  console.log(' ');
  console.log(notice(`XINFO GROUPS ${key} `));
  return redis
    .xinfo('GROUPS', key)
    .then((info) => console.log(highlight('1) GROUPS info:', printJson(info))));
}
function consumerInfo() {
  console.log(' ');
  console.log(notice(`XINFO CONSUMERS ${key} ${groupName}`));
  return redis
    .xinfo('CONSUMERS', key, groupName)
    .then((info) =>
      console.log(highlight('1) Consumer info:', printJson(info)))
    );
}

function getNewWarnings(consumer) {
  const ID = newMessages;
  function report(messages) {
    console.log(' ');
    console.log(
      notice(`XREADGROUP GROUP ${groupName} ${consumer} STREAMS ${key} ${ID}`)
    );
    console.log(
      success('New messages:', `for ${consumer}`, printJson(messages))
    );
  }

  // NOTE: you cannot read all messages in a group
  // unless you first read new messages:
  // XREADGROUP GROUP alerts mpc STREAMS act:warnings >
  return redis
    .xreadgroup('GROUP', groupName, consumer, 'STREAMS', key, ID)
    .then((messages) => report(messages))
    .catch((e) => console.log(err(e)));
}

function getWarningsFor(consumer, ID) {
  function report(messages) {
    console.log(' ');
    console.log(
      notice(`XREADGROUP GROUP ${groupName} ${consumer} STREAMS ${key} ${ID}`)
    );
    console.log(
      success(
        'Messages:',
        `for ${consumer}`,
        `since ${ID}`,
        printJson(messages)
      )
    );
  }

  // NOTE: you can get to a specific entry before reading new messages?
  // XREADGROUP GROUP alerts mpc STREAMS act:warnings [last-delivered-id]
  return redis
    .xreadgroup('GROUP', groupName, consumer, 'STREAMS', key, ID)
    .then((messages) => report(messages))
    .catch((e) => console.log(err(e)));
}

function getAllWarnings(consumer) {
  const ID = allMessages;

  function report(messages) {
    console.log(' ');
    console.log(
      notice(`XREADGROUP GROUP ${groupName} ${consumer} STREAMS ${key} ${ID}`)
    );
    console.log(
      success('All messages:', `for ${consumer}`, printJson(messages))
    );
  }

  // NOTE: you cannot read all messages in a group
  // unless you first read new messages (see above)
  // XREADGROUP GROUP alerts mpc STREAMS act:warnings 0
  return redis
    .xreadgroup('GROUP', groupName, consumer, 'STREAMS', key, ID)
    .then((messages) => report(messages))
    .catch((e) => console.log(err(e)));
}

function deleteConsumer(consumer) {
  return redis
    .xgroup('DELCONSUMER', key, groupName, consumer)
    .then((info) => console.log(err('After deleting consumer :>> ', info)));
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

async function init(rebuild = false) {
  if (rebuild) {
    // first remove consumer group(s)
    await redis
      .xgroup('DESTROY', key, groupName)
      .then((nr) => console.log(err(`deleted ${nr} consumer groups`)));
    // then set the stream length to 0
    await trimStream();
    await keepPromises(['Fika', 'SCC', 'The Barn'], addWarnings);
  }
  // ensure a GROUP exits
  // return redis
  //   .xgroup('CREATE', key, groupName, '$', 'MKSTREAM')
  //   .then((msg) => console.log(notice('Group created :>> ', msg)))
  //   .catch(() => console.log(err('Group already exists')));
}

async function blockingConsumerRead(consumer) {
  let i = 0;
  const ID = await getLastDeliveredID(consumer);
  const id = ID === 0 ? '>' : ID;

  while (run) {
    redis
      .xreadgroup(
        'GROUP',
        groupName,
        consumer,
        'BLOCK',
        10000,
        'STREAMS',
        key,
        id
      )
      .then((entries) => {
        entries?.forEach((element) => {
          if (element[1][0]) {
            const newID = element[1][0][0];
            updateLastDeliveredID(consumer, newID);
            console.log(`New ID: ${newID}`);
          }
        });
      });
    console.log(i++);
    // await addWarnings('another new place');
  }
}

async function consumerLoggedOn(consumer) {
  await getWarnings(consumer);
  redis.xpending(key, groupName).then((results) => {
    console.log('results :>> ', results);
  });
  // blockingConsumerRead(consumer);
}

let run = true;

const add = true;

async function test() {
  await init(true);
  // init(true) means we should see the new consumer see the new messages
  // await getNewWarnings(mpc);

  // await groupInfo();
  // await consumerInfo();
  await getWarnings(mpc);

  // if (add) {
  await addWarnings('new place');
  // }
  getWarnings(mpc);

  //NOTE: getNewWarnings() will add the named consumer, if necessary
  // await getNewWarnings(mpc);
  // NOTE: getNewWarnings() renders ALL the unsent messages
  // so subsequent calls returns nothing
  // however, getAllWarnings() returns everything from 0 (by default)
  // or by the last-delivered id (preferred method)
  // getWarningsFor(consumer, ID);
  // await getWarningsFor(mpc, '1644267633945');
}
test();
