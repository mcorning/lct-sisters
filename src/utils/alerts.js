const { DateTime, Interval } = require('luxon');
const warningsTestData = require('./data/warnings.json');
const visitsTestData = require('./data/visits.e49a.json');

const log = (val, text = 'data:>>') => console.log(text, val);
const print = (json) => JSON.stringify(json, null, 2);

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
const compact = (arr) => arr.filter((v) => v.length > 0);
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
  return compact(msgs);
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
  log(print(getAlerts(visitsTestData, warningsTestData)), 'getAlerts():>>');
}

module.exports = { getAlerts, log, print };
