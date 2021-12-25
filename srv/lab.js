const { formatTime } = require('../src/utils/luxonHelpers');
const visits = [
  [
    'customer:120c9ef737bb3ee5',
    [
      ['1640371630838-0', ['bid', 'fika']],
      ['1640371630839-0', ['bid', 'fika']],
      ['1640391630839-0', ['bid', 'Tomahawk']],
    ],
  ],
];

const m = visits.map((visit, i) => {
  return {
    id: i,
    name: visit[0],
    children: visit[1].map((t, i) => {
      return {
        id: i + 1,
        name: formatTime(Number(t[0].slice(0, 13))),
        children: [{ id: i, name: t[1][1] }],
      };
    }),
  };
});

console.log(JSON.stringify(m, null, 2));
console.log();
