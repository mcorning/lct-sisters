const { formatTime, formatDate } = require('../src/utils/luxonHelpers');

const filterOn = (arr, fn) =>
  arr
    .filter(typeof fn === 'function' ? fn : (val) => val[fn])
    .reduce((acc, val, i) => {
      acc[val] = (acc[val] || []).concat(arr[i]);
      return acc;
    }, {});

/**
 *
 * @param {*} arr
 * @param {*} key
 * @returns object with keys provided by arr whose value does not include the key value
 */
const indexOn = (arr, key) =>
  arr.reduce((obj, v) => {
    const { [key]: id, ...data } = v;
    obj[id] = data;
    return obj;
  }, {});

const groupBy = (arr, fn) =>
  arr
    .map(typeof fn === 'function' ? fn : (val) => val[fn])
    .reduce((acc, val, i) => {
      acc[val] = (acc[val] || []).concat(arr[i]);
      return acc;
    }, {});

const objectFromStreamEntry = (stream) =>
  isEmpty(stream) ? null : getObject(stream[0]);

const objectFromStream = (stream) =>
  isEmpty(stream) ? null : stream[0][1].map((entry) => getObject(entry));

const getObject = (entry) => {
  return entry[1].reduce((a, c, i, pairs) => {
    const ssid = entry[0];
    const visitedOn = getTimeFromSid(ssid);
    const dated = getDateFromSid(entry[0]);
    if (i % 2 === 0) {
      a[c] = pairs[i + 1];
      a.visitedOn = visitedOn;
      a.dated = dated;
      a.ssid = ssid;
      return a;
    }
    return a;
  }, {});
};
const objectToEntries = (obj) => Object.keys(obj).map((k) => [k, obj[k]]);
const getTimeFromSid = (sid) => formatTime(Number(sid.slice(0, 13)));
const getDateFromSid = (sid) => formatDate(Number(sid.slice(0, 13)));
const isEmpty = (val) => val == null || !(Object.keys(val) || val).length;
const objectToKeyedArray = (obj) => {
  if (isEmpty(obj)) {
    return null;
  }
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
module.exports = {
  groupBy,
  filterOn,

  indexOn,
  isEmpty,
  objectFromStream,
  objectFromStreamEntry,
  objectToEntries,
  objectToKeyedArray,
  getDateFromSid,
  getTimeFromSid,
};
