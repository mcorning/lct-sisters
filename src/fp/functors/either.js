Promise.prototype.map = function(mapping) {
  var initialPromise = this;
  return new Promise(function(resolve) {
    initialPromise.then((result) => resolve(mapping(result)));
  });
};

var EitherCoyoAsync = function(actions, g) {
  this.g = g;

  this.map = (f) => new EitherCoyoAsync(actions, (x) => f(this.g(x)));

  this.matchWith = (alg) => actions((x) => alg.ok(this.lower(x)), alg.error);

  this.lower = (v) => this.g(v);
};

Promise.prototype.toEither = function() {
  var initialPromise = this;
  var either = new EitherCoyoAsync(
    function(resolve, reject) {
      initialPromise.then(resolve).catch(reject);
    },
    (x) => x
  );
  return either;
};
