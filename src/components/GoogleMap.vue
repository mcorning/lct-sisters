<template>
  <div>
    <info-window-card
      ref="infowin"
      id="infowin"
      :marker="marker"
    ></info-window-card>
    <div class="App" ref="map"></div>
  </div>
</template>

<script>
import gmapsInit from '../utils/gmaps';
import InfoWindowCard from './cards/infoWindowCard.vue';

export default {
  name: `Map`,
  props: {
    state: {
      type: Object,
      required: true,
    },
    isConnected: Boolean,
  },
  components: {
    InfoWindowCard,
  },

  computed: {
    // To create markers during mounting and delete markers in the UI,
    // fetch some data out of places entity
    locations() {
      return (
        // TODO this is a Maybe
        // does state.places change when we add a place to Place?
        this.state.places?.map((v) => {
          return {
            position: { lat: v.lat, lng: v.lng },
            place_id: v.place_id,
            name: v.name,
            plus_code: v.plus_code,
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
          'opening_hours',
          'utc_offset_minutes',
          'url',
        ],
      };
    },
  },
  data() {
    return {
      snackbar: true,
      timeout: 10000,
      selectedMarker: null,
      ready: false,
      map: null,
      geocoder: null,
      service: null,
      infowindow: null,
      seeInfowindow: true,
      place: null,
      marker: null,
      defaultZoom: 15,
      defaultPoi: 'Sisters City Hall',
      labels: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      labelIndex: 0,
    };
  },
  methods: {
    //#region Event Handlers
    onClickMap(event) {
      const { placeId, latLng } = event;
      if (placeId) {
        this.getPlaceServiceDetails(placeId);
      } else if (latLng) {
        this.geocodeLocation(latLng);
      }
    },

    onClickMarker(marker) {
      this.$emit('markerClicked', marker);
    },
    //#endregion Event Handlers

    //#region Marker code
    getPosition(place) {
      if (place.position) {
        return place;
      }
      place.position = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };
      return place;
    },

    // TODO can use use something like this, instead:
    /**
 * Vue.component('infoWindow', VueGoogleMap.InfoWindow);
 * <infoWindow :position="{
            lat: 57.708,
            lng: 11.974
        }" :opened="true" :content="Hello World">
    </infoWindow>
 */
    showInfoWindow({ marker }) {
      this.marker = marker;
      this.infowindow.open(this.map, marker);

      this.seeInfowindow = true;
    },

    // Adds a marker to the map.
    addMarkerPlus({ google, map, place }) {
      place = this.getPosition(place);
      const marker = new window.google.maps.Marker({
        map: map,
        position: place.position,
        label: this.labels[this.labelIndex++ % this.labels.length],
        place_id: place.place_id,
        url: place.url,
        name: place.name,
      });
      marker.addListener('click', (event) => {
        event.stop();
        this.showInfoWindow({ marker });
      });

      marker.addListener(`rightclick`, () => this.$emit('delMarker', marker));
      this.showInfoWindow({ place, marker });
      this.$emit('markerAdded', place);
    },

    getMarkers({ google, map }) {
      const markers = this.locations.map((place) => {
        this.addMarkerPlus({ google, map, place });
      });
      console.log(`Rendered ${markers.length} markers`);
      return { google, map, markers };
    },
    //#endregion Marker code

    //#region Map Assets
    geocodeLocation(latLng) {
      const self = this;
      // this is a Maybe
      this.geocoder
        .geocode({ location: latLng })
        // TODO This is a firstOrNone
        .then((response) => {
          if (response.results[0]) {
            const place = response.results[0];
            const google = window.google;
            const map = this.map;
            self.addMarkerPlus({ google, map, place });
          } else {
            window.alert('No results found');
          }
        })
        .catch((e) => window.alert('Geocoder failed due to: ' + e));
    },

    // TODO refactor this as default infowindow when we click POI (or map?)
    getPlaceServiceDetails(placeId) {
      this.service.getDetails(
        {
          placeId: placeId,
          fields: this.options.fields,
        },
        (place, status) => {
          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            place &&
            place.geometry &&
            place.geometry.location
          ) {
            const google = window.google;
            const map = this.map;
            // convert location to work with Place entity
            this.addMarkerPlus({ google, map, place });
          }
        }
      );
    },

    getAutocompleteResults({ google, map, places }) {
      {
        // TODO this is a Maybe
        if (places.length == 0) {
          return;
        }

        // For each place, get the icon, name and location.
        const bounds = new google.maps.LatLngBounds();
        places.forEach((place) => {
          // TODO this is a Maybe
          if (!place.geometry || !place.geometry.location) {
            console.log('Returned place contains no geometry');
            return;
          }
          this.addMarkerPlus({ google, map, place });
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

    setupAutocomplete({ google, map }) {
      map.addListener(`click`, (event) => {
        event.stop();
        this.onClickMap(event);
      });
      const input = document.getElementById('autoCompleteInput');
      const searchBox = new google.maps.places.SearchBox(input);
      map.addListener('bounds_changed', () => {
        searchBox.setBounds(map.getBounds());
      });
      searchBox.addListener('places_changed', () => {
        const places = searchBox.getPlaces();
        this.getAutocompleteResults({ google, map, places });
      });
      return { google, map };
    },

    setupGeocoder({ google, map }) {
      const geocoder = new google.maps.Geocoder();
      return geocoder
        .geocode({ address: this.defaultPoi })
        .toEither()
        .map(({ results }) => {
          map.setCenter(results[0].geometry.location);
          map.fitBounds(results[0].geometry.viewport);
          map.setZoom(this.defaultZoom);
        })
        .cata({
          ok: (map) => map,
          error: (results) => {
            console.log(results, 'Issues in setupGeocoder()');
          },
        });
    },

    //#endregion Map Assets

    isValidServiceRequest(place, status) {
      const x =
        status === 'OK' && place && place.geometry && place.geometry.location;
      return x;
    },
    initAssets({ google, map }) {
      this.map = map;
      this.service = new google.maps.places.PlacesService(map);
      this.infowindow = new google.maps.InfoWindow();

      // this.infowindow = new google.maps.InfoWindow({
      //   content: this.$refs.infowindow,
      // });
      return { google, map };
    },
  },

  watch: {
    ready() {
      const x = document.getElementById('infowin');
      this.infowindow.setContent(x);
    },
  },

  mounted() {
    this.seeInfowindow = false;
    const self = this;
    console.time('Mounted GoogleMaps');
    gmapsInit()
      .then((google) => {
        const map = new google.maps.Map(this.$refs.map, {
          // const map = new google.maps.Map(this.$el, {
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
            mapTypeIds: ['roadmap', 'terrain'],
          },
        });
        return { google, map };
      })
      .then(({ google, map }) => this.initAssets({ google, map }))
      .then(({ google, map }) => this.getMarkers({ google, map }))
      .then(({ google, map, markers }) =>
        this.setupAutocomplete({ google, map, markers })
      )
      .then(({ google, map }) => this.setupGeocoder({ google, map }))
      .then(() => (self.ready = true))
      .catch((error) => console.log(error))
      .finally(() => console.timeEnd('Mounted GoogleMaps'));
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
