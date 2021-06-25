const cache = require('./redisJsonCache');
const {
  printJson,
  err,
  success,
  warn,
  highlight,
} = require('./src/utils/colors');

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
// add this back in if we need to use Arrays
// function append(rootNode, path, data) {
//   return cache.append(rootNode, path, data).then((x) => printX(x));
// }

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

function readyData(data, key = defaultKey) {
  const path = '._' + Object.keys(data)[0];
  return {
    key: key,
    path: path,
    node: Object.values(data)[0],
  };
}

function appendObject(data) {
  const { key, path, node } = data;

  cache
    .set(key || defaultKey, path, node)
    .then((x) => printResult(x, 'appended', path));
}

function del(data) {
  const { key, path } = data;

  cache
    .del(key || defaultKey, path)
    .then((x) => printResult(x, 'delete', path));
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

function setTest(data) {
  const { key, node } = data;
  return cache
    .get(key, '.')
    .then((x) => getPath(x, node))
    .then((data) => cache.set(key, data.path, data.val))
    .then(() => cache.get(key));
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

// setTest({ key: 'sessionsTest', node: sessions[2] });
setTest({ key: 'sessionsTest', node: sessions[0] })
  .then((x) => printCache({ node: x, note: 'Test ->' }))
  .then(() => appendObject(readyData(sessions[1])))
  .then(() => appendObject(readyData(sessions[2])))
  .then(() =>
    printCache({ key: 'sessionsTest', path: '.', note: 'End of the line.' })
  )
  .then((x) =>
    console.log(
      success(
        'Tested printCache returns the cache after printing:',
        '\n',
        printJson(x)
      )
    )
  );
// .then(() => del(readyData(sessions[0])))
// .then(() => del(readyData(sessions[1])))
// .then(() => del(readyData(sessions[2])))
// .then(() => del(readyData(sessions[0])));
