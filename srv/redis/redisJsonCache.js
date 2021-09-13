const {
  err,
  heading,
  warn,
  success,
  printJson,
  getNow,
  columns,
} = require('../../src/utils/helpers.js');

const cacheOptions = require('./redisCache.options.js');
const options = {
  host: cacheOptions.redisCacheHost,
  port: cacheOptions.redisCachePort,
  password: cacheOptions.redisCachePassword,
};

const Rejson = require('iorejson');

Rejson.defaultOptions = options;

const jsonCache = new Rejson();
jsonCache
  .connect()
  .then(() => {
    console.log(getNow());
    console.log('Connected to RedisJSON using:');
    console.log(options, '\n');

    jsonCache.get('sessions', '.').then((node) => {
      if (Object.keys(node) > 0) {
        console.log(getNow());
        console.groupCollapsed('Past Sessions (including unconnected):');
        asTable(node);
        console.groupEnd();
      }
    });
  })
  .catch((e) => console.log('error connecting to rejson', e));

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
    .then((node) => {
      console.log(getNow());
      console.log(`Cache (${key}) for ${path}:`);
      asTable(node);
    })
    .catch((e) => console.log(err('Error in cache.printCache()', e)));
}

function filter(key, fn, path = '.') {
  return get(key, path).then((cache) => Object.entries(cache).filter(fn));
}

function map(key, fn, path = '.') {
  return get(key, path).then((cache) => Object.entries(cache).map(fn));
}

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

// TODO play with Console.BackgroundColor = ConsoleColor.Green
function asTable(cache) {
  const fn =
    typeof Object.values(cache)[0] === 'string'
      ? handleAsSingleEntry
      : handleAsManyEntries;
  console.log(columns(fn(cache)));
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
