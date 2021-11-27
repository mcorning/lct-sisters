// you may find this read https://redis.io/topics/streams-intro
// very helpfull as a starter to understand the usescases and the parameters used
const { redis } = require('./connect');

const addSponsor = ({ sid, oid }) => {
  const channel = 'sponsors';
  return redis.xadd(channel, '*', 'sid', sid, 'oid', oid);
};
const addVisit = ({ sid, uid }) => {
  const channel = 'visits';
  return redis.xadd(channel, '*', 'sid', sid, 'uid', uid);
};

const getVisits = (sid) => {
  const channel = 'visits';
  const lastID = 0;
  return redis.xread(['STREAMS', channel, lastID]).then((stream) => {
    console.log(JSON.stringify(stream, null, 3));

    const visits = new Map(stream);
    console.log(
      `Reading visits from channel ${channel}, found ${visits.size} visits.`
    );
    console.log(`Looking for Sponsor ID: ${sid}`);
    let zipped;
    visits.forEach((visitData, channel) => {
      console.log(channel);
      let visits = new Map(visitData);
      visits.forEach((visit, id) => {
        console.log('visit ID:', id);
        let names = visit.filter((v, i) => i % 2 === 0);
        let values = visit.filter((v, i) => i % 2 !== 0);
        zipped = names.map(function(name, i) {
          return { [name]: values[i] };
        });
        console.log(JSON.stringify(zipped, null, 3));
      });
    });
    return zipped;
  });
};
module.exports = { addSponsor, addVisit, getVisits };
