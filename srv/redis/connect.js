const cacheOptions = require('./options.js');
const options = {
  host: cacheOptions.redisCacheHost,
  port: cacheOptions.redisCachePort,
  password: cacheOptions.redisCachePassword,
};

const Redis = require('ioredis');
const redis = new Redis(options);
module.exports = { redis };
