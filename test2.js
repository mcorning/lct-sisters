// see :https://developer.redislabs.com/howtos/redisjson/

const cache = require('./redisJsonCache');
const { printJson, err, success, warn } = require('./src/utils/colors');

// NOTE: redisJson requires us to prepend _ to ID string keys
const s1 = {
  MPC97087a9bd5mpc: {
    userID: 'mpc07cf4a1340MPC',
    username: 'mpc',
    lastInteraction: '6/22/2021, 2:39 PM',
    connected: true,
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
// start with path = root
cache.set({
  key: 'sessionsTest',
  path: '.',
  node: s1,
});
// for every other set(), path must begin with _
cache
  .set({
    key: 'sessionsTest',
    path: '_28b97087a9bd5fa8',
    node: s2,
  })
  // will get() from the root
  .then((x) => console.log('cache', x));
