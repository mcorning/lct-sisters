<template>
  <div class="App"></div>
</template>

<script>
import gmapsInit from '../utils/gmaps';

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
    // To create markers during mounting and delete markers in the UI,
    // fetch some data out of places entity
    locations() {
      return (
        this.state.places?.map((v) => {
          return {
            position: { lat: v.lat, lng: v.lng },
            place_id: v.place_id,
            name: v.name,
          };
        }) || []
      );
    },
    visits() {
      return this.state.visits.filter((v) => v.name);
    },

    // to limit query cost at Google, only fetch Place data essential for our mission
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
      map: null,
      geocoder: null,
      service: null,
      place: null,
      defaultZoom: 15,
      defaultPoi: 'Sisters City Hall',
      labels: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      labelIndex: 0,
    };
  },
  methods: {
    // TODO see if we can push all or most of these methods to Model

    validServiceRequest(place, status) {
      const x =
        status === 'OK' && place && place.geometry && place.geometry.location;
      return x;
    },
    // Adds a marker to the map.
    addMarker(location) {
      // Add the marker at the clicked location, and add the next-available label
      // from the array of alphabetical characters.
      const marker = new window.google.maps.Marker({
        position: location,
        label: this.labels[this.labelIndex++ % this.labels.length],
        place_id: this.place.place_id,
        name: this.place.name,
        map: this.map,
      });
      marker.addListener(`click`, () => this.onClickMarker(marker));
      marker.addListener(`rightclick`, () => this.delMarker(marker));
      this.$emit('markerAdded', this.place);
    },

    delMarker(marker) {
      if (confirm('Remove map marker for ' + marker.latLng + '?')) {
        marker.setMap(null);
        if (
          confirm(
            'Delete from database place ' + marker.place_id + ', as well?'
          )
        ) {
          this.$emit('deletePlace', marker.place_id);
        }
      }
    },

    getPlaceDetails(placeId, location) {
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
        self.getPlaceDetails(placeId, latLng);
      } else if (latLng) {
        self.geocodeLocation(latLng);
      }
    },

    onClickMarker(marker) {
      this.$emit('markerClicked', marker);
    },

    getMarkers({ google, map }) {
      const markers = this.locations.map((location) => {
        const marker = new google.maps.Marker({ ...location, map });
        marker.addListener(`click`, () => this.onClickMarker(marker));
        marker.addListener(`rightclick`, (event) => {
          if (confirm('Remove map marker for ' + event.latLng + '?')) {
            const marker = markers.filter(
              (v) =>
                v.position.lat() === event.latLng.lat() &&
                v.position.lng() === event.latLng.lng()
            )[0];

            if (
              confirm(
                'Delete from database place ' + marker.place_id + ', as well?'
              )
            ) {
              this.$emit('deletePlace', marker.place_id);
            }
            marker.setMap(null);
          }
        });
        return marker;
      });
      console.log(`Rendered ${markers.length} markers`);
      return markers;
    },

    xFiles(google, places, markers, map) {
      {
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
          this.$emit('markerAdded', place);
        });
        map.fitBounds(bounds);
      }
    },
    setupGeocoder({ google, map }) {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: this.defaultPoi }, (results, status) => {
        if (status !== `OK` || !results[0]) {
          throw new Error('GoogleMap.vue error:', status);
        }

        map.setCenter(results[0].geometry.location);
        map.fitBounds(results[0].geometry.viewport);
        map.setZoom(this.defaultZoom);
      });
      this.geocoder = geocoder;
      return { google, map };
    },
  },

  watch: {
    ready() {},
  },

  mounted() {
    // TODO experimant with renderless subcomponents specialized for googlemaps
    const self = this;
    console.time('Mounted GoogleMaps');
    gmapsInit()
      .then((google) => {
        const map = new google.maps.Map(this.$el, {
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
            mapTypeIds: ['roadmap', 'terrain'],
          },
        });
        return { google, map };
      })
      .then(({ google, map }) => {
        const markers = this.getMarkers({ google, map });
        return { google, map, markers };
      })
      .then(({ google, map, markers }) => {
        map.addListener(`click`, (event) => self.onClickMap(event));
        const input = document.getElementById('autoCompleteInput');
        const searchBox = new google.maps.places.SearchBox(input);
        map.addListener('bounds_changed', () => {
          searchBox.setBounds(map.getBounds());
        });
        const places = searchBox.getPlaces();
        searchBox.addListener('places_changed', () =>
          this.xFiles(google, places, markers, map)
        );
        return { google, map };
      })
      .then(({ google, map }) => {
        this.setupGeocoder({ google, map });
        return map;
      })
      .then((map) => (self.map = map))
      .catch((error) => console.log(error))
      .finally(() => (self.ready = true));
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
  height: 60vh;
}
</style>
