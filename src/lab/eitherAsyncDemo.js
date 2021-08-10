//https://medium.com/@dimpapadim3/async-functional-error-handling-9332dfe9f78c
//Copyright (c) 2019 dimitris papadimitriou
const fetch = require('node-fetch');

require('either-async');

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
  // getUser() returns a promise, so this map() function is in the Promise (not the array returned by fetch)
  .map(toJson) //toJson() will be the mapping arg for the Promise's map and will be the name of the function called as the resolve method of the Promise
  // map() returns a JSON type
  .toEither() // converts the list of users returned by the Promise so the EitherAsync's map function (next) works

  .map((users) => users[10].login)
  .bind((ofUser) =>
    getUserFollowers(ofUser)
      .map(toJson)
      .toEither()
  )
  .map((followers) => followers.map((follower) => follower.login))
  .cata({
    ok: (v) => console.log(v),
    error: (v) => console.log('Error' + v),
  });
