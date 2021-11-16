const cacheOptions = require('./options.js');
const options = {
  host: cacheOptions.redisCacheHost,
  port: cacheOptions.redisCachePort,
  password: cacheOptions.redisCachePassword,
};
async function query(query, params) {
  if (params) {
    query = this.buildParamsHeader(params) + query;
  }
  var res = await this._sendCommand('graph.QUERY', [
    this._graphId,
    query,
    '--compact',
  ]);
  var resultSet = new ResultSet(this);
  return resultSet.parseResponse(res);
}

const Redis = require('ioredis');
const { graphName } = require('./redisGraph.options.js');
const redis = new Redis(options);

function callProcedure(procedure, args = new Array(), y = new Array()) {
  let q = 'CALL GRAPH.LIST';
  return query(q);
}

callProcedure().then((r) => console.log(r));
module.exports = { redis };
