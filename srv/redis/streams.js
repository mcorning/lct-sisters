// you may find this read https://redis.io/topics/streams-intro
// very helpfull as a starter to understand the usescases and the parameters used
// SEE: https://github.com/luin/ioredis/blob/master/examples/redis_streams.js
const { printJson, highlight } = require('../../src/utils/helpers');

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

const addSponsor = ({ biz, address, country, uid, confirmedAddress }) => {
  const key = `sponsors:${country}`;
  return redis.xadd(
    key,
    '*',
    'biz',
    biz,
    'address',
    address,
    'uid',
    uid,
    'confirmedAddress',
    confirmedAddress
  );
};

async function addPromotion({
  confirmedAddress,
  biz,
  country,
  promoText,
  sid,
}) {
  if (typeof biz !== 'string') {
    return null;
  }
  console.log(
    'name (place_id), sid, promoText',
    biz,
    '(',
    confirmedAddress,
    ')',
    country,
    sid,
    promoText
  );
  const bizPath = biz.replace(/ /g, '_');
  const key = `promotions:${bizPath}`;
  console.log('addPromotion() key:', key);
  await redis.xadd(
    key,
    '*',
    'business',
    biz,
    'promoText',
    promoText,
    'sid',
    sid
  );
}

async function getPromotions({ biz, country }) {
  if (typeof biz !== 'string') {
    return null;
  }
  const bizPath = biz.replace(/ /g, '_');
  const key = `promotions:${bizPath}`;

  console.log(
    `getPromotions (in country ${country}): XREAD STREAMS ${key}, '0'`
  );
  // TODO use country in future
  // const key = `promotions:${country}`;
  const promos = await redis.xread('STREAMS', key, '0');
  console.log('promos', promos);
  return promos;
}

const getAlerts = () => {
  const channel = 'warnings';
  return redis.xread('STREAMS', channel, '0').then((alerts) => alerts);
};

const addWarnings = ({ visits, score, reliability }) => {
  const channel = 'warnings';
  const warnings = [];
  warnings.push(
    visits.forEach((visit) => {
      redis.xadd(
        channel,
        '*',
        'place_id',
        visit.place_id,
        'start',
        visit.start,
        'end',
        visit.end,
        'score',
        score,
        'reliability',
        reliability
      );
    })
  );
  return warnings;
};

const addVisit = ({ sid, uid }) => {
  const channel = 'visits';
  return redis.xadd(channel, '*', 'sid', sid, 'uid', uid);
};

const getVisits = (sid) => {
  const channel = 'visits';
  const lastID = 0;
  return redis.xread(['STREAMS', channel, lastID]).then((stream) => {
    console.log(JSON.stringify(stream, null, 3));

    const visits = new Map(stream);
    console.log(
      `Reading visits from channel ${channel}, found ${visits.size} visits.`
    );
    console.log(`Looking for Sponsor ID: ${sid}`);
    let zipped;
    visits.forEach((visitData, channel) => {
      console.log(channel);
      const visits = new Map(visitData);
      visits.forEach((visit, id) => {
        console.log('visit ID:', id);
        const names = visit.filter((v, i) => i % 2 === 0);
        const values = visit.filter((v, i) => i % 2 !== 0);
        zipped = names.map((name, i) => ({ [name]: values[i] }));
        console.log(JSON.stringify(zipped, null, 3));
      });
    });
    return zipped;
  });
};

function enterLottery(uid) {
  return redis.xadd('lottery', '*', 'uid', uid);
}

function getRewardPoints({ bid, uid }, lastID = 0) {
  const bizStream = `biz:${bid}`;
  const customerStream = `customer:${uid}`;
  console.log(bizStream, customerStream);
  return redis.xread(['STREAMS', customerStream, lastID]).then((visits) => {
    console.log('getRewardPoints returns:\n', visits);
    return visits;
  });
}

async function earnReward({ bid, uid, lastID = 0 }) {
  const bizStream = `biz:${bid.replace(/ /g, '_')}`;
  const customerStream = `customer:${uid}`;
  console.log(highlight('bid, uid, lastID', bid, uid, lastID));
  redis.xadd(bizStream, '*', 'uid', uid);
  redis.xadd(customerStream, '*', 'bid', bid);
  const points = await getRewardPoints({ uid }, lastID);
  console.log(`Reward Points for ${uid} visiting ${bid}:`);
  console.log(printJson(points));
  return points;
}
module.exports = {
  addSponsor,
  addPromotion,
  getPromotions,
  addVisit,
  getVisits,
  enterLottery,
  earnReward,
  getRewardPoints,
  addWarnings,
  getAlerts,
};
