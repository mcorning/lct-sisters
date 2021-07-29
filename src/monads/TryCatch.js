const right = (v) => ({
  map: (f) => right(f(v)),
  matchWith: (pattern) => pattern.right(v),
});

const left = (v) => ({
  map: () => left(v),
  matchWith: (pattern) => pattern.left(v),
});

var Try = (f) => {
  try {
    var result = f();
    return right(result);
  } catch (e) {
    return left(e);
  }
};

module.exports = { Try };
