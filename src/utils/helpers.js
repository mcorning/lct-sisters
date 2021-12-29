// see https://www.npmjs.com/package/cli-color

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
const truthCheckCollection = (collection, pre) => collection.every(obj => obj[pre]);

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min); //The maximum is inclusive and the minimum is inclusive
}

module.exports = {
  isEmpty,
  truthCheckCollection,
  columns,
  getRandomIntInclusive,
  printJson,
  getNow,
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
