const { DateTime, Interval } = require('luxon');
const log = (val, text = 'data:>>') => console.log(text, val);
const print = (json) => JSON.stringify(json, null, 2);
const alertsRaw = {
  'ChIJEwMfWko3v1QRCH3s6Ly-udI': [
    {
      place_id: 'ChIJEwMfWko3v1QRCH3s6Ly-udI',
      visitedOn: 'Dec 29, 2021, 4:45 PM',
      ssid: '1642722474191-0',
      start: '1640825100000',
      end: '1640826900000',
      score: '10',
      reliability: '0',
    },
    {
      place_id: 'ChIJEwMfWko3v1QRCH3s6Ly-udI',
      visitedOn: 'Dec 22, 2489, 9:00 AM',
      ssid: '1642724478525-0',
      start: '16408890000000',
      end: '16408893600000',
      score: '10',
      reliability: '0',
    },
  ],
  ChIJFWkctxkxv1QRLhhGQdCn4gE: [
    {
      place_id: 'ChIJFWkctxkxv1QRLhhGQdCn4gE',
      visitedOn: 'Dec 30, 2021, 2:15 PM',
      ssid: '1642722474197-0',
      start: '1640902500000',
      end: '1640904300000',
      score: '10',
      reliability: '0',
    },
    {
      place_id: 'ChIJFWkctxkxv1QRLhhGQdCn4gE',
      visitedOn: 'Dec 30, 2021, 2:15 PM',
      ssid: '1642724478529-0',
      start: '1640902500000',
      end: '1640904300000',
      score: '10',
      reliability: '0',
    },
  ],
};
const visits = [
  {
    $id: '273bc157a8da758b',
    id: '273bc157a8da758b',
    name: 'Step & Spine Physical Therapy',
    place_id: 'ChIJZwFJJrUwv1QRcwpiZ9KJppc',
    marked: '17:07:58',
    color: 'primary',
    visitedOn: 'Jan 19, 2022, 5:00 PM',
    start: '1642640400000',
    end: '1642643100000',
    date: '2022-01-19',
    interval: '',
    timed: true,
    loggedVisitId: 13,
    graphName: 'Sisters OR',
    shared: true,
    ageOfExpiredEvents: 14,
  },
  {
    $id: 'd5222561b8b6606c',
    id: 'd5222561b8b6606c',
    name: 'Sisters Coffee Company',
    place_id: 'ChIJEwMfWko3v1QRCH3s6Ly-udI',
    marked: '18:56:31',
    color: 'primary',
    visitedOn: 'Dec 29, 2021, 5:00 PM',
    start: '1640826000000',
    end: '1640829600000',
    date: '2022-01-17',
    interval: '',
    timed: true,
    loggedVisitId: 4,
    graphName: 'Sisters OR',
    shared: false,
    ageOfExpiredEvents: 14,
  },
];

//#region 30 seconds
const { toKeyedArray } = require('./objectToKeyedArray');

const symmetricDifferenceBy = (a, b, fn) => {
  const sA = new Set(a.map((v) => fn(v)));
  const sB = new Set(b.map((v) => fn(v)));
  return [
    ...a.filter((x) => !sB.has(fn(x))),
    ...b.filter((x) => !sA.has(fn(x))),
  ];
};

const some = (v, a, b) =>
  a.some((e) => e === v).length !== b.some((e) => e === v).length;

const haveSimilarContents = (a, b, fn) => {
  for (const v of new Set([...a, ...b])) return !fn(v, a, b);
  // for (const v of new Set([...a, ...b])) if (fn(v, a, b)) return false;
  // return true;
};
const haveSameContents = (a, b) => {
  for (const v of new Set([...a, ...b]))
    if (a.filter((e) => e === v).length !== b.filter((e) => e === v).length)
      return false;
  return true;
};

const data = [
  {
    id: 1,
    name: 'john',
    age: 24,
  },
  {
    id: 2,
    name: 'mike',
    age: 50,
  },
];
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
// log(print(reducedFilter(data, ['id', 'name'], (item) => item.age > 24)));
const compact = (arr) => arr.filter(Boolean);

//#endregion

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

const alerts = getAlertsUsing(visits, alertsRaw).flat();
const exposures = liftKeysFrom(['place_id', 'start', 'end'], visits);

const msgs = alerts.map((v) => {
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
const msg = compact2(msgs);
log(print(msg), 'msg');

const testToKeyedArray = false;
if (testToKeyedArray) {
  // Object creation
  const x = toKeyedArray({ a: 'A', b: 'B' });

  // Accessing properties and values
  x.a; // 'A'
  x.keys; // ['a', 'b']
  x.values; // ['A', 'B']
  [...x]; // ['A', 'B']
  x.length; // 2

  // Inserting values
  x.c = 'c'; // x = { a: 'A', b: 'B', c: 'c' }
  x.length; // 3

  // Array methods
  x.forEach((v, i) => console.log(`${i}: ${v}`)); // LOGS: 'a: A', 'b: B', 'c: c'
  x.map((v, i) => log(i + v)); // ['aA', 'bB, 'cc]
  log(x.filter((v) => v !== 'B')); // { a: 'A', c: 'c' }
  log(x.reduce((a, v, i) => ({ ...a, [v]: i }), {})); // { A: 'a', B: 'b', c: 'c' }
  log(x.slice(0, 2)); // ['A', 'B']
  log(x.slice(-1)); // ['c']
  log(x.find((v, i) => v === i)); // 'c'
  log(x.findKey((v) => v === 'B')); // 'b'
  log(x.includes('c')); // true
  log(x.includes('d')); // false
  log(x.keyOf('B')); // 'b'
  log(x.keyOf('a')); // null
  log(x.lastKeyOf('c')); // 'c'
}
