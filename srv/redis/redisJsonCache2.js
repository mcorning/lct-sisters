// const redis = require('redis');
const {
  err,
  heading,
  success,
  warn,
  columns,
  printJson,
  getNow,
  //   columns,
} = require('../../src/utils/helpers.js');

let options;

if (process.env.NODE_ENV === 'production') {
  console.log('Dereferencing process.env');
  options = {
    host: process.env.REDIS_CACHE_HOST,
    port: process.env.REDIS_CACHE_PORT,
    password: process.env.REDIS_CACHE_PASSWORD,
  };
} else {
  console.log('Dereferencing redisConfig.js');
  const cacheOptions = require('./redisCache.options.js');
  options = {
    host: cacheOptions.redisCacheHost,
    port: cacheOptions.redisCachePort,
    password: cacheOptions.redisCachePassword,
  };
}

const Rejson = require('iorejson');

const heads = (k) => heading(k);

function handleAsSingleEntry(cache) {
  // the fields of the single entry cache
  const headings = Object.keys(cache).map(heads);

  const vals = Object.values(cache);
  const finalGrid = [headings, vals];
  return finalGrid;
}

function handleAsManyEntries(cache) {
  const primaryKeys = Object.keys(cache);
  // array of objects each with the values of their cache
  const headings = Object.keys(Object.values(cache)[0]);
  const allHeadings = ['sessionID', ...headings].map(heads);

  // insert the primary keys
  const insertPrimaryKeys = (v, i) => [primaryKeys[i], ...v];

  const vals = Object.entries(cache).map((v) => Object.values(v[1]));
  // don't iterate the elements of allHeadings,
  // add the single array of headings to the array of cache element values
  const finalGrid = [allHeadings, ...vals.map(insertPrimaryKeys)];
  return finalGrid;
}

function asTable(cache) {
  const fn =
    typeof Object.values(cache)[0] === 'string'
      ? handleAsSingleEntry
      : handleAsManyEntries;
  console.log(columns(fn(cache)));
}

function ensureValidPath(path) {
  if (path && !path.startsWith('_')) {
    path = '_' + path;
  }
  return path;
}

Rejson.defaultOptions = options;
const jsonCache = new Rejson();
jsonCache
  .connect()
  .then(() => {
    console.log('....................... RedisJSON .........................');
    console.groupCollapsed('\tConnected to RedisJSON using:');
    console.log(printJson(options), '\n');

    jsonCache.get('alerts', '.').then((node) => {
      if (Object.keys(node).length > 0) {
        console.log(getNow());
        console.log(
          '....................... RedisJSON .........................'
        );
        console.groupCollapsed('\tPast Alerts (including unconnected):');
        asTable(node);
        console.groupEnd();
        console.log(
          '.........................................................'
        );
      }
    });
    console.groupEnd();
    console.log('.........................................................');
  })
  .catch((e) => console.log('error connecting to rejson', e));

function add(key, path, node) {
  return jsonCache
    .set(key, '._' + path, node)
    .catch((e) => console.log(err('Error in add()', printJson(e))));
}

function del(key, path) {
  return jsonCache.del(key, ensureValidPath(path) || '.');
}

function isEmpty(key, path = '.') {
  return jsonCache.objlen(key, path).then((x) => {
    console.log(getNow(), 'Cache size:', x);
    return !x;
  });
}

function get(key, path = '.') {
  return jsonCache
    .get(key, ensureValidPath(path))
    .then((data) => data)
    .catch(() => {
      console.log(
        warn(`${path} not found in sessions cache. Will add them next.`)
      );
    });
}

function set(key, path, node) {
  return jsonCache
    .set(key, ensureValidPath(path), node)
    .catch((e) => console.log('Error in set()', e));
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
module.exports = {
  add,
  create,
  del,
  get,
  set,
  isEmpty,
  asTable,
};
