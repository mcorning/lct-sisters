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
const redis = new Redis(options);
console.log('Redis Options:', JSON.stringify(options, null, 3));

//#endregion Setup

const key = 'act:warnings',
  groupName = 'alerts',
  consumer = 'mpc',
  consumer2 = 'klc',
  newMessages = '>',
  allMessages = '0',
  IDs = newMessages;

const initialize = async () => {
  // if group exists, returns a harmless message
  await redis
    .xgroup('CREATE', key, groupName, '$', 'MKSTREAM')
    .then((msg) => console.log(notice('msg :>> ', msg)))
    .catch(() => console.log(err('Group already exists')));

  console.log(notice(`XGROUP CREATECONSUMER ${key} ${groupName} ${consumer}`));
  await redis
    .xgroup('CREATECONSUMER', key, groupName, consumer)
    .then((info) => console.log(highlight('mpc info :>> ', info)));

  console.log(notice(`XGROUP CREATECONSUMER ${key} ${groupName} ${consumer2}`));
  await redis
    .xgroup('CREATECONSUMER', key, groupName, consumer2)
    .then((info) => console.log(highlight('klc info :>> ', info)));

  console.log(notice(`XINFO GROUPS ${key} `));
  await redis
    .xinfo('GROUPS', key)
    .then((info) => console.log(highlight('Group info:', printJson(info))));
  console.log('=======================================================\n');
};

async function start() {
  await initialize();
  const add = true;
  if (add) {
    redis
      .xadd(
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
      )
      .then(() =>
        redis.xadd(
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
        )
      )
      .then(() => console.log(notice(`XINFO CONSUMERS ${key} ${groupName}`)))
      .then(() =>
        redis
          .xinfo('CONSUMERS', key, groupName)
          .then((info) =>
            console.log(highlight('1) Consumer info:', printJson(info)))
          )
      )
      .then(() =>
        console.log(
          notice(
            `XREADGROUP GROUP ${groupName} ${consumer} STREAMS ${key} ${IDs}`
          )
        )
      )
      .then(() =>
        // NOTE: you cannot read all messages in a group
        // unless you first read new messages
        // XREADGROUP GROUP alerts mpc STREAMS act:warnings >
        redis
          .xreadgroup('GROUP', groupName, consumer, 'STREAMS', key, IDs)
          .then((messages) =>
            console.log(
              success(
                IDs === allMessages ? 'All messages:' : 'New Messages',
                `for ${consumer}`,
                printJson(messages)
              )
            )
          )
          .catch((e) => console.log(err(e)))
      )
      .then(() =>
        // NOTE: you cannot read all messages in a group
        // unless you first read new messages
        // XREADGROUP GROUP alerts mpc STREAMS act:warnings 0
        redis
          .xreadgroup('GROUP', groupName, consumer, 'STREAMS', key, allMessages)
          .then((messages) =>
            console.log(
              success('All messages:', `for ${consumer}`, printJson(messages))
            )
          )
          .catch((e) => console.log(err(e)))
      );
    // .then(() =>
    //   redis
    //     .xgroup('DELCONSUMER', key, groupName, consumer2)
    //     .then((info) =>
    //       console.log(err('After deleting consumer :>> ', info))
    //     )
    // );
  }
}

start();
