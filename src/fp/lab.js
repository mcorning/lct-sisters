const { get, nullable, Ok, Err } = require('pratica');
const geoPoliticalByCountry = {
  NG: { city: 'administrative_area_level_1', state: 'country' },
  JP: { city: 'administrative_area_level_1', state: 'country' },
  SE: { city: 'postal_town', state: 'country' },
  GB: { city: 'postal_town', state: 'administrative_area_level_1' },
  US: { city: 'locality', state: 'administrative_area_level_1' },
  DE: { city: 'locality', state: 'country' },
  CM: { city: 'locality', state: 'country' },
  SG: { city: 'locality', state: 'country' },
  VA: { city: 'locality', state: 'country' },
};
const vatican = [
  {
    long_name: 'WF32+GR',
    short_name: 'WF32+GR',
    types: ['plus_code'],
  },
  {
    long_name: 'Vatican City',
    short_name: 'Vatican City',
    types: ['locality', 'political'],
  },
  {
    long_name: 'Vatican City',
    short_name: 'VA',
    types: ['country', 'political'],
  },
  {
    long_name: '00120',
    short_name: '00120',
    types: ['postal_code'],
  },
];

const singapore = [
  {
    long_name: '38',
    short_name: '38',
    types: ['street_number'],
  },
  {
    long_name: 'Irrawaddy Road',
    short_name: 'Irrawaddy Rd',
    types: ['route'],
  },
  {
    long_name: 'Novena',
    short_name: 'Novena',
    types: ['neighborhood', 'political'],
  },
  {
    long_name: 'Singapore',
    short_name: 'Singapore',
    types: ['locality', 'political'],
  },
  {
    long_name: 'Singapore',
    short_name: 'SG',
    types: ['country', 'political'],
  },
  {
    long_name: '329563',
    short_name: '329563',
    types: ['postal_code'],
  },
];

const cameroon = [
  {
    long_name: 'RGJ6+W73',
    short_name: 'RGJ6+W73',
    types: ['plus_code'],
  },
  {
    long_name: 'Yaoundé',
    short_name: 'Yaoundé',
    types: ['locality', 'political'],
  },
  {
    long_name: 'Lekie',
    short_name: 'Lekie',
    types: ['administrative_area_level_2', 'political'],
  },
  {
    long_name: 'Centre',
    short_name: 'Centre',
    types: ['administrative_area_level_1', 'political'],
  },
  {
    long_name: 'Cameroon',
    short_name: 'CM',
    types: ['country', 'political'],
  },
];
const us = [
  {
    long_name: '69706',
    short_name: '69706',
    types: ['street_number'],
  },
  {
    long_name: 'West Meadow Parkway',
    short_name: 'W Meadow Pkwy',
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
  {
    long_name: '9660',
    short_name: '9660',
    types: ['postal_code_suffix'],
  },
];
const sweden = [
  {
    long_name: '59',
    short_name: '59',
    types: ['street_number'],
  },
  {
    long_name: 'Runda vägen',
    short_name: 'Runda vägen',
    types: ['route'],
  },
  {
    long_name: 'Bromma',
    short_name: 'Bromma',
    types: ['political', 'sublocality', 'sublocality_level_1'],
  },
  {
    long_name: 'Bromma',
    short_name: 'Bromma',
    types: ['postal_town'],
  },
  {
    long_name: 'Stockholms län',
    short_name: 'Stockholms län',
    types: ['administrative_area_level_1', 'political'],
  },
  {
    long_name: 'Sweden',
    short_name: 'SE',
    types: ['country', 'political'],
  },
  {
    long_name: '167 51',
    short_name: '167 51',
    types: ['postal_code'],
  },
];
const germany = [
  {
    long_name: '35',
    short_name: '35',
    types: ['street_number'],
  },
  {
    long_name: 'Adalbertstraße',
    short_name: 'Adalbertstraße',
    types: ['route'],
  },
  {
    long_name: 'Mitte',
    short_name: 'Mitte',
    types: ['political', 'sublocality', 'sublocality_level_1'],
  },
  {
    long_name: 'Berlin',
    short_name: 'Berlin',
    types: ['locality', 'political'],
  },
  {
    long_name: 'Kreisfreie Stadt Berlin',
    short_name: 'Kreisfreie Stadt Berlin',
    types: ['administrative_area_level_3', 'political'],
  },
  {
    long_name: 'Berlin',
    short_name: 'BE',
    types: ['administrative_area_level_1', 'political'],
  },
  {
    long_name: 'Germany',
    short_name: 'DE',
    types: ['country', 'political'],
  },
  {
    long_name: '10179',
    short_name: '10179',
    types: ['postal_code'],
  },
];
const uk = [
  {
    long_name: '8',
    short_name: '8',
    types: ['street_number'],
  },
  {
    long_name: 'Billing Avenue',
    short_name: 'Billing Ave',
    types: ['route'],
  },
  {
    long_name: 'Manchester',
    short_name: 'Manchester',
    types: ['postal_town'],
  },
  {
    long_name: 'Greater Manchester',
    short_name: 'Greater Manchester',
    types: ['administrative_area_level_2', 'political'],
  },
  {
    long_name: 'England',
    short_name: 'England',
    types: ['administrative_area_level_1', 'political'],
  },
  {
    long_name: 'United Kingdom',
    short_name: 'GB',
    types: ['country', 'political'],
  },
  {
    long_name: 'M12 6EZ',
    short_name: 'M12 6EZ',
    types: ['postal_code'],
  },
];
const japan = [
  {
    long_name: '33',
    short_name: '33',
    types: ['premise'],
  },
  {
    long_name: '12',
    short_name: '12',
    types: ['political', 'sublocality', 'sublocality_level_4'],
  },
  {
    long_name: '1-chōme',
    short_name: '1-chōme',
    types: ['political', 'sublocality', 'sublocality_level_3'],
  },
  {
    long_name: 'Akasaka',
    short_name: 'Akasaka',
    types: ['political', 'sublocality', 'sublocality_level_2'],
  },
  {
    long_name: 'Minato City',
    short_name: 'Minato City',
    types: ['locality', 'political'],
  },
  {
    long_name: 'Tokyo',
    short_name: 'Tokyo',
    types: ['administrative_area_level_1', 'political'],
  },
  {
    long_name: 'Japan',
    short_name: 'JP',
    types: ['country', 'political'],
  },
  {
    long_name: '107-0052',
    short_name: '107-0052',
    types: ['postal_code'],
  },
];

const nigeria = [
  {
    long_name: '23',
    short_name: '23',
    types: ['street_number'],
  },
  {
    long_name: 'Olakunle Selesi Crescent',
    short_name: 'Olakunle Selesi Cres',
    types: ['route'],
  },
  {
    long_name: 'Ajao Estate',
    short_name: 'Ajao Estate',
    types: ['neighborhood', 'political'],
  },
  {
    long_name: 'Street',
    short_name: 'Street',
    types: ['locality', 'political'],
  },
  {
    long_name: 'Oshodi/Isolo',
    short_name: 'Oshodi/Isolo',
    types: ['administrative_area_level_2', 'political'],
  },
  {
    long_name: 'Lagos',
    short_name: 'LA',
    types: ['administrative_area_level_1', 'political'],
  },
  {
    long_name: 'Nigeria',
    short_name: 'NG',
    types: ['country', 'political'],
  },
  {
    long_name: '102214',
    short_name: '102214',
    types: ['postal_code'],
  },
];

// getComponent('administrative_area_level_1');

let country;
let cityComponent;
let stateComponent;
let city;
let state;

const findCity = (c) => {
  city = c.find((v) => v.types.includes(cityComponent)).long_name;
  console.log(city);
  return c;
};
const findState = (c) => {
  state = c.find((v) => v.types.includes(stateComponent)).short_name;
  console.log(state);
  return c;
};
const findCountry = (c) => {
  country = c.find((v) => v.types.includes('country')).short_name;
  cityComponent = geoPoliticalByCountry[country].city;
  stateComponent = geoPoliticalByCountry[country].state;
  return c;
};

const thisCountry = (c) => (findCountry(c) ? Ok(c) : Err('Not a country'));
const thisCity = (c) => (findCity(c) ? Ok(c) : Err('Not a city'));
const thisState = (c) => (findState(c) ? Ok(c) : Err('Not a state'));

const components = uk;
Ok(components)
  .chain(thisCountry)
  .chain(thisCity)
  .chain(thisState)
  .cata({
    Ok: () => console.log(city, state),
    Err: (msg) => console.log(msg), // if any checks return an Err, then this function will be called. If isPerson returns Err, then isOlderThan2 and isJason functions won't even execute, and the err msg would be 'Not a person'
  });

/**
 * var get = function (selector) { 
 *      return function (data) {
            return selector.reduce(
                function (acc, s) { 
                    return acc.chain(function (d) { 
                        return nullable(d[s]); }); 
                    }, 
                nullable(data)
            );
}; };
 */
