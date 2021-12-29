const { Client } = require('@googlemaps/google-maps-services-js');

const client = new Client({});

function getMapApi() {
  const mapOptions = require('./googlemaps.options');
  return mapOptions.api_key;
}
const API_KEY =
  process.env.NODE_ENV === 'production'
    ? process.env.VUE_APP_MAP_API_KEY
    : getMapApi();

const params = { key: API_KEY, place_id: '' };

const confirmPlaceID = (place_id) => {
  params.place_id = place_id;
  console.log('params', params);
  return client
    .reverseGeocode({ params })
    .then((r) => r.data.results[0])
    .catch((e) => e);
};

const getPlaceID = ({ address, country }) => {
  const placeParams = {
    address,
    components: { country },
    key: API_KEY,
  };

  return client.geocode({ params: placeParams }).then((r) => {
    const {
      geometry: { location: latlng },
      place_id,
    } = r.data.results[0];

    console.log('Place_id', place_id);
    console.log('latlng:', latlng);
    return place_id;
  });
  // let the caller handle the exception
};

module.exports = {
  confirmPlaceID,
  getPlaceID,
};
