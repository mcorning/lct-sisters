const RedisGraph = require('redisgraph.js').Graph;

const graphOptions = require('./redisGraph.options.js');
const options = {
  host: graphOptions.redisHost,
  port: graphOptions.redisPort,
  password: graphOptions.redisPassword,
};
var redisPool = require('redis-connection-pool')('myRedisPool', {
  host: options.host, // default
  port: options.port, //default
  // optionally specify full redis url, overrides host + port properties
  // url: "redis://username:password@host:port"
  max_clients: 30, // defalut
  perform_checks: false, // checks for needed push/pop functionality
  database: 0, // database number to use
  options: {
    auth_pass: options.password,
  }, //options for createClient of node-redis, optional
});

redisPool.set('test-key', 'foobar', function(err) {
  console.log(err ? err : 'no errors');
  redisPool.get('test-key', function(err, reply) {
    console.log(reply); // 'foobar'
    console.log(err ? err : 'no errors');
  });
});
