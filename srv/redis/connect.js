let options;
if (process.env.NODE_ENV === 'production') {
  console.log('Dereferencing process.env');
  options = {
    host: process.env.REDIS_CACHE_HOST,
    port: process.env.REDIS_CACHE_PORT,
    password: process.env.REDIS_CACHE_PASSWORD,
  };
} else {
  const cacheOptions = require('./options');
  options = {
    host: cacheOptions.redisCacheHost,
    port: cacheOptions.redisCachePort,
    password: cacheOptions.redisCachePassword,
  };
}

const Redis = require('ioredis');
const redis = new Redis(options);

module.exports = { redis };
