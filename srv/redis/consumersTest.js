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
const here = 'consumers';

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
const { addWarnings } = require('./act');
const redis = new Redis(options);
console.log('Redis Options:', JSON.stringify(options, null, 3));

//#endregion Setup

const key = 'act:warnings',
  groupName = 'alerts',
  mpc = 'mpc',
  klc = 'klc',
  msp = 'msp',
  newMessages = '>',
  allMessages = '0',
  IDs = newMessages;

function addWarning1() {
  return redis.xadd(
    key,
    '*',
    'place_id',
    'Fika',
    ' start',
    new Date().toLocaleString(),
    ' end',
    ' 1644019200000',
    ' score',
    ' 76',
    ' reliability',
    ' 10',
    ' vid',
    ' 1b417c4079d9245a'
  );
}

function addWarning2() {
  return redis.xadd(
    key,
    '*',
    'place_id',
    'SCC',
    ' start',
    new Date().toLocaleString(),
    ' end',
    ' 1644019200000',
    ' score',
    ' 76',
    ' reliability',
    ' 10',
    ' vid',
    ' 1b417c4079d9245a'
  );
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
  // unless you first read new messages
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
      success('All messages:', `for ${consumer}`, printJson(messages))
    );
  }

  // NOTE: you cannot read all messages in a group
  // unless you first read new messages
  // XREADGROUP GROUP alerts mpc STREAMS act:warnings 0
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
  // unless you first read new messages
  // XREADGROUP GROUP alerts mpc STREAMS act:warnings 0
  return redis
    .xreadgroup('GROUP', groupName, consumer, 'STREAMS', key, ID)
    .then((messages) => report(messages))
    .catch((e) => console.log(err(e)));
}

function createConsumer(name) {
  function report(info) {
    console.log(' ');
    console.log(notice(`XGROUP CREATECONSUMER ${key} ${groupName} ${name}`));
    console.log(highlight(name, ' info :>> ', info));
  }
  return redis
    .xgroup('CREATECONSUMER', key, groupName, name)
    .then((info) => report(info));
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

async function init(rebuild = false) {
  if (rebuild) {
    // first remove consumer group(s)
    await redis
      .xgroup('DESTROY', key, groupName)
      .then((nr) => console.log(err(`deleted ${nr} consumer groups`)));
    // then set the stream length to 0
    await trimStream();
  }
  return redis
    .xgroup('CREATE', key, groupName, '$', 'MKSTREAM')
    .then((msg) => console.log(notice('msg :>> ', msg)))
    .catch(() => console.log(err('Group already exists')));
}

async function keepPromises(arr, fn) {
  const unresolved = arr.map((val) => fn(val));

  const resolved = await Promise.all(unresolved).catch((e) => {
    console.log(e);
  });
  console.log(highlight('resolved', resolved));
  return resolved;
}

const add = false;

async function test() {
  await init();
  await consumerInfo();
  if (add) {
    const promises = [addWarning1(), addWarning2()];
    Promise.all(promises).then((results) => {
      console.log('new WSIDs :>> ', printJson(results));
    });
  }
  //NOTE: getNewWarnings() will add the named consumer, if necessary
  getNewWarnings(klc);
  // NOTE: getNewWarnings() renders ALL the unsent messages
  // so subsequent calls returns nothing
  // however, getAllWarnings() returns everything from 0 (by default)
  // or by the last-delivered id (preferred method)
  // getWarningsFor(consumer, ID);
  getWarningsFor(mpc, '1644207753665');
}
test();
