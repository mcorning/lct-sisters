// const options = require('./options');
// console.log(options);
// const Redis = require('ioredis');
// const redis = new Redis(options);
// you may find this read https://redis.io/topics/streams-intro
// very helpfull as a starter to understand the usescases and the parameters used
const { redis } = require('./connect');
// const { DateTime, getNow } = require('../../src/utils/luxonHelpers');

// const f = function() {
//   const channel = 'alerts-1';
//   // specify the channel. you want to know how many alerts
//   // have been written in this channel
//   redis
//     .xlen(channel)
//     .then((a) => {
//       console.log(`current alert count in channel ${channel} is ${a} alerts`);
//     })
//     .catch(() => console.log());
//   // specify channel to write a alert into,
//   // alerts are key value
//   const add = true;
//   if (add) {
//     const alerted = getNow(DateTime.DATETIME_MED);
//     console.log(alerted);
//     redis
//       .xadd(
//         channel,
//         '*',
//         'alerted',
//         alerted,
//         'exposedOn',
//         '2021-11-22',
//         'exposedFor',
//         '0.5 hrs'
//       )
//       .then((r) => console.log('added alert', r))
//       .catch();
//   }

//   // use xread to read all alerts in channel
//   redis.xread(['STREAMS', channel, 0]).then((stream) => {
//     console.log(JSON.stringify(stream, null, 3));

//     const alerts = new Map(stream);
//     console.log(
//       `Reading alerts from channel ${channel}, found ${alerts.size} alerts`
//     );
//     alerts.forEach((alertData, channel) => {
//       console.log(channel);
//       let alerts = new Map(alertData);
//       alerts.forEach((alert, id) => {
//         console.log('Alert ID:', id);
//         let names = alert.filter((v, i) => i % 2 === 0);
//         let values = alert.filter((v, i) => i % 2 !== 0);
//         var zipped = names.map(function(name, i) {
//           return { [name]: values[i] };
//         });
//         console.log(JSON.stringify(zipped, null, 3));
//       });
//     });
//   });
// };

const addSponsor = ({ sid, oid }) => {
  const channel = 'sponsors';
  return redis.xadd(channel, '*', 'sid', sid, 'oid', oid);
};

module.exports = { addSponsor };
