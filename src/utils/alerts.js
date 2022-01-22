const { DateTime, Interval } = require('luxon');
const warningsTestData = require('./data/warnings.json');
const visitsTestData = require('./data/visits.e49a.json');

const log = (val, text = 'data:>>') => console.log(text, val);
const print = (json) => JSON.stringify(json, null, 2);
// const alertsTestData = {
//   'ChIJEwMfWko3v1QRCH3s6Ly-udI': [
//     {
//       place_id: 'ChIJEwMfWko3v1QRCH3s6Ly-udI',
//       visitedOn: 'Dec 29, 2021, 4:45 PM',
//       ssid: '1642722474191-0',
//       start: '1640825100000',
//       end: '1640826900000',
//       score: '10',
//       reliability: '0',
//     },
//     {
//       place_id: 'ChIJEwMfWko3v1QRCH3s6Ly-udI',
//       visitedOn: 'Dec 22, 2489, 9:00 AM',
//       ssid: '1642724478525-0',
//       start: '16408890000000',
//       end: '16408893600000',
//       score: '10',
//       reliability: '0',
//     },
//   ],
//   ChIJFWkctxkxv1QRLhhGQdCn4gE: [
//     {
//       place_id: 'ChIJFWkctxkxv1QRLhhGQdCn4gE',
//       visitedOn: 'Dec 30, 2021, 2:15 PM',
//       ssid: '1642722474197-0',
//       start: '1640902500000',
//       end: '1640904300000',
//       score: '10',
//       reliability: '0',
//     },
//     {
//       place_id: 'ChIJFWkctxkxv1QRLhhGQdCn4gE',
//       visitedOn: 'Dec 30, 2021, 2:15 PM',
//       ssid: '1642724478529-0',
//       start: '1640902500000',
//       end: '1640904300000',
//       score: '10',
//       reliability: '0',
//     },
//   ],
// };
// const visitsTestDatax = [
//   {
//     $id: '273bc157a8da758b',
//     id: '273bc157a8da758b',
//     name: 'Step & Spine Physical Therapy',
//     place_id: 'ChIJZwFJJrUwv1QRcwpiZ9KJppc',
//     marked: '17:07:58',
//     color: 'primary',
//     visitedOn: 'Jan 19, 2022, 5:00 PM',
//     start: '1642640400000',
//     end: '1642643100000',
//     date: '2022-01-19',
//     interval: '',
//     timed: true,
//     loggedVisitId: 13,
//     graphName: 'Sisters OR',
//     shared: true,
//     ageOfExpiredEvents: 14,
//   },
//   {
//     $id: 'd5222561b8b6606c',
//     id: 'd5222561b8b6606c',
//     name: 'Sisters Coffee Company',
//     place_id: 'ChIJEwMfWko3v1QRCH3s6Ly-udI',
//     marked: '18:56:31',
//     color: 'primary',
//     visitedOn: 'Dec 29, 2021, 5:00 PM',
//     start: '1640826000000',
//     end: '1640829600000',
//     date: '2022-01-17',
//     interval: '',
//     timed: true,
//     loggedVisitId: 4,
//     graphName: 'Sisters OR',
//     shared: false,
//     ageOfExpiredEvents: 14,
//   },
// ];
const reducedFilter = (data, keys, duration, fn) =>
  data.filter(fn).map((el) =>
    keys.reduce((acc, key) => {
      acc[key] = el[key];
      if (key === 'end') {
        const started = DateTime.fromMillis(Number(el.start));
        const ended = DateTime.fromMillis(Number(el.end));
        const dur = ended.diff(started, duration);
        acc.on = started.toLocaleString(DateTime.DATETIME_MED);
        acc[duration] = dur[duration].toFixed(2);
      }
      return acc;
    }, {})
  );
const compact2 = (arr) => arr.filter((v) => v.length > 0);
const liftKeysFrom = (keys, object) =>
  object.map((o) =>
    keys.reduce((acc, key) => {
      acc[key] = o[key];
      return acc;
    }, {})
  );

const getAlertsUsing = (visits, alerts, key = 'place_id') =>
  visits.reduce((a, c) => {
    const o = alerts[c[key]];
    if (o) {
      a.push(liftKeysFrom(['place_id', 'start', 'end'], o));
    }

    return a;
  }, []);

const getAlerts = (visits, alerts) => {
  const relevantAlerts = getAlertsUsing(visits, alerts).flat();
  const exposures = liftKeysFrom(['place_id', 'start', 'end'], visits);

  const msgs = relevantAlerts.map((v) => {
    const pid = v.place_id;
    const i = Interval.fromDateTimes(
      DateTime.fromMillis(Number(v.start)),
      DateTime.fromMillis(Number(v.end))
    );

    return reducedFilter(
      exposures,
      ['place_id', 'start', 'end'],
      'hours',
      (e) =>
        e.place_id === pid && i.contains(DateTime.fromMillis(Number(e.start)))
    );
  });
  return compact2(msgs);
};
// example: const keys = [{ fm: 'vid', to: 'id' }, 'ssid'];
// NOTE: this is the general case, so keys=['vid','ssid'] work as well
const liftMappedKeysFrom = (keys, object) =>
  object.map((o) =>
    keys.reduce((acc, key) => {
      const { fm, to } = key;
      acc[to ?? key] = o[fm ?? key];
      return acc;
    }, {})
  );
const TESTING = false;
if (TESTING) {
  const keysMap2 = [{ fm: 'vid', to: 'id' }, 'ssid'];
  const ids = Object.values(warningsTestData)
    .map((c) => liftMappedKeysFrom(keysMap2, c))
    .flat();
  log(print(ids), 'ids:>>');
  // log(print(getAlerts(visitsTestData, warningsTestData)), 'getAlerts():>>');
}

module.exports = { getAlerts, log, print };
