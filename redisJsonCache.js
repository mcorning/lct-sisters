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

function getPath(x, node) {
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

function set(data) {
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
function setX(key, path, data) {
  return (
    jsonCache
      .set(key, path, data)
      // compared to set() above, here we do call the internal get()
      // and return this Promise to the caller (so it doesn't have to query the cache)
      .then(() => get(key, path))
      .catch((e) => {
        console.error(e);
        return e;
      })
  );
}

function printCache(key) {
  jsonCache.get(key, '.').then((node) => JSON.stringify(node, null, 3));
}

module.exports = {
  append,
  del,
  get,
  isEmpty,
  printCache,
  set,
};
