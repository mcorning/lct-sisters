const visits = [
  {
    uid: '1f5f57de524960ac',
    visitedOn: '1/11/2022, 11:56 AM',
    dated: 'Jan 11, 2022',
  },
  {
    uid: '1f5f57de524960ac',
    visitedOn: '1/11/2022, 11:59 AM',
    dated: 'Jan 11, 2022',
  },
  {
    uid: '1f5f57de524960ac',
    visitedOn: '1/11/2022, 12:01 PM',
    dated: 'Jan 11, 2022',
  },
  {
    uid: '1f5f57de524960av',
    visitedOn: '1/11/2022, 12:02 PM',
    dated: 'Jan 11, 2022',
  },
  {
    uid: '1f5f57de524960ac',
    visitedOn: '1/11/2022, 12:04 PM',
    dated: 'Jan 11, 2022',
  },
  {
    uid: '1f5f57de524960ac',
    visitedOn: '1/11/2022, 12:09 PM',
    dated: 'Jan 11, 2022',
  },
  {
    uid: '1f5f57de524960ad',
    visitedOn: '1/11/2022, 12:19 PM',
    dated: 'Jan 11, 2022',
  },
];

const a = JSON.stringify(
  visits.filter((v) => v.uid === '1f5f57de524960ac'),
  null,
  2
);

const p = [
  [
    'promotions:Fika%20Coffeehouse',
    [
      [
        '1641841201662-0',
        [
          'business',
          'Fika Coffeehouse',
          'promoText',
          'Welcome back, Renee!',
          'expires',
          '7',
          'sid',
          '1641841201662-1',
        ],
        '1641841201777-0',
        [
          'business',
          'Sisters Coffee Company',
          'promoText',
          'Spring Break Deals',
          'expires',
          '7',
          'sid',
          '1641841201777-1',
        ],
      ],
    ],
  ],
];

const pp = JSON.stringify(p);
console.log(pp);
const o = {};
let k = null;
// TODO this reviver works fine on one proto array
// but returns only the last one when json contains multiple ones
const reviver = (key, value) => {
  // when parsing an array, key is the index value
  if (Array.isArray(value)) {
    return o;
  }
  if (key % 2 === 0) {
    k = value;
  } else {
    o[k] = value;
  }
  return o;
};
const x = JSON.parse(pp, reviver);
console.log(x);
