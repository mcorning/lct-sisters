// you may find this read https://redis.io/topics/streams-intro
// very helpfull as a starter to understand the usescases and the parameters used
// SEE: https://github.com/luin/ioredis/blob/master/examples/redis_streams.js
const { highlight } = require('../../src/utils/helpers');

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

const audit = ({ source, context, msg }) =>
  redis.xadd(`auditor:${source}`, '*', 'context', context, 'msg', msg);

const findLastEntry = (key) =>
  redis
    .xrevrange([key, '+', '-', 'COUNT', 1])
    .then((stream) => objectFromStreamEntry(stream));

//#region Sponsor
const addSponsor = ({
  biz,
  address,
  country,
  uid,
  confirmedAddress,
  userAgent,
}) => {
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
    confirmedAddress,
    'userAgent',
    userAgent
  );
};

const getSponsor = ({ country, sponsorID }) => {
  country = country.toLowerCase();
  // Example fetching 1642316033501-0
  // NOTE: so read starts from the last previous ID,
  // we decrement the timestamp by 1ms
  // then we ensure the result is our intended ID
  // not a genuine entry having our hacked ID
  // XREAD COUNT 1 STREAMS sponsors:usa 1642316033500-0
  const key = `sponsors:${country}`;
  return redis
    .xread(['STREAMS', key, 0])
    .then((stream) => objectFromStream(stream))
    .then((sponsors) => groupBy(sponsors, sponsorID))
    .then((results) => Object.keys(results))
    .catch((e) =>
      audit({ source: 'streams', context: 'getSponsor()', msg: e })
    );
};

const getSponsors = (country) => {
  country = country.toLowerCase();
  const key = `sponsors:${country}`;
  return (
    redis
      .xread(['STREAMS', key, 0])
      .then((stream) => objectFromStream(stream))
      .then((sponsors) => groupBy(sponsors, 'biz'))
      // .then((results) => Object.keys(results))
      .catch((e) =>
        audit({ source: 'streams', context: 'getSponsors()', msg: e })
      )
  );
};

const getCountries = () =>
  redis
    .keys('sponsors:*')
    .then((keys) => {
      const source = 'streams';
      const context = 'getCountries()';
      const msg = `keys: ${keys}`;
      audit({ source, context, msg });
      console.log('keys', keys);
      return keys;
    })
    .catch((e) =>
      audit({ source: 'streams', context: 'getCountries()', msg: e })
    );

//#endregion

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
    .catch((e) =>
      audit({ source: 'streams', context: 'getRewardPoints()', msg: e })
    );
}

async function earnReward({ uid, cid, lastID = 0 }) {
  const key = `rewards:${uid}`;
  console.log(highlight('uid, cid, lastID', uid, cid, lastID));
  // bizStream contains the same data as all the Customers do locally
  return redis.xadd(key, '*', 'cid', cid);
}
//#endregion

//#region Promotions
async function addPromotion({
  confirmedAddress,
  biz,
  country,
  promoText,
  promotionalDays,
  ssid,
}) {
  if (typeof biz !== 'string') {
    return null;
  }
  console.log(
    'name (place_id), ssid, promoText',
    biz,
    '(',
    confirmedAddress,
    ')',
    country,
    ssid,
    promoText
  );

  const key = `promotions:${ssid}`;
  console.log('addPromotion() key:', key);
  return redis
    .xadd(
      key,
      '*',
      'business',
      biz,
      'promoText',
      promoText,
      'expires',
      promotionalDays,
      'ssid',
      ssid
    )
    .then((psid) => psid);
}

function getPromotions({ ssid, country }) {
  const key = `promotions:${ssid}`;

  console.log(`getPromotions (in country ${country}): XREAD STREAMS ${key} 0`);
  return redis
    .xread(['STREAMS', key, '0'])
    .then((s) => {
      console.log(s);
      return s;
    })
    .then((stream) => objectFromStream(stream))
    .catch((e) =>
      audit({ source: 'streams', context: 'getPromotions()', msg: e })
    );
}
//#endregion

//#region Warnings
const getWarnings = () => {
  const key = 'warnings';
  return redis
    .xread(['STREAMS', key, '0'])
    .then((stream) => objectFromStream(stream))
    .then((alerts) => groupBy(alerts, 'place_id'))
    .catch((e) =>
      audit({ source: 'streams', context: 'getWarnings()', msg: e })
    );
};

const addWarnings = ({ visitData, score, reliability }) => {
  const key = 'warnings';
  const warnings = [];
  warnings.push(
    visitData.forEach((visit) => {
      redis.xadd(
        key,
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
  addSponsor,
  addPromotion,
  addVisit,
  audit,
  findLastEntry,
  getPromotions,
  getSponsor,
  getSponsors,
  getVisits,
  enterLottery,
  earnReward,
  getRewardPoints,
  addWarnings,
  getWarnings,
  randomId,
  getCountries,
};
