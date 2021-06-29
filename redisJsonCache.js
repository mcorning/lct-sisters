const cacheOptions = require('./redisCache.options.js');
const options = {
  host: cacheOptions.redisCacheHost,
  port: cacheOptions.redisCachePort,
  password: cacheOptions.redisCachePassword,
};

const Rejson = require('iorejson');
Rejson.defaultOptions = options;
const jsonCache = new Rejson();
// jsonCache.connect().then(() => {
//   console.log('Connected to Redis using:');
//   console.log(options);
//   console.log(Rejson.commands);
// });

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
  return jsonCache
    .objlen(key, path)
    .then((x) => {
      console.log('Cache size:', x);
      return x;
    })
    .then((x) => (x ? null : key));
}

function set(data) {
  const { key, path, node } = data;
  if (!key) {
    console.info('Data exists. No key to set in create()');
    return;
  }
  console.log('set()', printJson(data));

  return jsonCache.set(key, path, node).then(() => jsonCache.get(key, '.'));
}

function printCache(key) {
  jsonCache.get(key, '.').then((node) => console.log(printJson(node)));
}

function printJson(json) {
  const j = JSON.stringify(json, null, 3);
  return j;
}

module.exports = {
  append,
  del,
  get,
  isEmpty,
  printCache,
  printJson,
  set,
};
