// see https://www.npmjs.com/package/cli-color
const {DateTime} = require('luxon');

const clc = require('cli-color');
const success = clc.green.bold;
const err = clc.red.bold;
const warn = clc.yellow;
const info = clc.cyan;
const notice = clc.blue;
const highlight = clc.magenta;
const bold = clc.bold;
const bgBlue = clc.bgBlue;
const bgMagenta = clc.bgMagenta;
const special = clc.red.bold.bgYellow;
const url = clc.black.bold.bgCyanBright;
const heading = clc.bold.black.bgWhite;
const logVisitors = clc.greenBright;
const columns = clc.columns;

function printJson(json) {
  return JSON.stringify(json, null, 3);
}
function getNow() {
  return special(`\n${new Date().toLocaleString()}`);
}
function printNow() {
  console.log(getNow());
}

const isEmpty = (val) => val == null || !(Object.keys(val) || val).length;
const head = (val) => (Array.isArray(val) && !isEmpty(val) ? val[0] : '');
const truthCheckCollection = (collection, pre) =>
  collection.every((obj) => obj[pre]);

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min); //The maximum is inclusive and the minimum is inclusive
}

const objectToKeyedArray = (obj) => {
  const methods = {
    map(target) {
      return (callback) =>
        Object.keys(target).map((key) => callback(target[key], key, target));
    },
    reduce(target) {
      return (callback, accumulator) =>
        Object.keys(target).reduce(
          (acc, key) => callback(acc, target[key], key, target),
          accumulator
        );
    },
    forEach(target) {
      return (callback) =>
        Object.keys(target).forEach((key) =>
          callback(target[key], key, target)
        );
    },
    filter(target) {
      return (callback) =>
        Object.keys(target).reduce((acc, key) => {
          if (callback(target[key], key, target)) acc[key] = target[key];
          return acc;
        }, {});
    },
    slice(target) {
      return (start, end) => Object.values(target).slice(start, end);
    },
    find(target) {
      return (callback) => {
        return (Object.entries(target).find(([key, value]) =>
          callback(value, key, target)
        ) || [])[0];
      };
    },
    findKey(target) {
      return (callback) =>
        Object.keys(target).find((key) => callback(target[key], key, target));
    },
    includes(target) {
      return (val) => Object.values(target).includes(val);
    },
    keyOf(target) {
      return (value) =>
        Object.keys(target).find((key) => target[key] === value) || null;
    },
    lastKeyOf(target) {
      return (value) =>
        Object.keys(target)
          .reverse()
          .find((key) => target[key] === value) || null;
    },
  };
  const methodKeys = Object.keys(methods);

  const handler = {
    get(target, prop, receiver) {
      if (methodKeys.includes(prop)) return methods[prop](...arguments);
      const [keys, values] = [Object.keys(target), Object.values(target)];
      if (prop === 'length') return keys.length;
      if (prop === 'keys') return keys;
      if (prop === 'values') return values;
      if (prop === Symbol.iterator)
        return function* () {
          for (const value of values) yield value;
        };
      else return Reflect.get(...arguments);
    },
  };

  return new Proxy(obj, handler);
};

// example: const keys = ['vid', 'ssid'];
const liftKeysFrom = (keys, object) =>
  object.map((o) =>
    keys.reduce((acc, key) => {
      acc[key] = o[key];
      return acc;
    }, {})
  );

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

// TODO NOTE: we fixed the field name to 'hours' here,
// but processing warnings takes duration string as arg
// probably should use whatever is in the Visit model; viz., 'hours"
const getOnHours = (start, end) => {
  const duration = 'hours';

  const started = DateTime.fromMillis(start);
  const on = started.toLocaleString(DateTime.DATETIME_MED);

  const dur = DateTime.fromMillis(end).diff(started, duration);
  const hours = dur[duration].toFixed(2);
  return { on, hours };
};

module.exports = {
  head,
  isEmpty,
  truthCheckCollection,
  columns,
  getRandomIntInclusive,
  liftKeysFrom,
  liftMappedKeysFrom,
  printJson,
  getNow,
  getOnHours,
  objectToKeyedArray,
  printNow,
  success,
  bold,
  err,
  heading,
  warn,
  info,
  notice,
  highlight,
  bgBlue,
  bgMagenta,
  special,
  url,
  logVisitors,
};
