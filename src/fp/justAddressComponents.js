const { Ok, Err } = require('pratica');

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

const getAddressComponents = (components) => {
  Ok(components)
    .chain(thisCountry)
    .chain(thisCity)
    .chain(thisState)
    .cata({
      Ok: () => console.log(city, state),
      Err: (msg) => console.log(msg), // if any checks return an Err, then this function will be called. If isPerson returns Err, then isOlderThan2 and isJason functions won't even execute, and the err msg would be 'Not a person'
    });
};
module.exports = { getAddressComponents };