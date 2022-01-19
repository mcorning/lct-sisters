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
  { biz: 'SCC', uid: '2cc4954d5cabe49a', sid: '1642558471131-0' },
  { biz: 'Outlaw Barbers', uid: '9bb09370e625baf7', sid: '1642558736304-0' },
];
const promos = [
  { biz: 'SCC', text: 'Welcome back Renee' },
  { biz: 'Outlaw Barbers', text: 'Twenty percent for Vets on Vets Day' },
];
const cids = [
  { name: 'debug', uid: '9f8b77197764881a' },
  { name: 'Firefox', uid: '9b7c302f6f1b1fa4' },
];
//#endregion Data

//#region Helpers
const {
  objectFromStream,
  objectFromStreamEntry,
  objectToKeyedArray,
} = require('../utils');
const print = (json) => JSON.stringify(json, null, 2);
const log = (text, label = 'data') => console.log(`${label} :>> `, text, '\n');
const TESTING = true;
//#endregion Helpers

//#region API
// xread streams usa 0
const getSponsors = (country) => {
  const fromSponsor = (sponsor) =>
    sponsor.reduce((a, c) => {
      const { biz, uid, ssid } = c;
      a.push({ biz, uid, ssid });
      return a;
    }, []);
  return redis
    .xread('STREAMS', country, '0')
    .then((stream) => objectFromStream(stream))
    .then((sponsors) => objectToKeyedArray(sponsors))
    .then((data) => fromSponsor(data));
};

// xrange usa 1642558471131-0 1642558471131-0
const getSponsor = (country, ssid) => {
  return redis
    .xrange(country, ssid, ssid)
    .then((stream) => objectFromStreamEntry(stream));
};

// xread `trtext1642558471131-0:promos 0
const getPromos = (country, ssid) => {
  const command = `${country}:${ssid}:promos`;
  return redis
    .xread('STREAMS', command, '0')
    .then((stream) => objectFromStream(stream));
};
//#endregion API

//#region Tests
if (TESTING) {
  getSponsors('usa').then((sponsors) => log(print(sponsors), 'Sponsors'));

  getSponsor('usa', '1642558471131-0').then((sponsor) =>
    log(print(sponsor), 'Sponsor')
  );

  getPromos('usa', '1642558471131-0').then((x) => log(print(x), 'Promos'));
}
//#endregion Tests
