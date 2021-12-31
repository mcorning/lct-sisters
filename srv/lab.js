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

const run = false;
if (run) {
  const mapChildred = () =>
    visits.map((visit, i) => ({
      id: i,
      name: visit[0],
      children: visit[1].map((t) => ({
        id: i + 1,
        name: formatTime(Number(t[0].slice(0, 13))),
        children: [{ id: i, name: t[1][1] }],
      })),
    }));
  console.log(JSON.stringify(mapChildred(), null, 2));
  console.log();
}
const realStream = [
  [
    'warnings',
    [
      [
        '1640903639894-0',
        [
          'place_id',
          'ChIJEwMfWko3v1QRCH3s6Ly-udI',
          'start',
          '1640825100000',
          'end',
          '1640826900000',
          'score',
          '10',
          'reliability',
          '0',
        ],
      ],
      [
        '1640903639899-0',
        [
          'place_id',
          'ChIJFWkctxkxv1QRLhhGQdCn4gE',
          'start',
          '1640902500000',
          'end',
          '1640904300000',
          'score',
          '10',
          'reliability',
          '0',
        ],
      ],
      [
        '1640903678490-0',
        [
          'place_id',
          'ChIJEwMfWko3v1QRCH3s6Ly-udI',
          'start',
          '1640825100000',
          'end',
          '1640826900000',
          'score',
          '10',
          'reliability',
          '0',
        ],
      ],
      [
        '1640903678494-0',
        [
          'place_id',
          'ChIJFWkctxkxv1QRLhhGQdCn4gE',
          'start',
          '1640902500000',
          'end',
          '1640904300000',
          'score',
          '10',
          'reliability',
          '0',
        ],
      ],
    ],
  ],
];

const warningStream = [
  [
    '1640903639894-0',
    [
      'place_id',
      'ChIJEwMfWko3v1QRCH3s6Ly-udI',
      'start',
      '1640825100000',
      'end',
      '1640826900000',
      'score',
      '10',
      'reliability',
      '0',
    ],
  ],
  [
    '1640903639899-0',
    [
      'place_id',
      'ChIJFWkctxkxv1QRLhhGQdCn4gE',
      'start',
      '1640902500000',
      'end',
      '1640904300000',
      'score',
      '10',
      'reliability',
      '0',
    ],
  ],
  [
    '1640903678490-0',
    [
      'place_id',
      'ChIJEwMfWko3v1QRCH3s6Ly-udI',
      'start',
      '1640825100000',
      'end',
      '1640826900000',
      'score',
      '10',
      'reliability',
      '0',
    ],
  ],
  [
    '1640903678494-0',
    [
      'place_id',
      'ChIJFWkctxkxv1QRLhhGQdCn4gE',
      'start',
      '1640902500000',
      'end',
      '1640904300000',
      'score',
      '10',
      'reliability',
      '0',
    ],
  ],
];

const warningOutput = [
  {
    'ChIJEwMfWko3v1QRCH3s6Ly-udI': [
      { key: '1640903639894-0', start: 1640825100000, end: 1640826900000 },
      { key: '1640903678490-0', start: 1640825100000, end: 1640826900000 },
    ],
  },
  {
    ChIJFWkctxkxv1QRLhhGQdCn4gE: [
      { key: '1640903639894-0', start: 1640902500000, end: 1640904300000 },
      { key: '1640903678494-0', start: 1640902500000, end: 1640904300000 },
    ],
  },
];

const mapWarnings = () => {
  const x = realStream[0][1].map((warning) => objectFromStream(warning));
  console.log(JSON.stringify(x, null, 2));

  const y = groupBy(x, 'place_id');
  console.log(JSON.stringify(y, null, 2));
};

const groupBy = (arr, fn) =>
  arr
    .map(typeof fn === 'function' ? fn : (val) => val[fn])
    .reduce((acc, val, i) => {
      acc[val] = (acc[val] || []).concat(arr[i]);
      return acc;
    }, {});

const objectFromStream = (arr) => {
  return arr[1].reduce((a, c, i, pairs) => {
    if (i % 2 === 0) {
      (a[c] = pairs[i + 1]), a;
    }
    return a;
  }, {});
};

mapWarnings();
