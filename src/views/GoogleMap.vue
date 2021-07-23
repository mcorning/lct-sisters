<template>
  <div class="App"></div>
</template>

<script>
// import MarkerClusterer from '@google/markerclustererplus';

import gmapsInit from '../utils/gmaps';
import { printJson } from '../utils/colors';

export default {
  name: `Map`,
  props: {
    state: {
      type: Object,
      required: true,
    },
    isConnected: Boolean,
  },

  computed: {
    locations() {
      return this.state.places.map((v) => {
        return { position: { lat: v.lat, lng: v.lng } };
      });
    },

    options() {
      return {
        fields: [
          'formatted_address',
          'place_id',
          'plus_code',
          'geometry',
          'icon',
          'name',
        ],
      };
    },
  },
  data() {
    return {
      ready: false,
      google: null,
      map: null,
      geocoder: null,
      service: null,
      marker: null,
      place: null,
      defaultZoom: 15,
      defaultPoi: 'Sisters City Hall',
      labels: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      labelIndex: 0,
    };
  },
  methods: {
    validServiceRequest(place, status) {
      const x =
        status === 'OK' && place && place.geometry && place.geometry.location;
      return x;
    },
    // Adds a marker to the map.
    addMarker(location) {
      // Add the marker at the clicked location, and add the next-available label
      // from the array of alphabetical characters.
      const marker = new this.google.maps.Marker({
        position: location,
        label: this.labels[this.labelIndex++ % this.labels.length],
        place_id: this.place.place_id,
        map: this.map,
      });
      marker.addListener(`click`, () => this.onClickMarker(marker));
    },

    getDetails(placeId, location) {
      const self = this;

      this.service.getDetails(
        {
          placeId: placeId,
          fields: this.options.fields,
        },
        (place, status) => {
          if (self.validServiceRequest(place, status)) {
            self.place = place;
            self.addMarker(location);
          } else {
            window.alert('PlacesService failed due to: ' + status);
          }
        }
      );
    },

    geocodeLocation(latLng) {
      const self = this;

      this.geocoder
        .geocode({ location: latLng })
        .then((response) => {
          if (response.results[0]) {
            self.place = response.results[0];
            self.addMarker(latLng);
          } else {
            window.alert('No results found');
          }
        })
        .catch((e) => window.alert('Geocoder failed due to: ' + e));
    },

    onClickMap(event) {
      const self = this;
      console.log(event);
      const { placeId, latLng } = event;
      if (placeId) {
        self.getDetails(placeId, latLng);
      } else if (latLng) {
        self.geocodeLocation(latLng);
      }
    },
    onClickMarker(marker) {
      if (marker != this.marker) {
        this.infoWinOpen = false;
      }
      this.$emit('markerClicked', marker);
    },
  },

  watch: {
    ready() {},
  },

  async mounted() {
    const self = this;
    try {
      console.log(printJson(this.locations));
      const google = await gmapsInit();
      const map = new google.maps.Map(this.$el, {
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
          mapTypeIds: ['roadmap', 'terrain'],
        },
      });
      const geocoder = new google.maps.Geocoder();
      self.service = new google.maps.places.PlacesService(map);

      geocoder.geocode({ address: self.defaultPoi }, (results, status) => {
        if (status !== `OK` || !results[0]) {
          throw new Error(status);
        }

        map.setCenter(results[0].geometry.location);
        map.fitBounds(results[0].geometry.viewport);
        map.setZoom(self.defaultZoom);
      });

      // map.addListener(`click`, (event) => self.addMarker(event.latLng, map));
      map.addListener(`click`, (event) => self.onClickMap(event));

      const markers = self.locations.map((location) => {
        const marker = new google.maps.Marker({ ...location, map });
        marker.addListener(`click`, () => self.onClickMarker(marker));

        return marker;
      });
      console.log(`Rendered ${markers.length} markers`);
      self.google = google;
      self.geocoder = geocoder;
      self.map = map;
      self.ready = true;

      // eslint-disable-next-line no-new
      // new MarkerClusterer(map, markers, {
      //   imagePath: `https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m`,
      // });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  },
};
</script>

<style>
html,
body {
  margin: 0;
  padding: 0;
}

.App {
  width: 100vw;
  height: 80vh;
}
</style>
