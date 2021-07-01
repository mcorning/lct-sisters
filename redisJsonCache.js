const { err, warn, success, special } = require('./src/utils/colors.js');

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
  console.log(special(new Date().toLocaleString()));
  console.log('Connected to RedisJSON using:');
  console.log(options);

  jsonCache.get('sessions', '.').then((node) => {
    console.groupCollapsed('Past Sessions:');
    console.log(printJson(node) || 'empty cache');
    console.groupEnd();
  });
});

function isEmpty(key, path = '.') {
  return jsonCache
    .objlen(key, path)
    .then((x) => {
      console.log('Cache size:', x);
      return x;
    })
    .then((x) => !x); // (x ? null : key));
}

function create(key, path, node) {
  // confirm a null key before creating one (i.e., don't overwrite a cache)
  return isEmpty(key).then((canCreate) => {
    canCreate
      ? jsonCache
          .set(key, '.', { ['_' + path]: node })
          .then((ok) => console.log(success('Created?', ok)))
          .catch((e) => console.log(err('Error in create():', e)))
      : console.log('Data exists. No create() results');
  });
}

// for every other set(), path must begin with _
function add(key, path, node) {
  return jsonCache
    .set(key, '_' + path, node)
    .then((ok) => console.log('added?', ok))
    .catch((e) => console.log(err('Error in add()', printJson(e))));
}

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
    .catch(() => {
      console.log(
        warn(`${path} not found in sessions cache. Will add them next.`)
      );
    });
}

function printCache(key, path = '.') {
  jsonCache
    .get(key, path)
    .then((node) => console.log(printJson(node)))
    .catch((e) => console.log(err('Error in cache.printCache()', e)));
}

function printJson(json) {
  const j = JSON.stringify(json, null, 3);
  return j;
}

module.exports = {
  add,
  append,
  create,
  del,
  get,
  isEmpty,
  printCache,
  printJson,
};
