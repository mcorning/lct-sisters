//https://medium.com/@dimpapadim3/async-functional-error-handling-9332dfe9f78c
//Copyright (c) 2019 dimitris papadimitriou
const fetch = require('node-fetch');

(function() {
  const compose = (...fns) => (x) => fns.reduceRight((y, f) => f(y), x);

  const id = (x) => x;

  const EitherAsync = (actions, resolveMappings, rejectMappings) => ({
    map: (f) =>
      EitherAsync(actions, compose(f, resolveMappings), rejectMappings),

    mapError: (f) =>
      EitherAsync(actions, resolveMappings, compose(f, rejectMappings)),

    bimap: (f, g) =>
      EitherAsync(
        actions,
        compose(f, resolveMappings),
        compose(g, rejectMappings)
      ),

    ap: (fv) =>
      EitherAsync(
        (resolve, reject) =>
          actions(
            (f) =>
              fv.map(compose(f, resolveMappings)).cata({
                ok: resolve,
                error: reject,
              }),
            reject
          ),
        resolveMappings,
        rejectMappings
      ),

    bind: (f) =>
      EitherAsync(
        (resolve, reject) =>
          actions(
            (x) =>
              f(resolveMappings(x)).cata({
                ok: resolve,
                error: reject,
              }),
            reject
          ),
        id,
        id
      ),

    cata: (alg) =>
      actions(
        compose(alg.ok, resolveMappings),
        compose(alg.error, rejectMappings)
      ),

    toPromise: () =>
      new Promise((resolve, reject) =>
        actions(
          compose(resolve, resolveMappings),
          compose(reject, rejectMappings)
        )
      ),
    toEither: () => EitherAsync(actions, resolveMappings, rejectMappings),
  });

  Promise.prototype.toEither = function() {
    return EitherAsync(
      (resolve, reject) => this.then(resolve).catch(reject),
      id,
      id
    );
  };
})();

const ok = (v) => ({
  v: v,
  map: (f) => ok(f(v)),
  cata: (alg) => alg.ok(v),
});

const error = (v) => ({
  v: v,
  map: () => error(v),
  cata: (alg) => alg.error(v),
});

Promise.prototype.map = function(mapping) {
  var initialPromise = this;
  return new Promise(function(resolve) {
    initialPromise.then((result) => resolve(mapping(result)));
  });
};

var getUser = () => fetch('https://api.github.com/users');

var getUserFollowers = (name) =>
  fetch('https://api.github.com/users/' + name + '/followers');

var toJson = (response) => response.json();

getUser()
  .map(toJson)
  .toEither()

  .map((users) => users[0].login)
  .bind((v) =>
    getUserFollowers(v)
      .map(toJson)
      .toEither()
  )
  .map((followers) => followers.map((follower) => follower.login))
  .cata({
    ok: (v) => console.log(v),
    error: (v) => console.log('Error' + v),
  });
