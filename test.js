const cache = require('./redisJsonCache');
const { bold, printJson, columns } = require('./src/utils/colors.js');

const m = {
  _b2a6431079661988: {
    userID: 'ede68a810d36a1dc',
    username: 'debg',
    lastInteraction: '7/1/2021, 2:28:06 PM',
    connected: true,
  },
  _5d0172399c9be4c6: {
    userID: '2f92f53a59104db1',
    username: 'Edgy',
    lastInteraction: '7/1/2021, 1:39:04 PM',
    connected: true,
  },
  _f595d789fbb3b243: {
    userID: 'a5b39d88d24d7b31',
    username: 'what',
    lastInteraction: '7/1/2021, 3:14:46 PM',
    connected: true,
  },
  _3111ad130051fa02: {
    userID: '95478b57c8d5efe1',
    username: 'nickOfTime',
    lastInteraction: '7/1/2021, 2:44:05 PM',
    connected: true,
  },
  _6b318922a420fced: {
    userID: '47a5a520a3542a6b',
    username: 'whoseOnFirst',
    lastInteraction: '7/1/2021, 4:40:48 PM',
    connected: false,
  },
};
let x = {
  userID: '95478b57c8d5efe1',
  username: 'nickOfTime',
  lastInteraction: '7/2/2021, 10:59:15 AM',
  connected: false,
};
const a = {
  _6b318922a420fced: {
    userID: '47a5a520a3542a6b',
    username: 'whoseOnFirst',
    lastInteraction: '7/1/2021, 4:40:48 PM',
    connected: false,
  },
};
// cache.asTable(o);
const o = a;

cache.asTable(o);
// const heads = (k) => bold(k);
// let grid = Object.entries(o).map((v) => Object.values(v[1]));
// console.log('grid:', printJson(grid));
// const s = Object.keys(o);
// console.log('s', printJson(s));
// let hs = Object.values(o)[0];
// let hsk = Object.keys(hs);
// grid = [hsk.map(heads), ...grid];
// console.log(columns(grid));
