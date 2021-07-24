<template>
  <div class="App"></div>
</template>

<script>
// import MarkerClusterer from '@google/markerclustererplus';

import gmapsInit from '../utils/gmaps';
import { printJson } from '../utils/helpers';

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
        return {
          position: { lat: v.lat, lng: v.lng },
          place_id: v.place_id,
          name: v.name,
        };
      });
    },
    visits() {
      return this.state.visits.filter((v) => v.name);
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
    // TODO see if we can push all or most of these methods to State

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
        name: this.place.name,
        map: this.map,
      });
      marker.addListener(`click`, () => this.onClickMarker(marker));
      this.$emit('markerAdded', this.place);
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

      //#region Autocomplete Setup
      const input = document.getElementById('autoCompleteInput');
      const searchBox = new google.maps.places.SearchBox(input);

      // map.controls[google.maps.ControlPosition.TOP_CENTER].push(input);
      // Bias the SearchBox results towards current map's viewport.
      map.addListener('bounds_changed', () => {
        searchBox.setBounds(map.getBounds());
      });

      let markers = [];

      // Listen for the event fired when the user selects a prediction and retrieve
      // more details for that place.
      searchBox.addListener('places_changed', () => {
        const places = searchBox.getPlaces();

        if (places.length == 0) {
          return;
        }

        // For each place, get the icon, name and location.
        const bounds = new google.maps.LatLngBounds();
        places.forEach((place) => {
          if (!place.geometry || !place.geometry.location) {
            console.log('Returned place contains no geometry');
            return;
          }
          const icon = {
            url: place.icon,
            size: new google.maps.Size(71, 71),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(17, 34),
            scaledSize: new google.maps.Size(25, 25),
          };
          // Create a marker for each place.
          markers.push(
            new google.maps.Marker({
              map,
              icon,
              title: place.name,
              position: place.geometry.location,
            })
          );

          if (place.geometry.viewport) {
            // Only geocodes have viewport.
            bounds.union(place.geometry.viewport);
          } else {
            bounds.extend(place.geometry.location);
          }
        });
        map.fitBounds(bounds);
      });
      //#endregion Autocomplete Setup

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

      map.addListener(`click`, (event) => self.onClickMap(event));

      markers = self.locations.map((location) => {
        const marker = new google.maps.Marker({ ...location, map });
        marker.addListener(`click`, () => self.onClickMarker(marker));
        marker.addListener(`rightclick`, (event) => {
          if (confirm('Delete marker at ' + event.latLng + '?')) {
            const x = markers.filter(
              (v) =>
                v.position.lat() === event.latLng.lat() &&
                v.position.lng() === event.latLng.lng()
            )[0];
            if (confirm('Delete place ' + x.place_id + ', as well?')) {
              this.$emit('deletePlace', x.place_id);
            }
            x.setMap(null);
          }
        });
        return marker;
      });
      console.log(`Rendered ${markers.length} markers`);
      self.google = google;
      self.geocoder = geocoder;
      self.map = map;
      self.ready = true;
    } catch (error) {
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
  height: 77vh;
}
</style>
