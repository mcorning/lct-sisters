import { Some, None } from './maybe.js';
import { info, printJson } from '../../utils/helpers';

export let firstOrNone = function(array) {
  return array?.length > 0 ? Some(array[0]) : None();
};
export let allOrNone = function(array) {
  return array?.length > 0 ? Some(array) : None();
};

export let inspect = (v) => {
  console.log(info('Inspecting:', printJson(v)));
  return v;
};

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
