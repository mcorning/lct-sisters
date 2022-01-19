/* Stream examples:
Command: >scan 0
      Returns
cursor    all streams in database:
----------------------------------------------------
0         auditor:streams                    
          promotions:1642533459959-0
          usa:1642533459959-0
          usa:1642533459959-0:promos
          sponsors:usa

Command: >scan 0 match usa*[^promos]
      Returns
cursor    all USA Sponsors:
----------------------------------------------------
0         usa:1642533459959-0

Command: >scan 0 match usa*
      Returns
cursor    all streams in USA:
----------------------------------------------------
0         usa:1642533459959-0
          usa:1642533459959-0:promos

Command: >scan 0 match usa*rewards
      Returns
cursor    all Rewards in USA:
----------------------------------------------------
0         usa:1642533459959-0:rewards

Command: >scan 0 match usa*promos
      Returns
cursor    all Promotions in USA:
----------------------------------------------------
0         usa:1642533459959-0:promos

Command: >scan 0 match usa:1642533459959-0*
      Returns
cursor    all streams for Sponsor 1642533459959-0:
----------------------------------------------------
0         usa:1642533459959-0:rewards
          usa:1642533459959-0
          usa:1642533459959-0:promos

Command: >scan 0 match usa:*[^:promos][^:rewards]
      Returns
cursor    then array of values:
----------------------------------------------------
0         usa:1642533459959-0


> xadd usa * biz SCC uid 2cc4954d5cabe49a
1642558471131-0

> xrange usa 1642558471131-0 1642558471131-0
1642558471131-0
biz
SCC
uid
2cc4954d5cabe49a

> xadd usa * biz "Outlaw Barbers" uid 9bb09370e625baf7
1642558736304-0
> xrange usa 1642558736304-0 1642558736304-0
1642558736304-0
biz
Outlaw Barbers
uid
9bb09370e625baf7

> xadd usa:1642558736304-0:promos * biz "Outlaw Barbers" text 'Twenty percent for Vets on Vets Day'
1642558906193-0
> xread streams usa:1642558736304-0:promos 0
usa:1642558736304-0:promos
1642558906193-0
biz
Outlaw Barbers
text
Twenty percent for Vets on Vets Day

> xadd usa:1642558471131-0:promos * biz "SCC" text 'Early Spring Break'
1642562389544-0
> xadd usa:1642558471131-0:promos * biz "SCC" text 'Get a break on breakfast'
1642562437423-0
> xread streams usa:1642558471131-0:promos 0
usa:1642558471131-0:promos
1642562389544-0
biz
SCC
text
Early Spring Break
1642562437423-0
biz
SCC
text
Get a break on breakfast
*/

//#region Setup
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
//#endregion
//#region Helpers
const TESTING = true;

const {
  objectFromStream,
  objectFromStreamEntry,
  objectToKeyedArray,
} = require('../utils');

const print = (json) => JSON.stringify(json, null, 2);
const log = (text, label = 'data') => console.log(`${label} :>> `, text, '\n');

const forSponsor = (sponsor) =>
  sponsor.reduce((a, c) => {
    const { biz, uid, ssid } = c;
    a.push({ biz, uid, ssid });
    return a;
  }, []);
const forThisSponsor = (sponsor) => ({
  biz: sponsor.biz,
  uid: sponsor.uid,
  ssid: sponsor.uid,
});

const forPromo = (sponsor) =>
  sponsor.reduce((a, c) => {
    const { biz, text } = c;
    a.push({ biz, text });
    return a;
  }, []);

const forCountries = (country) =>
  country.reduce((a, c) => {
    const { name } = c;
    a.push({ name });
    return a;
  }, []);
//#endregion Helpers

//#region API
//#region CREATE
// xadd countries * name sg
// const addCountry = (country) => redis.xadd('countries', '*', 'name', country);
// xadd usa * biz "Outlaw Barbers" uid 9bb09370e625baf7
const addSponsor = (country, biz, uid) =>
  redis.xadd(country, '*', 'biz', biz, 'uid', uid);

// > xadd usa:1642558736304-0:promos * biz "Fika" text 'Welcome back Renee'
const addPromo = (key, biz, text) =>
  redis.xadd(key, '*', 'biz', biz, 'text', text);

// > xadd usa:1642558736304-0:rewards * biz "Fika" cid '9f8b77197764881a'
const addReward = (key, biz, cid) =>
  redis.xadd(key, '*', 'biz', biz, 'cid', cid);

//#endregion CREATE
//#region DELETE
const deletePromo = (key, sid) => redis.xdel(key, sid);
//#endregion DELETE

//#region READ
// xread streams countries 0
const getCountries = () =>
  redis
    .xread('STREAMS', 'countries', '0')
    .then((stream) => objectFromStream(stream))
    .then((countries) => objectToKeyedArray(countries))
    .then((data) => forCountries(data));

// xread streams usa 0
const getSponsors = (country) =>
  redis
    .xread('STREAMS', country, '0')
    .then((stream) => objectFromStream(stream))
    .then((sponsors) => objectToKeyedArray(sponsors))
    .then((data) => forSponsor(data));

// xrange usa 1642558471131-0 1642558471131-0
const getSponsor = (country, ssid) =>
  redis
    .xrange(country, ssid, ssid)
    .then((stream) => objectFromStreamEntry(stream))
    .then((sponsor) => forThisSponsor(sponsor));

// xread country:usa:1642558471131-0:promos 0
const getPromos = (key) =>
  redis
    .xread('STREAMS', key, '0')
    .then((stream) => objectFromStream(stream))
    .then((sponsors) => objectToKeyedArray(sponsors))
    .then((data) => forPromo(data));

// xread country:usa:1642558471131-0:rewards 0
const getRewards = (key) =>
  redis.xread('STREAMS', key, '0').then((stream) => objectFromStream(stream));
//#endregion READ
//#endregion API

//#region Tests
if (TESTING) {
  //#region Test Data
  const bids = [
    { biz: 'Fika', uid: '9f8b77197764881a', sid: '1642567941789-0' },
    { biz: 'SCC', uid: '2cc4954d5cabe49a', sid: '1642558471131-0' },
    { biz: 'Outlaw Barbers', uid: '9bb09370e625baf7', sid: '1642558736304-0' },
  ];
  const promos = [
    { biz: 'Fika', text: 'Welcome back Renee' },
    { biz: 'Fika', sid: '1642567941789-0', text: 'Discount for card players' },
    { biz: 'Outlaw Barbers', text: 'Twenty percent for Vets on Vets Day' },
  ];
  const cids = [
    { name: 'debug', uid: '9f8b77197764881a' },
    { name: 'Firefox', uid: '9b7c302f6f1b1fa4' },
  ];
  //#endregion Test Data
  const updateBid = (sid) => {
    bids[0].sid = sid;
    return sid;
  };
  // We archive tests when TESTING is false (default)
  const COUNTRY = 'country:usa';
  const biz = bids[0].biz;
  const uid = bids[0].uid;
  const sid = bids[0].sid;
  const biz2 = bids[1].biz;
  const uid2 = bids[1].uid;

  const p1 = addSponsor(COUNTRY, biz, uid)
    .then((ssid) => updateBid(ssid))
    .then((ssid) => getSponsor(COUNTRY, ssid))
    .then((sponsor) => log(print(sponsor), 'Sponsor'))
    .then(() => getSponsors(COUNTRY));
  const p2 = addSponsor(COUNTRY, biz2, uid2)
    .then((ssid) => updateBid(ssid))
    .then((ssid) => getSponsor(COUNTRY, ssid))
    .then((sponsor) => log(print(sponsor), 'Sponsor'))
    .then(() => getSponsors(COUNTRY));

  Promise.all([p1, p2])
    .then((promises) => log(print(promises), 'Sponsors'))
    .then(() => addReward(`${COUNTRY}:${sid}:rewards`, biz, cids[0].uid))
    .then(() => getRewards(`${COUNTRY}:${sid}:rewards`))
    .then((rewards) => log(print(rewards), 'Rewards'))
    .then(() =>
      addPromo(`${COUNTRY}:${sid}:promos`, promos[1].biz, promos[1].text)
    )
    .then(() => getPromos(`${COUNTRY}:${sid}:promos`))
    .then((ps) => log(print(ps), 'Promos'));
  // NOTE: We return all Reward data, not a subset like the others
}
//#endregion Tests

module.exports = {
  addPromo,
  addReward,
  addSponsor,
  deletePromo,
  getCountries,
  getPromos,
  getSponsor,
  getRewards,
  getSponsors,
};
