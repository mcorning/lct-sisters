let components;
if (process.env.NODE_ENV !== 'production') {
  const testData = require('./testData');
  components = testData.uk;
}
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

const getName = (c, id) => (c.types.includes(id) ? Ok(c.short_name) : Err());

const componentIDs = (countryAbbr) => {
  const cityComponent = geoPoliticalByCountry[countryAbbr].city;
  const stateComponent = geoPoliticalByCountry[countryAbbr].state;
  return { cityComponent, stateComponent };
};

function getNamespace(components) {
  // this approach returns a single string value from the reduce function
  const country = components.reduce((a, c) => {
    getName(c, 'country').cata({
      Ok: (h) => (a = h),
      Err: () => null,
    });
    return a;
  }, '');

  const { cityComponent, stateComponent } = componentIDs(country);
  console.log(stateComponent);

  // this approach  uses the city variable to catch the Ok value using the map function
  console.time('get city');
  let city;
  components.map((c) =>
    getName(c, cityComponent).cata({
      Ok: (h) => (city = h),
      Err: () => Err(), // returning Err() object so we don't see 'a.isOk() is not a function' error
    })
  );
  console.timeEnd('get city');

  console.time('get state');
  // this approach  uses the reduce function again (and appears to be roughly twice as fast)
  const state = components.reduce((a, c) => {
    getName(c, stateComponent).cata({
      Ok: (h) => (a = h),
      Err: () => null,
    });
    return a;
  });
  console.timeEnd('get state');

  return  `${city} ${state}` ;
}

if (process.env.NODE_ENV !== 'production') {
  console.log(getNamespace(components));
}
module.exports = { getNamespace };
