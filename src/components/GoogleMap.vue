<template>
  <v-container>
    <div class="App" ref="map"></div>
    <v-row>
      <v-col>
        <v-text-field
          dense
          id="autoCompleteInput"
          hint="Enter place search terms here"
          persistent-hint
        >
        </v-text-field>
      </v-col>
    </v-row>
    <info-window-card
      ref="infowin"
      id="infowin"
      :info="info"
      :onToWork="onToWork"
      :onShareGethering="onShareGethering"
      :onVisitPlace="onVisitPlace"
    ></info-window-card>

    <v-snackbar v-model="snackbar" color="orange" centered
      >{{ message }}
      <template v-slot:action="{ attrs }">
        <v-btn color="black" text v-bind="attrs" @click="deleteMarker()">
          Yes
        </v-btn>
        <v-btn color="black" text v-bind="attrs" @click="cancelDelete">
          No
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script>
import gmapsInit from '../utils/gmaps';
import { compose, prop, firstOrNone } from '@/fp/utils';
import InfoWindowCard from './cards/infoWindowCard.vue';

export default {
  name: `Map`,
  props: {
    state: {
      type: Object,
      required: true,
    },
    isConnected: Boolean,
    onToWork: Function,
    onShareGethering: Function,
    onVisitPlace: Function,
    onMarkerAdded: Function,
    onMarkerClicked: Function,
    onDeletePlace: Function,
  },
  components: {
    InfoWindowCard,
  },

  computed: {
    // To create markers during mounting and delete markers in the UI,
    cachedPlaces() {
      return (
        // TODO this is a Maybe
        // fetch any Place data we need to display on infoWindow
        this.state.places?.map((v) => {
          return {
            name: v.name,
            formatted_address: v.formatted_address,
            position: { lat: v.lat, lng: v.lng },
            place_id: v.place_id,
            plus_code: v.plus_code,
            url: v.url,
          };
        }) || []
      );
    },
    visits() {
      return this.state.visits.filter((v) => v.name);
    },

    // to limit query cost at Google, only fetch Place options essential for our mission
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
      message: '',
      info: null,
      snackbar: false,
      timeout: 10000,
      selectedMarker: null,
      ready: false,
      map: null,
      geocoder: null,
      service: null,
      infowindow: null,
      place: null,
      marker: null,
      defaultZoom: 15,
      defaultPoi: 'Sisters City Hall',
      labels: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      labelIndex: 0,
    };
  },

  /* Methods are organized according to the order they are called by the user:
   Autocomplete
   Then/Or
   Clicks:
    POI
    Anywhere else
   Or
    Recent Visits
   Then
   Select from infoWindow Buttons:
    Visit
    Work
    Share
 */
  methods: {
    //#region Main workhorse functions
    // clicked POI or anywhere else
    onClickMap(event) {
      this.getPlaceDetails(event)
        .then((place) => this.getInfo(place))
        .then((info) => this.showInfoWindow(info))
        .then((markedPlace) => this.updatePlace(markedPlace));
    },
    //#region PlacesService
    getPlaceDetails(event) {
      const { placeId, latLng } = event;

      return new Promise((resolve, reject) => {
        // clicked POI
        if (placeId) {
          this.getPlaceServiceDetails({ placeId, resolve, reject });
        } else {
          // clicked anywhere else
          this.geocoder.geocode({ location: latLng }).then((place) => {
            firstOrNone(place.results).match({
              Some: (value) => resolve(value),
              None: () => reject('Cannot geocode', latLng),
            });
          });
        }
      });
    },

    // when POI clicked callback informs getPlaceDetails Promise
    getPlaceServiceDetails({ placeId, resolve, reject }) {
      this.service.getDetails(
        {
          placeId: placeId,
          fields: this.options.fields,
        },
        (place, status) => {
          if (status !== window.google.maps.places.PlacesServiceStatus.OK) {
            reject('Cannot get Place details from service.');
          }
          if (place && place.geometry && place.geometry.location) {
            resolve(place);
          }
        }
      );
    },
    //#endregion PlacesService

    getInfo(place) {
      const getGeometry = prop('geometry');
      const getLocation = prop('location');
      const getPosition = (latLng) => {
        return { position: { lat: latLng.lat(), lng: latLng.lng() } };
      };
      const reduced = compose(getPosition, getLocation, getGeometry);
      const latLng = reduced(place);
      place.name = place.name || 'A Gathering';
      const markedPlace = { ...place, ...latLng };
      const info = this.makeMarkerFromMarkedPlace({
        google: window.google,
        map: this.map,
        markedPlace,
      });

      return info;
    },

    showInfoWindow({ markedPlace, marker }) {
      this.marker = marker;
      this.infowindow.open(this.map, marker);
      this.info = markedPlace;
      return markedPlace;
    },

    updatePlace(markedPlace) {
      this.onMarkerAdded(markedPlace);
    },
    //#endregion Main workhorse functions

    //#region Autocomplete
    setupAutocomplete({ google, map }) {
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
          this.getInfo(place);
          if (place.geometry.viewport) {
            // Only geocodes have viewport.
            bounds.union(place.geometry.viewport);
          } else {
            bounds.extend(place.geometry.location);
          }
          this.updatePlace(place);
        });
        map.fitBounds(bounds);
      }
    },
    //#endregion Autocomplete

    //#region Marker code
    // Adds a marker to the map.
    makeMarkerFromMarkedPlace({ google, map, markedPlace }) {
      const marker = new google.maps.Marker({
        map: map,
        position: markedPlace.position,
        label: this.labels[this.labelIndex++ % this.labels.length],
        place_id: markedPlace.place_id, // so we can delete the marker's corresponding Place element
      });
      marker.addListener('click', (event) => {
        event.stop();
        this.showInfoWindow({ markedPlace, marker });
      });

      marker.addListener(`rightclick`, () => this.promptMarkerDeletion(marker));
      return { marker, markedPlace };
    },

    makeMarkersFromCache({ google, map }) {
      const markers = this.cachedPlaces.map((cachedPlace) => {
        // this is the only call to addMarkersPlus that is not using a googlemaps Place
        this.makeMarkerFromMarkedPlace({
          google,
          map,
          markedPlace: cachedPlace,
        });
      });
      console.log(`Rendered ${markers.length} markers`);
      return { google, map, markers };
    },

    promptMarkerDeletion(marker) {
      this.selectedMarker = marker;
      this.message = `Delete marker for ${marker.name} from the map?`;
      this.snackbar = true;
    },
    deleteMarker() {
      this.selectedMarker.setMap(null);
      // see space.js
      this.onDeletePlace(this.selectedMarker.place_id);
      this.cancelDelete();
    },
    cancelDelete() {
      this.selectedMarker = null;
      this.snackbar = false;
    },
    //#endregion Marker code

    //#region mounted() helpers
    setupGeocoder({ google, map }) {
      const geocoder = new google.maps.Geocoder();
      this.geocoder = geocoder;
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

    initAssets({ google, map }) {
      map.addListener(`click`, (event) => {
        event.stop();
        this.onClickMap(event);
      });
      this.map = map;
      this.service = new google.maps.places.PlacesService(map);
      this.infowindow = new google.maps.InfoWindow();
      return { google, map };
    },
    //#endregion mounted() helpers
  },

  watch: {
    ready() {
      this.infowindow.setContent(document.getElementById('infowin'));
    },
  },

  mounted() {
    const self = this;
    console.time('Mounted GoogleMaps');
    gmapsInit()
      .then((google) => {
        const map = new google.maps.Map(this.$refs.map, {
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
            mapTypeIds: ['roadmap', 'terrain'],
          },
        });
        return { google, map };
      })
      .then(({ google, map }) => this.initAssets({ google, map }))
      .then(({ google, map }) => this.makeMarkersFromCache({ google, map }))
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
