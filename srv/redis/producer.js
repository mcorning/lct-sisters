const { redis } = require('./connect');

const testData = [
  ['xadd', 'warnings', '*', 'test1', 'test1 Value'],
  ['xadd', 'warnings', '*', 'test2', 'test2 Value'],
  ['xadd', 'warnings', '*', 'test3', 'test3 Value'],
];
redis.pipeline(testData).exec(() => console.log('Done'));
// See https://www.npmjs.com/package/ioredis for more fun and profit
