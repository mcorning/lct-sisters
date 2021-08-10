// think of some() as a type. the functional chain expects this type with each step in processing
// once instantiated, a some() carries around a reference to a value (v). every other function in the some() closure has access to v.
const some = (v) => ({
  map: (f) => some(f(v)),
  inspect: () => some(inspect(v)), // if you call outside some(), you better return the value you exported and re-wrap that returned value in a some() so subsequent steps have the type they expect (viz., some())
  bind: (f) => f(v), // the name of the LHS function must match the RHS, but the name can be anything if it's consistent
  matchWith: (pattern) => pattern.some(v),
});

// be sure none() has the same structure as some(). e.g., don't leave out the inspect(), otherwise a none() result will, itself, throw a null reference exception
const none = () => ({
  map: () => none(),
  inspect: () => none(),
  bind: () => none(),
  matchWith: (pattern) => pattern.none(),
});

// this is a new closure where v is now private to inspect().
const inspect = (v) => {
  console.log(v);
  return v; // return what you logged otherwise you return undefined to some()
};

// hacking the prototype of a primitive is risky if future versions of the primitive acquire the same name.
// see the clientRepositoryBetter() function for a virually the same implimentation that is safe and laconic.
Array.prototype.firstOrNone = function(predicate) {
  var result = this.find(predicate);
  // this determines how the rest of the functional chain operates...all the way down to the matchWith() function
  if (result) return some(result);
  console.log('None it is...');
  return none();
};

const firstOrNone = function(result) {
  // this determines how the rest of the functional chain operates...all the way down to the matchWith() function
  if (result) return some(result);
  console.log('None it is...');
  return none();
};

var clientRepository = {
  getById: (id) =>
    [
      { id: 1, name: 'jim', age: 29, employeeId: 1 },
      { id: 2, name: 'jane', age: 25, employeeId: 3 },
    ].firstOrNone((c) => c.id == id),
};

var clientRepositorySafe = {
  getById: (id) => {
    const result = [
      { id: 1, name: 'jim', age: 29, employeeId: 1 },
      { id: 2, name: 'jane', age: 25, employeeId: 3 },
    ].find((c) => c.id == id);
    return result ? some(result) : none();
  },
};
var clientRepositoryBetter = {
  getById: (id) =>
    firstOrNone(
      [
        { id: 1, name: 'jim', age: 29, employeeId: 1 },
        { id: 2, name: 'jane', age: 25, employeeId: 3 },
      ].find((c) => c.id == id)
    ),
};

var employeesRepository = {
  getById: (id) =>
    [
      { id: 1, name: 'jim', age: 29 },
      { id: 2, name: 'jane', age: 25 }, // here we have an employee with the same name/age as a client, but the client has a different/wrong employeeId
    ].firstOrNone((e) => e.id == id), // returns a Maybe
};

const id = 10;
clientRepositoryBetter
  .getById(id)
  // what type do we have here? some() or none()
  .inspect()
  .bind((client) => employeesRepository.getById(client.employeeId))
  .map((client) => client.name)
  .matchWith(
    // you will be passing this structure to some() or none(). note we added a silly option that matters not
    // as long as you don't return a huh in the function chain (or if you do, you better have an explicit huh type/function to work with (otherwise you defeat the whole purpose of the Maybe monad))
    {
      some: (value) => console.log(`Client name is ${value}`),
      none: () => console.log(`Employee ${id}  not found`),
      huh: null, // dander, Will Robinson. there is no code to back up a reference to huh
    }
  );

/**
 * Observation: in JS, it's data all the way down.
 * Immutable data is safe. Idempotent functions are safe.
 * Idempotent/Immutable design is safe.
 * That is, functional designs that are wide open can, themselves, be many things; not one thing.
 * This freedom yields designs that are not idempotent.
 * That is, a design that uses two functions to produce the same result is unnecessarily complicated, so is likely to be unreliable.
 * Simpler designs are better not because they are simpler, but because they are more likely to work.
 */
