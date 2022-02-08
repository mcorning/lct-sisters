let options;
if (process.env.NODE_ENV === 'production') {
  console.log('Dereferencing process.env');
  options = {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    keyPrefix: 'act:',
  };
} else {
  const graphOptions = require('./redisGraph.options.js');
  options = {
    host: graphOptions.redisHost,
    port: graphOptions.redisPort,
    password: graphOptions.redisPassword,
    keyPrefix: 'act:',
    showFriendlyErrorStack: true,
  };
}

const Redis = require('ioredis');
const redis = new Redis(options);
console.log('options:>>', options);

module.exports = { redis };
