const right = (v) => ({
  map: (f) => right(f(v)), // The map() function in Try will call this function using what ever processing was in the parent's map function
  matchWith: (pattern) => pattern.right(v), // finally,the result of that parent process returns a pattern to the parent
});

const left = (v) => ({
  map: () => left(v),
  matchWith: (pattern) => pattern.left(v),
});

var Try = (f) => {
  try {
    var result = f(); // some function passed in and executed
    return right(result); // no error? return a right() function with result
  } catch (e) {
    return left(e); // error? return a left function with error (not a function)
  }
};

module.exports = { Try };
