// https://app.redislabs.com/#/bdb/tabs/conf/10283899
// lctgraph

module.exports = {
  graphName: process.env.NODE_ENV == 'production' ? 'Sisters' : 'Sandbox',
  redisHost: 'redis-16914.c53.west-us.azure.cloud.redislabs.com',
  redisPassword: 'kqhiYfB2XwoYV2Jy3vUw3eXDrWhCaSWq',
  redisPort: 16914,
};
