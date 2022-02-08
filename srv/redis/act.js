// you may find this read https://redis.io/topics/streams-intro
// very helpfull as a starter to understand the usescases and the parameters used
// SEE: https://github.com/luin/ioredis/blob/master/examples/redis_streams.js
//#region Setup
const { highlight } = require('../../src/utils/helpers');
const { isEmpty, keepPromises } = require('../utils');
const here = 'streams';
const crypto = require('crypto');
const randomId = () => crypto.randomBytes(8).toString('hex');

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
console.log('Redis Options:', JSON.stringify(options, null, 3));

const Redis = require('ioredis');
const redis = new Redis(options);
//#endregion Setup

const getNewWarnings = async (key, score, reliability, vals) => {
  const { place_id, start, end, id } = vals;
  const args = [
    key,
    '*',
    'place_id',
    place_id,
    'start',
    start,
    'end',
    end,
    'score',
    score,
    'reliability',
    reliability,
    'vid',
    id,
  ];

  console.log(highlight('XADD', args.join(' ')));
  return redis.xadd(args);
};

const addWarnings = async ({
  visitsWithoutWsid,
  score = 76,
  reliability = 16,
}) => {
  const key = 'act:warnings';
  const context = 'addWarnings()';
  const source = 'act';
  audit({ context, msg: key, source });
  const x = await keepPromises(
    {
      key,
      score,
      reliability,
      arr: visitsWithoutWsid,
    },
    getNewWarnings
  );
  console.log('x', x);
  return x;
};
//#region Warnings
// TODO shouldn't this be getAlerts()?
const getWarnings = () => {
  const safeGroup = (alerts) =>
    isEmpty(alerts) ? [] : groupBy(alerts, 'place_id');

  const key = 'act:warnings';
  return redis
    .xread(['STREAMS', key, '0'])
    .then((stream) => objectFromStream(stream))
    .then((alerts) => safeGroup(alerts))
    .catch((e) => audit({ context: 'streams:getWarnings()', msg: e }));
};

//#endregion

// TODO REFACTOR: Give each Sponsor it's own Auditor by using the source arg
const audit = ({ context, msg, tag, source = here }) =>
  redis.xadd(
    `auditor:${source}`,
    '*',
    'context',
    context,
    'tag',
    tag,
    'msg',
    msg
  );

const findLastEntry = (key) =>
  redis
    .xrevrange([key, '+', '-', 'COUNT', 1])
    .then((stream) => objectFromStreamEntry(stream));

//#region  Rewards
function enterLottery(uid) {
  return redis.xadd('lottery', '*', 'uid', uid);
}

function getRewardPoints({ uid }, lastID = 0) {
  const key = `rewards:${uid}`;
  console.log(key);
  return redis
    .xread(['STREAMS', key, lastID])
    .then((stream) => objectFromStream(stream))
    .then((visits) => groupBy(visits, 'cid'))
    .catch((e) => audit({ context: 'getRewardPoints()', msg: e }));
}

async function earnReward({ uid, cid, lastID = 0 }) {
  const key = `rewards:${uid}`;
  console.log(highlight('uid, cid, lastID', uid, cid, lastID));
  // bizStream contains the same data as all the Customers do locally
  return redis.xadd(key, '*', 'cid', cid);
}
//#endregion

//#region Visits
const addVisit = ({ ssid, uid }) => {
  const key = 'visits';
  return redis.xadd(key, '*', 'ssid', ssid, 'uid', uid);
};

const getVisits = (ssid) => {
  const key = 'visits';
  const lastID = 0;
  // TODO REFACTOR using objectFromStream()
  return redis.xread(['STREAMS', key, lastID]).then((stream) => {
    console.log(JSON.stringify(stream, null, 3));

    const visitMap = new Map(stream);
    console.log(
      `Reading visits from key ${key}, found ${visitMap.size} visits.`
    );
    console.log(`Looking for Sponsor ID: ${ssid}`);
    let zipped;
    visitMap.forEach((visitData, visitKey) => {
      console.log(visitKey);
      const visits = new Map(visitData);
      visits.forEach((visit, id) => {
        console.log('visit ID:', id);
        const names = visit.filter((v, i) => i % 2 === 0);
        const values = visit.filter((v, i) => i % 2 !== 0);
        zipped = names.map((name, i) => ({ [name]: values[i] }));
        console.log(JSON.stringify(zipped, null, 3));
      });
    });
    console.log('zipped :>> ', JSON.stringify(zipped));
    return zipped;
  });
};
//#endregion

module.exports = {
  addVisit,
  audit,
  findLastEntry,
  getVisits,
  enterLottery,
  earnReward,
  getRewardPoints,
  addWarnings,
  getWarnings,
  randomId,
};