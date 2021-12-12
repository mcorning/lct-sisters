const { confirmPlaceID, getPlaceID } = require('./googlemaps');

function test() {
  const address = 'Fika Sisters ';
  const country = 'US';
  const verify = ({ address, result }) => {
    console.log(address);
    console.log(result.place_id);
    console.log(result.formatted_address);
  };

  getPlaceID({ address, country })
    .then((place_id) => confirmPlaceID(place_id))
    .then((result) => verify({ address, result }));
}

test();
