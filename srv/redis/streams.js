// you may find this read https://redis.io/topics/streams-intro
// very helpfull as a starter to understand the usescases and the parameters used
// SEE: https://github.com/luin/ioredis/blob/master/examples/redis_streams.js
const { printJson, highlight } = require('../../src/utils/helpers');
const { groupBy, objectFromStream, objectToEntries } = require('../utils.js');
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
  const bizPath = biz.trim().replace(/ /g, '_');
  const key = `promotions:${bizPath}`;
  console.log('addPromotion() key:', key);
  return redis
    .xadd(key, '*', 'business', biz, 'promoText', promoText, 'sid', sid)
    .then((newSid) => {
      console.log(`XREAD STREAMS ${key} ${newSid}`);
      // TODO RESEARCH: why can't i get XREAD to work with the newSid?
      return redis.xrange(key, newSid, newSid);
    });
}

function getPromotions({ biz, country }) {
  if (typeof biz !== 'string') {
    return null;
  }
  const bizPath = biz.trim().replace(/ /g, '_');
  const key = `promotions:${bizPath}`;

  console.log(`getPromotions (in country ${country}): XREAD STREAMS ${key} 0`);
  return redis
    .xread('STREAMS', key, '0')
    .then((stream) => objectFromStream(stream))
    .catch((e) => e);
}

const getWarnings = () => {
  const channel = 'warnings';
  return redis
    .xread('STREAMS', channel, '0')
    .then((stream) => objectFromStream(stream))
    .then((alerts) => groupBy(alerts, 'place_id'));
};

const addWarnings = ({ visitData, score, reliability }) => {
  const channel = 'warnings';
  const warnings = [];
  warnings.push(
    visitData.forEach((visit) => {
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
  // TODO REFACTOR using objectFromStream()
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
    console.log('zipped :>> ', JSON.stringify(zipped));
    return zipped;
  });
};

function enterLottery(uid) {
  return redis.xadd('lottery', '*', 'uid', uid);
}

function getRewardPoints({ bid, uid }, lastID = 0) {
  return groupRewardPoints({ bid, uid }, lastID);
}

/**
 *
 * @param {*} { bid, uid }  biz ID, and user ID
 * @param {*} lastID  last read stream ID
 * @returns object with bids as keys
 */
function groupRewardPoints({ bid, uid }, lastID = 0) {
  const bizStream = `biz:${bid}`;
  const customerStream = `customer:${uid}`;
  console.log(bizStream, customerStream);

  const getVisitsFor = (groupedVisits) => {
    const visitsArray = objectToEntries(groupedVisits);
    if (bid) {
      return visitsArray.filter((v) => v[0] === bid);
    }
    return visitsArray;
  };

  return redis
    .xread(['STREAMS', customerStream, lastID])
    .then((stream) => objectFromStream(stream, 'bid'))
    .then((visits) => groupBy(visits, 'bid'))
    .then((groupedVisits) => getVisitsFor(groupedVisits));
}

async function earnReward({ bid, uid, lastID = 0 }) {
  const bizStream = `biz:${bid.trim().replace(/ /g, '_')}`;
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
  getWarnings,
};
