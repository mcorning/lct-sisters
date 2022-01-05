const { formatTime, formatDate } = require('../src/utils/luxonHelpers');

const groupBy = (arr, fn) =>
  arr
    .map(typeof fn === 'function' ? fn : (val) => val[fn])
    .reduce((acc, val, i) => {
      acc[val] = (acc[val] || []).concat(arr[i]);
      return acc;
    }, {});

const objectFromStream = (stream) =>
  stream[0][1].map((entry) => getObject(entry));

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

const getObject = (entry) => {
  return entry[1].reduce((a, c, i, pairs) => {
    const visitedOn = getTimeFromSid(entry[0]);
    const dated = getDateFromSid(entry[0]);
    console.log('expires :>> ', expires);
    if (i % 2 === 0) {
      a[c] = pairs[i + 1];
      a.visitedOn = visitedOn;
      a.dated = dated;
      return a;
    }
    return a;
  }, {});
};
const objectToEntries = (obj) => Object.keys(obj).map((k) => [k, obj[k]]);
const getTimeFromSid = (sid) => formatTime(Number(sid.slice(0, 13)));
const getDateFromSid = (sid) => formatDate(Number(sid.slice(0, 13)));
const isEmpty = (val) => val == null || !(Object.keys(val) || val).length;

module.exports = {
  groupBy,
  indexOn,
  isEmpty,
  objectFromStream,
  objectToEntries,
  getDateFromSid,
  getTimeFromSid,
};
