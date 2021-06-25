const cacheOptions = require('./redisCache.options.js');
const options = {
  host: cacheOptions.redisCacheHost,
  port: cacheOptions.redisCachePort,
  password: cacheOptions.redisCachePassword,
};

const Rejson = require('iorejson');
Rejson.defaultOptions = options;
const jsonCache = new Rejson();
jsonCache.connect().then(() => {
  console.log('Connected to Redis using:');
  console.log(options);
  console.log(Rejson.commands);
});

function append(key, path, data) {
  return jsonCache
    .arrappend(key, path || '.', data)
    .then((data) => data)
    .catch((error) => error);
}

function del(key, path) {
  return jsonCache.del(key, path || '.');
}

function get(key, path = '.') {
  return jsonCache
    .get(key, path)
    .then((data) => data)
    .catch((error) => error);
}

function isEmpty(key, path = '.') {
  return jsonCache.objlen(key, path).then((x) => x === 0);
}

// TODO add expiration to keys
function set(key, path, data) {
  return jsonCache.set(key, path, data).catch((e) => {
    console.error(e);
    return e;
  });
}

function setX(key, path, data) {
  isEmpty(path)
    .then((isEmpty) => {
      isEmpty;
    })
    .then((isEmpty) => (isEmpty ? '.' : '._'))
    .then((path) => printOut(path))
    .then((path) => jsonCache.set(key, path, data))
    .catch((e) => console.log(e));
}

function printCache(key) {
  jsonCache.get(key, '.').then((node) => JSON.stringify(node, null, 3));
}

function printOut(string) {
  console.log(string);
  return string;
}

module.exports = {
  append,
  del,
  get,
  isEmpty,
  printCache,
  set,
};
