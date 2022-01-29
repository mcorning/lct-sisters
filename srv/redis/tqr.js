/* Stream examples:
Command: >scan 0
      Returns
cursor    all streams in database:
----------------------------------------------------
0         auditor:streams                    
          promotions:1642533459959-0
          tqr:us1642533459959-0
          tqr:us1642533459959-0:promos
          sponsors:us

Command: >scan 0 match us*[^promos]
      Returns
cursor    all USA Sponsors:
----------------------------------------------------
0         tqr:us1642533459959-0

Command: >scan 0 match us*
      Returns
cursor    all streams in USA:
----------------------------------------------------
0         tqr:us1642533459959-0
          tqr:us1642533459959-0:promos

Command: >scan 0 match us*rewards
      Returns
cursor    all Rewards in USA:
----------------------------------------------------
0         tqr:us1642533459959-0:rewards

Command: >scan 0 match us*promos
      Returns
cursor    all Promotions in USA:
----------------------------------------------------
0         tqr:us1642533459959-0:promos

Command: >scan 0 match tqr:us1642533459959-0*
      Returns
cursor    all streams for Sponsor 1642533459959-0:
----------------------------------------------------
0         tqr:us1642533459959-0:rewards
          tqr:us1642533459959-0
          tqr:us1642533459959-0:promos

Command: >scan 0 match tqr:us::*[^:promos][^:rewards]
      Returns
cursor    then array of values:
----------------------------------------------------
0         tqr:us1642533459959-0


> xadd us * biz SCC uid 2cc4954d5cabe49a
1642558471131-0

> xrange us 1642558471131-0 1642558471131-0
1642558471131-0
biz
SCC
uid
2cc4954d5cabe49a

> xadd us * biz "Outlaw Barbers" uid 9bb09370e625baf7
1642558736304-0
> xrange us 1642558736304-0 1642558736304-0
1642558736304-0
biz
Outlaw Barbers
uid
9bb09370e625baf7

> xadd tqr:us1642558736304-0:promos * biz "Outlaw Barbers" promoText 'Twenty percent for Vets on Vets Day'
1642558906193-0
> xread streams tqr:us1642558736304-0:promos 0
us:1642558736304-0:promos
1642558906193-0
biz
Outlaw Barbers
promoText
Twenty percent for Vets on Vets Day

> xadd tqr:us1642558471131-0:promos * biz "SCC" promoText 'Early Spring Break'
1642562389544-0
> xadd tqr:us1642558471131-0:promos * biz "SCC" promoText 'Get a break on breakfast'
1642562437423-0
> xread streams tqr:us1642558471131-0:promos 0
us:1642558471131-0:promos
1642562389544-0
biz
SCC
promoText
Early Spring Break
1642562437423-0
biz
SCC
promoText
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
console.log('options:>>', options);
//#endregion
//#region Helpers

const {
  isEmpty,
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

const forPromo = (sponsor) => {
  if (isEmpty(sponsor)) {
    return null;
  }
  return sponsor.reduce((a, c) => {
    const { biz, promoText, dated, ssid } = c;
    a.push({ biz, promoText, dated, ssid });
    return a;
  }, []);
};

//#endregion Helpers

//#region API
//#region CREATE
// xadd countries * name sg
// const addCountry = (country) => redis.xadd('countries', '*', 'name', country);
// xadd us * biz "Outlaw Barbers" uid 9bb09370e625baf7
const addSponsor = ({ key, biz, uid }) =>
  redis.xadd(`${key}`, '*', 'biz', biz, 'uid', uid);

// > xadd tqr:us1642558736304-0:promos * biz "Fika" promoText 'Welcome back Renee'
const addPromo = ({ key, biz, promoText }) =>
  redis.xadd(key, '*', 'biz', biz, 'promoText', promoText);

// xread tqr:us:1642558471131-0:promos 0
const getPromos = (key) =>
  redis
    .xread('STREAMS', key, '0')
    .then((stream) => objectFromStream(stream))
    .then((sponsors) => objectToKeyedArray(sponsors))
    .then((data) => forPromo(data));

const getSponsors = (key) =>
  redis
    .xread('STREAMS', key, '0')
    .then((stream) => objectFromStream(stream))
    .then((sponsors) => objectToKeyedArray(sponsors))
    .then((data) => forSponsor(data));

// > xadd tqr:us1642558736304-0:rewards * biz "Fika" cid '9f8b77197764881a'
const addReward = ({ key, biz, sid }) =>
  redis.xadd(key, '*', 'biz', biz, 'sid', sid);

//#endregion CREATE
//#region DELETE
const deleteStream = (key, ids) => redis.xdel(key, ids);

//#endregion DELETE

//#region READ
const getCountries = () =>
  redis
    .scan('0', 'MATCH', 'tqr:??')
    .then((countries) => countries.filter((v, i) => i > 0))
    .then((countryIDs) => countryIDs.map((v) => v.map((c) => c.slice(4))));

// xrange us 1642558471131-0 1642558471131-0
const getSponsor = (country, ssid) =>
  redis
    .xrange(country, ssid, ssid)
    .then((stream) => objectFromStreamEntry(stream))
    .then((sponsor) => forThisSponsor(sponsor));

// xread STREAMS tqr:us:1642558471131-0:rewards:{cid} 0
const getRewards = (key) =>
  redis.xread('STREAMS', key, '0').then((stream) => objectFromStream(stream));
//#0endregion READ
//#endregion API

const TESTING = false;

//#region Tests
if (TESTING) {
  //#region Test Data
  const bids = [
    { biz: 'Fika', uid: '9f8b77197764881a', sid: '' },
    { biz: 'SCC', uid: '2cc4954d5cabe49a', sid: '' },
    { biz: 'Outlaw Barbers', uid: '9bb09370e625baf7', sid: '1642558736304-0' },
  ];
  const promos = [
    { biz: 'Fika', promoText: 'Welcome back Renee' },
    { biz: 'Fika', sid: '', promoText: 'Discount for card players' },
    { biz: 'Outlaw Barbers', promoText: 'Twenty percent for Vets on Vets Day' },
  ];
  const cids = [
    { name: 'debug', uid: '9f8b77197764881a' },
    { name: 'Firefox', uid: '9b7c302f6f1b1fa4' },
  ];
  //#endregion Test Data

  const updateBid = (bidUid, ssid) => {
    const updatedBid = bids.find((v) => v.uid === bidUid);
    updatedBid.sid = ssid;
    console.assert(updatedBid.sid == ssid, 'failed isometric truth test');
    return updatedBid.sid;
  };
  // We archive tests when TESTING is false (default)
  const COUNTRY = 'tqr:sg';
  const biz = bids[0].biz;
  const uid = bids[0].uid;
  const biz2 = bids[1].biz;
  const uid2 = bids[1].uid;

  const p0 = addSponsor({ country: 'tqr:sg', biz, uid }).then(() =>
    addSponsor({ country: 'tqr:sg', biz, uid })
  );

  const p1 = addSponsor({ country: COUNTRY, biz, uid })
    .then((ssid) => updateBid(uid, ssid))
    .then((ssid) => getSponsor(COUNTRY, ssid))
    .then((sponsor) => log(print(sponsor), 'Sponsor'))
    .then(() => getSponsors(COUNTRY));
  const p2 = addSponsor({ country: COUNTRY, biz: biz2, uid: uid2 })
    .then((ssid) => updateBid(uid2, ssid))
    .then((ssid) => getSponsor(COUNTRY, ssid))
    .then((sponsor) => log(print(sponsor), 'Sponsor'))
    .then(() => getSponsors(COUNTRY));

  Promise.all([p0, p1, p2])
    .then((promises) => log(print(promises), 'Sponsors'))
    .then(() =>
      addReward({
        key: `${COUNTRY}:${bids[0].sid}:rewards`,
        biz,
        cid: cids[0].uid,
      })
    )
    .then(() => getRewards(`${COUNTRY}:${bids[0].sid}:rewards`))
    .then((rewards) => log(print(rewards), 'Rewards'))
    .then(() =>
      addPromo({
        country: `${COUNTRY}:${bids[1].sid}:promos`,
        biz: promos[1].biz,
        promoText: promos[1].promoText,
      })
    )
    .then(() =>
      addPromo({
        country: `${COUNTRY}:${bids[0].sid}:promos`,
        biz: promos[2].biz,
        promoText: promos[2].promoText,
      })
    )
    .then(() => deleteStream(`${COUNTRY}:${bids[0].sid}:promos:${cids[0]}`))
    .then(() => getPromos(`${COUNTRY}:${bids[1].sid}:promos`))
    .then((ps) => log(print(ps), 'Promos'))
    .then(() => getCountries())
    .then((countries) => log(print(countries)));
  // NOTE: We return all Reward data, not a subset like the others
}
//#endregion Tests

module.exports = {
  addPromo,
  addReward,
  addSponsor,
  deleteStream,
  getCountries,
  getPromos,
  getSponsor,
  getRewards,
  getSponsors,
};
