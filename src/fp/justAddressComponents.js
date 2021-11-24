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

let cityComponent;
let stateComponent;
let city;
let state;

const findCountry = (c) => {
  const cuntree = c.find((v) => v.types.includes('country'));
  const country = cuntree?.short_name;
  cityComponent = geoPoliticalByCountry[country].city;
  stateComponent = geoPoliticalByCountry[country].state;
  return c;
};

const findCity = (c) => {
  city = c.find((v) => v.types.includes(cityComponent)).long_name;
  return c;
};

const findState = (c) => {
  state = c.find((v) => v.types.includes(stateComponent)).short_name;
  return { city, state };
};

const thisCountry = (c) => (findCountry(c) ? Ok(c) : Err('Not a country'));
const thisCity = (c) => (findCity(c) ? Ok(c) : Err('Not a city'));
const thisState = (c) =>
  findState(c)
    ? Ok(() => {
        city, state;
      })
    : Err('Not a state');

const getAddressComponents = (components) => {
  console.log('components:', components);
  Ok(components)
    .chain(thisCountry)
    .chain(thisCity)
    .chain(thisState)
    .cata({
      Ok: (d) => d,
      Err: (msg) => console.log(msg), // if any checks return an Err, then this function will be called. If isPerson returns Err, then isOlderThan2 and isJason functions won't even execute, and the err msg would be 'Not a person'
    });
};
module.exports = { getAddressComponents };
