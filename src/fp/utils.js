import { Some, None, Maybe } from './monads/Maybe.js';
import { info, printJson } from '../utils/helpers';

export const firstOrNone = function(array) {
  return array?.length > 0 ? Some(array[0]) : None();
};
export const allOrNone = function(array) {
  return array?.length > 0 ? Some(array) : None();
};

export const inspect = (v) => {
  console.log(info('Inspecting:', printJson(v)));
  return v;
};

// curry :: ((a, b, ...) -> c) -> a -> b -> ... -> c
export const curry = (fn) => {
  const arity = fn.length;

  return function $curry(...args) {
    if (args.length < arity) {
      return $curry.bind(null, ...args);
    }

    return fn.call(null, ...args);
  };
};

export const compose = (...fns) => (...args) =>
  fns.reduceRight((res, fn) => [fn.call(null, ...res)], args)[0];

export const prop = curry((property, object) => object[property]);

export const match = curry((what, s) => s.match(what));
export const replace = curry((what, replacement, s) =>
  s.replace(what, replacement)
);

export const testLatLng = {
  address_components: [
    {
      long_name: '15425',
      short_name: '15425',
      types: ['street_number'],
    },
    {
      long_name: 'Old McKenzie Highway',
      short_name: 'McKenzie Hwy',
      types: ['route'],
    },
    {
      long_name: 'Sisters',
      short_name: 'Sisters',
      types: ['locality', 'political'],
    },
    {
      long_name: 'Deschutes County',
      short_name: 'Deschutes County',
      types: ['administrative_area_level_2', 'political'],
    },
    {
      long_name: 'Oregon',
      short_name: 'OR',
      types: ['administrative_area_level_1', 'political'],
    },
    {
      long_name: 'United States',
      short_name: 'US',
      types: ['country', 'political'],
    },
    {
      long_name: '97759',
      short_name: '97759',
      types: ['postal_code'],
    },
  ],
  formatted_address: '15425 McKenzie Hwy, Sisters, OR 97759, USA',
  geometry: {
    location: {
      lat: 44.2910418,
      lng: -121.5676451,
    },
    location_type: 'ROOFTOP',
    viewport: {
      south: 44.2896928197085,
      west: -121.5689940802915,
      north: 44.29239078029149,
      east: -121.5662961197085,
    },
  },
  place_id: 'ChIJLaKCokU3v1QR-IZB1-GPRSc',
  plus_code: {
    compound_code: '7CRJ+CW Sisters, OR, USA',
    global_code: '84PW7CRJ+CW',
  },
  types: ['street_address'],
};

export const testPlace = {
  formatted_address: '273 W Hood Ave, Sisters, OR 97759, USA',
  geometry: {
    location: {
      lat: 44.29021499999999,
      lng: -121.552091,
    },
    viewport: {
      south: 44.28899256970849,
      west: -121.5534462802915,
      north: 44.29169053029149,
      east: -121.5507483197085,
    },
  },
  icon:
    'https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/cafe-71.png',
  name: 'Sisters Coffee Company',
  opening_hours: {
    open_now: true,

    weekday_text: [
      'Monday: 6:00 AM – 6:00 PM',
      'Tuesday: 6:00 AM – 6:00 PM',
      'Wednesday: 6:00 AM – 6:00 PM',
      'Thursday: 6:00 AM – 6:00 PM',
      'Friday: 6:00 AM – 6:00 PM',
      'Saturday: 6:00 AM – 6:00 PM',
      'Sunday: 6:00 AM – 6:00 PM',
    ],
  },
  place_id: 'ChIJEwMfWko3v1QRCH3s6Ly-udI',
  plus_code: {
    compound_code: '7CRX+35 Sisters, OR, USA',
    global_code: '84PW7CRX+35',
  },
  url: 'https://maps.google.com/?cid=15184377337227279624',
  utc_offset: -420,
  html_attributions: [],
  utc_offset_minutes: -420,
};

const filter = curry((f, xs) => xs.filter(f));

const map = curry((f, xs) => xs.map(f));
// const y = this.compose(this.test2, this.test1);
// console.log(y(1));
// console.log(this.match(/r/g, 'hello world'));
// const hasLetterR = this.match(/r/g); // x => x.match(/r/g)
// hasLetterR('hello world'); // [ 'r' ]
// hasLetterR('just j and s and t etc'); // null

// this.filter(hasLetterR, ['rock and roll', 'smooth jazz']); // ['rock and roll']

// const removeStringsWithoutRs = this.filter(hasLetterR); // xs => xs.filter(x => x.match(/r/g))
// removeStringsWithoutRs(['rock and roll', 'smooth jazz', 'drum circle']); // ['rock and roll', 'drum circle']

// const noVowels = this.replace(/[aeiou]/gi); // (r,x) => x.replace(/[aeiou]/ig, r)
// const censored = noVowels('*'); // x => x.replace(/[aeiou]/ig, '*')
// console.log(censored('Chocolate Rain')); // 'Ch*c*l*t* R**n'
