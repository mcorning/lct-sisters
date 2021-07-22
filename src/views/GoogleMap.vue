<template>
  <div class="App" />
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
  },
  data() {
    return {
      ready: false,
      google: null,
      geocoder: null,
      service: null,
      defaultZoom: 16,
      defaultPoi: 'Sisters, OR',
      labels: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      labelIndex: 0,
    };
  },
  methods: {
    // Adds a marker to the map.
    addMarker(location, map) {
      // Add the marker at the clicked location, and add the next-available label
      // from the array of alphabetical characters.
      const marker = new this.google.maps.Marker({
        position: location,
        label: this.labels[this.labelIndex++ % this.labels.length],
        map: map,
      });
      marker.addListener(`click`, () => this.onClickMarker(marker));
    },
    onClickMarker(marker) {
      this.map.setZoom(15);
      this.map.setCenter(marker.getPosition());
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
      const geocoder = new google.maps.Geocoder();
      const map = new google.maps.Map(this.$el);
      self.service = new google.maps.places.PlacesService(map);

      geocoder.geocode({ address: self.defaultPoi }, (results, status) => {
        if (status !== `OK` || !results[0]) {
          throw new Error(status);
        }

        map.setCenter(results[0].geometry.location);
        map.fitBounds(results[0].geometry.viewport);
      });

      map.addListener(`click`, (event) => self.addMarker(event.latLng, map));

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
