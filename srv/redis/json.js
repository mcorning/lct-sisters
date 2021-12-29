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
  const cacheOptions = require('./redisJson.options.js');
  options = {
    host: cacheOptions.redisHost,
    port: cacheOptions.redisPort,
    password: cacheOptions.redisPassword,
  };
}

const heads = (k) => heading(k);

function handleAsSingleEntry(cache) {
  // the fields of the single entry cache
  const headings = Object.keys(cache).map(heads);

  const vals = Object.values(cache);
  return [headings, vals];
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
  return [allHeadings, ...vals.map(insertPrimaryKeys)];
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
    return `_${path}`;
  }
  return path;
}

const Rejson = require('iorejson');
Rejson.defaultOptions = options;
const jsonCache = new Rejson();

function connectCache(init = false) {
  return new Promise((resolve, reject) => {
    jsonCache
      .connect()
      .then(() => {
        if (init) {
          jsonCache
            .get('alerts', '.')
            .then((node) => {
              const keys = Object.keys(node);
              const pending = keys.length ? keys.join('\n') : 'nobody';
              console.log(
                success(
                  '....................... RedisJSON .........................'
                )
              );
              console.log(success('Connected to RedisJSON using:'));
              console.log(success(JSON.stringify(options, null, 3)));
              console.log(success('There are pending alerts for: '));
              console.log(success('\t', pending));
              console.log(
                success(
                  '.........................................................\n'
                )
              );
              console.log();
            })
            .catch((e) => {
              console.log(e);
            });
        }
        resolve(true);
      })
      .catch((e) => reject(e));
  });
}

function add(key, path, node) {
  return jsonCache
    .set(key, `._${path}`, node)
    .catch((e) => console.error(err('Error in add()', printJson(e))));
}

function del(key, path) {
  return jsonCache.del(key, ensureValidPath(path) || '.');
}

function filter(data, fn) {
  console.log(data);
  switch (typeof data) {
    case 'string':
      return get(data).then((d) => {
        if (d) {
          return Object.entries(d).filter(fn);
        }
        return [];
      });
    case 'object':
      return Object.entries(data).filter(fn);
    default:
      return `Expecting string or object. Actual data is ${typeof data}.`;
  }
}

// TODO Consider: a better design here. Why is it an error if you cannot find a record?
function get(key, message, path = '.') {
  console.log(warn(message));
  return jsonCache
    .get(key, ensureValidPath(path))
    .then((data) => data)
    .catch(() => {
      console.log(warn('...Pending cache item not found'));
    });
}

function has(key, path = '.') {
  return get(key, path).then((data) => !!data);
}

function isEmpty(key, path = '.') {
  return jsonCache.objlen(key, path).then((x) => {
    console.log(getNow(), 'Cache size:', x);
    return !x;
  });
}

function set(key, path, node) {
  return jsonCache
    .set(key, ensureValidPath(path), node)
    .catch((e) => console.error('Error in set()', e));
}

// TODO Investigate why isEmpty() can fail (often)
function create(key, path, node) {
  // confirm a null key before creating one (i.e., don't overwrite a cache)
  return isEmpty(key).then((canCreate) => {
    if (canCreate) {
      jsonCache
        .set(key, '.', { [`_${path}`]: node })
        .then((ok) => console.log(getNow(), success('Created?', ok)))
        .catch((e) => console.error(err('Error in create():', e)));
    } else {
      console.log(getNow(), 'Cache is not empty');
    }
  });
}
module.exports = {
  connectCache,
  add,
  create,
  del,
  filter,
  get,
  has,
  isEmpty,
  set,
  asTable,
};
