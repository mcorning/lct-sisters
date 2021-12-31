const groupBy = (arr, fn) =>
  arr
    .map(typeof fn === 'function' ? fn : (val) => val[fn])
    .reduce((acc, val, i) => {
      acc[val] = (acc[val] || []).concat(arr[i]);
      return acc;
    }, {});

const objectFromStream = (stream) => {
  return stream[1].reduce((a, c, i, pairs) => {
    if (i % 2 === 0) {
      (a[c] = pairs[i + 1]), a;
    }
    return a;
  }, {});
};

module.exports = {
  groupBy,
  objectFromStream,
};
