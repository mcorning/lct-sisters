// see :https://developer.redislabs.com/howtos/redisjson/

const cache = require('./redisJsonCache');
const { printJson, err, success, warn } = require('./src/utils/colors');

// NOTE: redisJson requires us to prepend _ to ID string keys
const s1 = {
  '7f4903dd3e71eb28': {
    userID: '075b3b4935e8ea72',
    username: 'littleFox',
    lastInteraction: '6/22/2021, 1:55:21 PM',
    connected: false,
  },
};
const s2 = {
  '28b97087a9bd5fa8': {
    userID: 'ece07cf4a1340ea4',
    username: 'Tony',
    lastInteraction: '6/22/2021, 2:25:39 PM',
    connected: true,
  },
};
const s3 = {
  MPC97087a9bd5mpc: {
    userID: 'mpc07cf4a1340MPC',
    username: 'mpc',
    lastInteraction: '6/22/2021, 2:39 PM',
    connected: true,
  },
};
const sessions = [s1, s2, s3];
const defaultKey = 'sessionsTest';

function printCache(data) {
  const { key, path, note, node } = data;
  if (node) {
    // so you can chain functions:
    return printNode(node, note);
  }
  return cache
    .get(key || defaultKey, path)
    .then((node) => printNode(node, note));
}

function printNode(node, note) {
  console.log(success(note || '', printJson(node)));
  // so you can chain functions:
  return node;
}

function printResult(result, f, path) {
  if (result) {
    console.log(success(`Successfully ${f} sessions using ${path}`));
  } else {
    console.log(warn(`Failed to ${f} sessions  using ${path}`));
  }
}

function checkPath(path) {
  path = Array.isArray(path) ? path[0] : path;
  return path.startsWith('_') ? path : '_' + path;
}

function del(data) {
  const { key, path } = data;
  cache
    .del(key || defaultKey, checkPath(path))
    .then((x) => printResult(x, 'delete', path));
}

cache
  .isEmpty('sessionsTest')
  .then((isEmpty) => {
    console.log(
      isEmpty
        ? warn('Cache is empty, so be sure to add a key at the root')
        : success(
            'Cache is not empty, so use a path that prepends a "._" to the ID value'
          )
    );
  })
  .catch((e) => console.error(err(e)));

// set(
//  {
//    key, path, node;
//  }
// )
cache
  .set({
    key: 'sessionsTest',
    path: Object.keys(sessions[1])[0],
    node: Object.values(sessions[1])[0],
  })
  .then((x) => console.log('cache', x));
// .then(() => cache.set({ key: 'sessionsTest', node: sessions[1] }))
// .then(() => cache.set({ key: 'sessionsTest', node: sessions[0] }))
// .then(() =>
//   printCache({ key: 'sessionsTest', path: '.', note: 'End of the line.' })
// )
// .then((x) =>
//   console.log(
//     success(
//       'Tested printCache returns the cache after printing:',
//       '\n',
//       printJson(x)
//     )
//   )
// )
// .then(() => del({ path: Object.keys(sessions[0]) }))
// .then(() => del({ path: Object.keys(sessions[1]) }))
// .then(() => del({ path: Object.keys(sessions[2])[0] }))
// .then(() => del({ path: Object.keys(sessions[2]) }));
