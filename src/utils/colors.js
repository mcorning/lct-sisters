const clc = require('cli-color');
const success = clc.green.bold;
const error = clc.red.bold;
const warn = clc.yellow;
const info = clc.cyan;
const notice = clc.blue;
const highlight = clc.magenta;
const bold = clc.bold;
const bgBlue = clc.bgBlue;
const bgMagenta = clc.bgMagenta;

function printJson(json) {
  return JSON.stringify(json, null, 3);
}

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min); //The maximum is inclusive and the minimum is inclusive
}

module.exports = {
  getRandomIntInclusive,
  printJson,
  success,
  error,
  warn,
  info,
  notice,
  highlight,
  bold,
  bgBlue,
  bgMagenta,
};
