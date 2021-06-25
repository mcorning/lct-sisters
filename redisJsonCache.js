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

function get(key, path) {
  return jsonCache
    .get(key, path || '.')
    .then((data) => data)
    .catch((error) => error);
}
function set(key, path, data) {
  return jsonCache.set(key, path || '.', data);
}

module.exports = {
  append,
  del,
  get,
  set,
};
