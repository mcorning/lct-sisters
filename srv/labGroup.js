const { formatTime } = require('../src/utils/luxonHelpers');
const visits = [
  'Sisters Coffee Company',
  'The Open Door',
  'The Open Door',
  'The Open Door',
];

const mapWarnings = () => {
  const y = groupBy(visits);
  console.log(JSON.stringify(y, null, 2));
};

const groupBy = (arr) =>
  arr.reduce((acc, val, i, a) => {
    // console.log(acc);
    // console.log(val);
    // console.log(a[i - 1]);
    // console.log(a[i + 1]);
    acc[val] = acc[val] || [];
    // const changed = a[i - 1] !== val;
    // const ct = changed ? 1 : i + 1;
    acc[val] = i + 1;

    return acc;
  }, {});

mapWarnings();
