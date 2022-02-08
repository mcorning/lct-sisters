const { redis } = require('./connect');

const { entryFromStream } = require('../utils.js');

const printJson = (json) => JSON.stringify(json, null, 2);

const processMessage = (message) => {
  console.log(message.key);
  console.log(`Value: ${printJson(message.value)}`);
};

const handleRedisError = (err) => {
  console.log('error :>> ', err.message);
  console.log('command :>> ', JSON.stringify(err, null, 2));
  console.log('stack :>> ', err.stack);
};

//keyPrefix option appends 'act:'
const key = 'warnings';

function listenForMessage(lastId = '$') {
  // `results` is an array, each element of which corresponds to a key.
  // Because we only listen to one key (act:warnings) here,
  // `results` only contains a single element.
  //See more: https://redis.io/commands/xread#return-value
  redis
    .xread('BLOCK', 0, 'STREAMS', key, lastId)
    .then((results) => {
      const [thisKey, messages] = results[0];
      const x = entryFromStream(messages);
      process.stdout.write(`Key :>> ${thisKey}:`);
      x.forEach(processMessage);

      // Pass the last id of the results to the next round.
      const lastDeliveredId = messages[messages.length - 1][0];
      listenForMessage(lastDeliveredId);
    })
    .catch((e) => handleRedisError(e));
}

listenForMessage();
