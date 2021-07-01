// see :https://developer.redislabs.com/howtos/redisjson/

const cache = require('./redisJsonCache');

// this high-order function calls the cache.isEmpty() only once (in create())
// because after that call, set()'s body only calls add()
let set = function(key, path, node) {
  return cache.create(key, path, node).then(() => {
    set = function(key, path, node) {
      return cache.add(key, path, node);
    };
    return set;
  });
};

//#region Tests
// NOTE: redisJson requires us to prepend _ to ID string keys
function bvt(key) {
  return set(key, 'MPC97087a9bd5mpc', {
    userID: 'mpc07cf4a1340MPC',
    username: 'mpc',
    lastInteraction: '6/22/2021, 2:39 PM',
    connected: true,
  }).then(() => key);
}
function bvt2(key) {
  return set(key, 'MPC97087a9bd5mpc', {
    userID: 'mpc07cf4a1340MPC',
    username: 'mpc',
    lastInteraction: '6/22/2021, 2:39 PM',
    connected: true,
  })
    .then(() =>
      set(key, '28b97087a9bd5fa8', {
        userID: 'ece07cf4a1340ea4',
        username: 'Tony',
        lastInteraction: '6/22/2021, 2:25:39 PM',
        connected: true,
      })
    )
    .then(() => key);
}

// using the same minimalist philosophy for test code
function bvtPrinted(key) {
  bvt2(key)
    .then((key) => console.log('Getting cache for', key, ':'))
    // now we can get() data from the root
    .then(() => cache.printCache(key));
}

// this object replaces a switch() statement
// each property is a combination of intentions
// we call on the object with the appropriate property to run the necessary function
const tests = { bvt: bvt, bvtPrinted: bvtPrinted };
// tests.bvt('sessionsTest');
tests.bvtPrinted('sessionsTest');
//#endregion Tests
