<template>
  <div>
    <div>
      <!-- Map container -->
      <div class="Map" ref="map"></div>

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
    </div>
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
  </div>
</template>

<script>
import gmapsInit from '../utils/gmaps';
import { compose, firstOrNone } from '@/fp/utils';
import { Ok, Err, Just, nullable, head, get, parseDate } from 'pratica';
import curry from 'curry';

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
    svgMarker() {
      return {
        path:
          'M10.453 14.016l6.563-6.609-1.406-1.406-5.156 5.203-2.063-2.109-1.406 1.406zM12 2.016q2.906 0 4.945 2.039t2.039 4.945q0 1.453-0.727 3.328t-1.758 3.516-2.039 3.070-1.711 2.273l-0.75 0.797q-0.281-0.328-0.75-0.867t-1.688-2.156-2.133-3.141-1.664-3.445-0.75-3.375q0-2.906 2.039-4.945t4.945-2.039z',
        fillColor: 'purple',
        fillOpacity: 0.6,
        strokeWeight: 0,
        rotation: 0,
        scale: 2,
        anchor: new window.google.maps.Point(10, 20),
      };
    },
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
      getDetails: (placeId) => {
        this.service.getDetails({
          placeId: placeId,
          fields: this.options.fields,
        }),
          (place, status) => {
            if (status !== window.google.maps.places.PlacesServiceStatus.OK) {
              return 'Cannot get Place details from service.';
            }
            if (place && place.geometry && place.geometry.location) {
              return place;
            }
          };
      },
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
    onClickMap(event) {
      const xMarksTheSpot = event.latLng;

      //#region helpers
      const buildRequestWith = (placeId) => {
        return {
          placeId: placeId,
          fields: this.options.fields,
        };
      };

      const handleDetailsCallback = (place, status, resolve, reject) => {
        if (status !== window.google.maps.places.PlacesServiceStatus.OK) {
          reject('Cannot get Place details from service.');
        }
        if (place && place.geometry && place.geometry.location) {
          resolve(place);
        }
      };

      // // when POI clicked callback informs getPlaceDetails Promise
      const getPlaceServiceDetails = ({ placeId, resolve, reject }) => {
        this.service.getDetails(
          buildRequestWith(placeId),
          // handle callback
          (place, status) =>
            handleDetailsCallback(place, status, resolve, reject)
        );
      };

      const getMarkedPlace = (place) => this.getMarkedPlace(place);

      const makeMarkerFromMarkedPlace = (markedPlace) => {
        this.makeMarker(markedPlace);
        return markedPlace;
      };
      //#endregion

      const composition = compose(
        this.onMarkerAdded,
        makeMarkerFromMarkedPlace,
        getMarkedPlace
      );

      //#region Services
      const callGeoCoder = () => {
        console.log('calling geocoder with', xMarksTheSpot);
      };

      const callService = (placeId) =>
        new Promise((resolve, reject) => {
          getPlaceServiceDetails({ placeId, resolve, reject });
        })
          .toEither()
          .cata({
            ok: (details) => details,
            error: (details) => {
              console.error(details, 'Issues with service()');
            },
          });
      //#endregion Services

      nullable(event.placeId)
        .map(callService)
        // this is another way to get a default value in the pipeline, but that doesn't work for us here.
        // .alt(event.latLng)
        .cata({
          Just: (details) => details.then((place) => composition(place)),
          Nothing: callGeoCoder,
        });
    },
    getMarkedPlace(place) {
      const {
        name,
        formatted_address,
        place_id,
        plus_code,
        url,
        geometry,
      } = place;
      const position = {
        lat: geometry.location.lat(),
        lng: geometry.location.lng(),
      };
      const title = `${name}\nLast Visited: add lastVisit to Place type`;
      const markedPlace = {
        name,
        formatted_address,
        place_id,
        plus_code,
        url,
        position,
        title,
      };
      return markedPlace;
    },
    makeMarker(markedPlace) {
      const { position, name: title, placeId } = markedPlace;
      let marker = new window.google.maps.Marker({ title, position, placeId });
      marker.setMap(this.map);
      marker.addListener(`click`, (event) => {
        event.stop();
        this.showInfoWindow({ markedPlace, marker });
      });
      marker.addListener(`rightclick`, () => this.promptMarkerDeletion(marker));
      return marker;
    },
    // clicked POI or anywhere else
    onClickMapOrig(event) {
      this.getPlaceDetails(event)
        .then((place) => this.getInfo(place))
        .then((info) => this.showInfoWindow(info))
        .then((markedPlace) => this.updatePlace(markedPlace));
    },
    //#region PlacesService
    getPlaceDetails(event) {
      const { placeId, latLng } = event;
      // this.test2(placeId);
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
    //#region Main workhorse functions

    getInfo(place) {
      const markedPlace = this.getMarkedPlace(place);
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
    //#region hide

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

    makeMarkersFromCache({ google, map }) {
      const markers = this.cachedPlaces.map((cachedPlace) => {
        this.makeMarker(cachedPlace);
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
    //#endregion

    //#region lab tests
    testcurry() {
      var objects = [{ id: 1 }, { id: 2 }, { id: 3 }];

      var get = curry((property, object) => object[property]);
      var map = curry((fn, value) => value.map(fn));
      var getIDs = map(get('id'));

      console.log(getIDs(objects));
    },

    testgetP() {
      const data = {
        name: 'jason',
        children: [
          {
            name: 'bob',
          },
          {
            name: 'blanche',
            children: [
              {
                name: 'lera',
              },
            ],
          },
        ],
      };

      get(['children', 1, 'children', 0, 'name'])(data).cata({
        Just: (name) => console.log(name),
        Nothing: () => console.log('no name'), // doesn't run
      });
    },

    testget() {
      var ids = { ids: [{ id: 1 }, { id: 2 }, { id: 3 }] };

      // pratica get only works with object (not array) selectors
      // and only with indexes (not strings) as the even arg
      get(['ids', 2])(ids).cata({
        Just: (id) => console.log(id), //
        Nothing: () => console.log('no ID'),
      });
    },
    //#endregion lab tests
  },

  watch: {
    ready() {
      this.infowindow.setContent(document.getElementById('infowin'));
    },
  },

  mounted() {
    // this.testget();
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
  width: 100%;
  height: 100%;
}

.Map {
  width: 98vw;
  height: 80vh;
}
</style>
