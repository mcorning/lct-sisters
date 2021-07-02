const {
  err,
  heading,
  warn,
  success,
  special,
  printJson,
  getNow,
  columns,
} = require('./src/utils/colors.js');

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
  console.log(options, '\n');

  jsonCache.get('sessions', '.').then((node) => {
    console.groupCollapsed('Past Sessions (including unconnected):');
    console.log(getNow(), printJson(node) || 'empty cache', '\n');
    console.groupEnd();
  });
});

function isEmpty(key, path = '.') {
  return jsonCache.objlen(key, path).then((x) => {
    console.log(getNow(), 'Cache size:', x);
    return !x;
  });
  // .then((x) => !x); // (x ? null : key));
}

function create(key, path, node) {
  // confirm a null key before creating one (i.e., don't overwrite a cache)
  return isEmpty(key).then((canCreate) => {
    canCreate
      ? jsonCache
          .set(key, '.', { ['_' + path]: node })
          .then((ok) => console.log(getNow(), success('Created?', ok)))
          .catch((e) => console.log(err('Error in create():', e)))
      : console.log(getNow(), 'Cache is not empty');
  });
}

// for every other set(), path must begin with _
function add(key, path, node) {
  return jsonCache
    .set(key, '_' + path, node)
    .then((ok) => console.log(getNow(), 'added?', ok))
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
    .then((node) =>
      console.log(getNow(), `Cache (${key}) for ${path}`, printJson(node))
    )
    .catch((e) => console.log(err('Error in cache.printCache()', e)));
}

function filter(key, fn, path = '.') {
  return get(key, path).then((cache) => Object.entries(cache).filter(fn));
}

function map(key, fn, path = '.') {
  return get(key, path).then((cache) => Object.entries(cache).map(fn));
}

function asTable(o) {
  const s = Object.keys(o); //[s1,s2...]
  let hs = Object.values(o)[0];
  let hsk = ['sessionID', ...Object.keys(hs)];

  const heads = (k) => heading(k);
  const pk = (v, i) => [s[i], ...v];

  const vals = Object.entries(o).map((v) => Object.values(v[1]));
  const finalGrid = vals.map(pk);

  console.log(columns([hsk.map(heads), ...finalGrid]));
}

module.exports = {
  add,
  append,
  create,
  del,
  filter,
  get,
  isEmpty,
  map,
  printCache,
  asTable,
};
