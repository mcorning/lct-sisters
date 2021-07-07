// const options = require('./options');
// console.log(options);
// const Redis = require('ioredis');
// const redis = new Redis(options);
// you may find this read https://redis.io/topics/streams-intro
// very helpfull as a starter to understand the usescases and the parameters used
const { redis } = require('./connect');
redis.set('test', 'best');

const f = async function() {
  const channel = 'appointments:outlaws';
  // specify the channel. you want to know how many appointments
  // have been written in this channel
  let appointmentCount = await redis.xlen(channel);
  console.log(
    `current appointment count in channel ${channel} is ${appointmentCount} appointments`
  );

  // specify channel to write a appointment into,
  // appointments are key value
  const appointment = Date.now();
  await redis.xadd(channel, '*', appointment, 'appointment');

  appointmentCount = await redis.xlen(channel);
  console.log(
    `current appointment count in channel ${channel} is ${appointmentCount} appointment`
  );
  // now you can see we have one new appointment

  // use xread to read all appointments in channel
  let appointments = await redis.xread(['STREAMS', channel, 0]);
  appointments = appointments[0][1];
  console.log(
    `reading appointments from channel ${channel}, found ${appointments.length} appointments`
  );
  for (let i = 0; i < appointments.length; i++) {
    let appt = appointments[i];
    appt = appt[1][0].toString();
    console.log('reading appointment:', appt);
  }
  // process.exit(0);
};
f();
