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

function set1(data) {
  const { key, node } = data;
  // note: we are calling jsonCache.get() first
  // not to be confused with this wrapper's get() function
  // (which is called by clients of this wrapper)
  return jsonCache
    .get(key, '.')
    .then((x) => getPath(x, node))
    .then((data) => setX(key, data.path, data.val));
}

// TODO add expiration to keys
function setX(data) {
  console.log('setX()', printJson(data));

  const { key, path, node } = data;
  return (
    jsonCache
      .set(key, path, node)
      // compared to set() above, here we do call the internal get()
      // and return this Promise to the caller (so it doesn't have to query the cache)
      .then((ok) => {
        console.log(ok);
        get(key, path);
      })
      .catch((e) => {
        console.error(e);
        return e;
      })
  );
}

function getPath1(x, node) {
  let path, val;
  if (!x) {
    path = '.';
    // prepend _ in id
    let n = {};
    n['_' + Object.keys(node)[0]] = Object.values(node)[0];
    val = n;
  } else {
    path = '._' + Object.keys(node)[0];
    val = Object.values(node)[0];
  }
  return { path, val };
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

function whenEmpty(path, n) {
  // value will be the composite object
  const label = '_' + path;
  // now reset path to root
  path = '.';
  // now move the path passed in to the name of the object to cache
  return {
    path: path,
    node: {
      [label]: n,
    },
  };
}

function x(path, node) {
  return {
    path: '._' + path,
    node: node,
  };
}

function getPath(data) {
  console.log('getPath()', printJson(data));
  const { key, path, node } = data;
  const result = isEmpty(key, path) ? whenEmpty(path, node) : x(path, node);
  return { key, ...result };
}

function set0(data) {
  console.log('set()', printJson(data));
  let results = getPath(data);
  console.log('getPath() result', printJson(results));

  return jsonCache
    .set(results.key, results.path, results.node)
    .then(() => jsonCache.get(results.key, results.path));
}
function set(data) {
  const { key, path, node } = data;
  if (!key) {
    console.info('No key to set');
    return;
  }
  console.log('set()', printJson(data));

  return jsonCache.set(key, path, node).then(() => jsonCache.get(key, '.'));
}

function printCache(key) {
  jsonCache.get(key, '.').then((node) => JSON.stringify(node, null, 3));
}

function printJson(json) {
  return JSON.stringify(json, null, 3);
}

module.exports = {
  append,
  del,
  get,
  isEmpty,
  printCache,
  set,
};
