/* Stream helpers:
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

//#region Data
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
//#endregion Data

//#region Helpers
const TESTING = false;

const {
  objectFromStream,
  objectFromStreamEntry,
  objectToKeyedArray,
} = require('../utils');

const print = (json) => JSON.stringify(json, null, 2);
const log = (text, label = 'data') => console.log(`${label} :>> `, text, '\n');

const updateBid = (sid) => {
  bids[0].sid = sid;
  return sid;
};
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
const addCountry = (country) => redis.xadd('countries', '*', 'name', country);
// xadd usa * biz "Outlaw Barbers" uid 9bb09370e625baf7
const addSponsor = (country, biz, uid) =>
  redis.xadd(country, '*', 'biz', biz, 'uid', uid);

// > xadd usa:1642558736304-0:promos * biz "Fika" text 'Welcome back Renee'
const addPromo = (country, ssid, biz, text) =>
  redis.xadd(`${country}:${ssid}:promos`, '*', 'biz', biz, 'text', text);

// > xadd usa:1642558736304-0:rewards * biz "Fika" cid '9f8b77197764881a'
const addReward = (country, ssid, biz, cid) =>
  redis.xadd(`${country}:${ssid}:rewards`, '*', 'biz', biz, 'cid', cid);

//#endregion CREATE

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

// xread `trtext1642558471131-0:promos 0
const getPromos = (country, ssid) =>
  redis
    .xread('STREAMS', `${country}:${ssid}:promos`, '0')
    .then((stream) => objectFromStream(stream))
    .then((sponsors) => objectToKeyedArray(sponsors))
    .then((data) => forPromo(data));

// xread `trtext1642558471131-0:rewards 0
const getRewards = (country, ssid) =>
  redis
    .xread('STREAMS', `${country}:${ssid}:rewards`, '0')
    .then((stream) => objectFromStream(stream));
//#endregion READ
//#endregion API

//#region Tests
// We archive tests when TESTING is false (default)
const COUNTRY = 'usa';

getSponsor(COUNTRY, bids[0].sid).then((sponsor) =>
  log(print(sponsor), 'Sponsor')
);

if (TESTING) {
  addCountry('uk').then((country) => log(country, 'Country SID:'));
  getCountries().then((countries) => log(print(countries), 'Countries:'));

  addPromo(COUNTRY, promos[1].sid, promos[1].biz, promos[1].text).then(
    (sid) => console.log('Promo sid :>> ', sid) //1642569755842-0
  );
  getPromos(COUNTRY, promos[1].sid).then((x) => log(print(x), 'Promos'));

  // > xadd usa:1642569430431-0:reward * biz "Fika" cid '9f8b77197764881a'
  addReward(`usa:${bids[0].sid}:rewards`, bids[0].biz, cids[0].uid).then(
    (sid) => console.log('Reward sid :>> ', sid) //1642569430431-0
  );

  // NOTE: We return all Reward data, not a subset like the others
  getRewards(COUNTRY, bids[0].sid).then((x) => log(print(x), 'Rewards'));

  getSponsors(COUNTRY).then((sponsors) => log(print(sponsors), 'Sponsors'));

  addSponsor(COUNTRY, bids[0].biz, bids[0].uid)
    .then((sid) => updateBid(sid))
    .then((sid) => console.log('sid :>> ', sid));

  getSponsor(COUNTRY, '1642558471131-0').then((sponsor) =>
    log(print(sponsor), 'Sponsor')
  );
}
//#endregion Tests
