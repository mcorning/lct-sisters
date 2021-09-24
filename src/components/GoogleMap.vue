<template>
  <v-container fluid class="fill-height">
    <!-- Map container -->
    <!-- map size set in .Map class below -->
    <div class="Map" ref="map"></div>

    <v-row>
      <v-col>
        <v-text-field
          class="ml-3"
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
      :onVisitPlace="onVisitPlace"
    ></info-window-card>
    <v-snackbar v-model="snackbar" color="orange" centered>
      <v-card color="orange" flat>
        <v-card-title>Delete Marker/Place</v-card-title>
        <v-card-text class="white--text" v-html="message" />
      </v-card>

      <template v-slot:action="{ attrs }">
        <v-btn color="black" text v-bind="attrs" @click="deleteMarker()">
          Yes
        </v-btn>
        <v-btn color="black" text v-bind="attrs" @click="cancelDelete">
          No
        </v-btn>
      </template>
    </v-snackbar>
    <v-textarea :value="status" style="font-size:10pt" />
  </v-container>
</template>

<script>
import gmapsInit from '../utils/gmaps';
import { compose, firstOrNone } from '@/fp/utils';
import { nullable } from 'pratica';
import { printJson } from '@/utils/helpers';

import InfoWindowCard from './cards/infoWindowCard.vue';

export default {
  name: `Map`,
  props: {
    state: {
      type: Object,
      required: true,
    },
    onToWork: Function,
    onShareGethering: Function,
    onVisitPlace: Function,
    onSharePlace: Function,
    onMarkerAdded: Function,
    onMarkerClicked: Function,
    onDeletePlace: Function,
    query: Object,
    setPoi: Function,
    getPoi: Function,
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
            global_code: v.global_code,
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
      status: 'Ready',
      overlay: true,
      message: '',
      info: null,
      snackbar: false,
      timeout: 10000,
      selectedMarker: null,
      ready: false,
      defaultZoom: 16,
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
    onClickMap(
      event,
      { map, service, geocoder, infowindow, onMarkerAdded, fields }
    ) {
      const xMarksTheSpot = event.latLng;

      //#region Composition functions
      //////////////////////////////////////////////////////////////////
      // place -> markedPlace
      // first step in rendering the infowindow after clicking the map
      const getMarkedPlace = (place) => {
        const {
          name = 'Gathering',
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
          global_code: plus_code.global_code,
          url,
          position,
          title,
        };
        return markedPlace;
      };

      // markedPlace -> markedPlace
      // call the async Place entity update function
      // and continue, immediately, on toward rendering the infowindow
      const updatePlace = (markedPlace) => {
        onMarkerAdded(markedPlace);
        return markedPlace;
      };

      // markedPlace -> markedPlace
      //this sets state side-effect for the InfoWindow component's prop
      const setInfo = (markedPlace) => {
        this.info = markedPlace;
        return markedPlace;
      };

      // markedPlace -> marker
      // transforms the marked place into a marker object for infowindow's marker arg
      const makeMarkerFromMarkedPlace = (markedPlace) => {
        const { position, name: title, place_id } = markedPlace;
        let marker = new window.google.maps.Marker({
          title,
          position,
          place_id,
        });
        marker.setMap(map);
        marker.addListener(`click`, (event) => {
          event.stop();
          setInfo(markedPlace);
          showInfoWindow(marker);
        });
        marker.addListener(`rightclick`, () =>
          this.promptMarkerDeletion(marker)
        );
        return marker;
      };

      // marker -> string
      // final step in the UX after clicking map
      const showInfoWindow = (marker) => {
        infowindow.open(map, marker);
        return `Rendered infowindow for ${marker.title}`;
      };

      const composition = compose(
        showInfoWindow, // marker -> string
        makeMarkerFromMarkedPlace, // markedPlace -> marker
        setInfo, // markedPlace -> markedPlace
        updatePlace, // markedPlace -> markedPlace
        getMarkedPlace // place => markedPlace
      );
      //////////////////////////////////////////////////////////////////
      //#endregion Composition functions

      //#region Googlemap Services
      const handleDetailsCallback = (place, status, resolve, reject) => {
        if (status !== window.google.maps.places.PlacesServiceStatus.OK) {
          reject('Cannot get Place details from service.');
        }
        if (place && place.geometry && place.geometry.location) {
          resolve(place);
        }
      };

      const buildRequestWith = (placeId) => {
        return {
          placeId: placeId,
          fields: fields,
        };
      };
      // // when POI clicked callback informs getPlaceServiceDetails Promise
      const getPlaceServiceDetails = ({ placeId, resolve, reject }) => {
        service.getDetails(
          buildRequestWith(placeId),
          // handle callback
          (place, status) =>
            handleDetailsCallback(place, status, resolve, reject)
        );
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

      const callGeoCoder = () => {
        geocoder.geocode({ location: xMarksTheSpot }).then((place) => {
          firstOrNone(place.results).match({
            Some: (place) => composition(place),
            None: () => console.log,
          });
        });
      };
      //#endregion Googlemap Services

      // make Google Service call depending on presence of placeID (assumes LatLng is not nullable)
      nullable(event.placeId)
        .map(callService)
        .cata({
          Just: (details) => details.then((place) => composition(place)),
          Nothing: callGeoCoder,
        });
    },

    onMounted({ google, map }) {
      this.status = 'Mounting map';
      const geocoder = new google.maps.Geocoder();
      const service = new google.maps.places.PlacesService(map);

      const infowindow = new google.maps.InfoWindow({
        content: document.getElementById('infowin'),
        shouldFocus: true,
      });

      const onMarkerAdded = this.onMarkerAdded;
      const fields = this.options.fields;

      map.addListener(`click`, (event) => {
        event.stop();
        this.onClickMap(event, {
          map,
          service,
          geocoder,
          infowindow,
          onMarkerAdded,
          fields,
        });
      });

      const showCity = (city) => {
        const vm = this;
        const { plus_code, viewport } = city;
        this.status += `\nshowCity(): plus_code: ${plus_code}\n ${printJson(
          viewport
        )}`;

        if (location) {
          // map.setCenter(plus_code);
          map.fitBounds(viewport);
          map.setZoom(vm.defaultZoom);
        }
      };

      const showPosition = (position) => {
        const vm = this;

        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        geocoder
          .geocode({ location: { lat, lng } })
          .toEither()
          .map(({ results }) => {
            geocoder
              .geocode({
                address:
                  results[0].address_components[2].short_name +
                  ',' +
                  results[0].address_components[4].short_name,
              })
              .then((city) => {
                const geometry = city.results[0].geometry;
                map.setCenter(geometry.location);
                map.fitBounds(geometry.viewport);
                map.setZoom(vm.defaultZoom - 3);
                vm.setPoi(
                  results[0].address_components[2].short_name,
                  JSON.stringify(geometry.location),
                  JSON.stringify(geometry.viewport)
                );
              });
          })
          .cata({
            ok: (map) => map,
            error: (results) => {
              console.log(results, 'Issues in setupGeocoder()');
            },
          });
      };

      const showInfoWindow = ({ map, markedPlace, marker, infowindow }) => {
        this.info = markedPlace;
        infowindow.open(map, marker);
        return markedPlace;
      };
      const makeMarker = ({ map, infowindow, markedPlace }) => {
        const { position, name: title, place_id } = markedPlace;
        let marker = new window.google.maps.Marker({
          title,
          position,
          place_id,
        });
        marker.setMap(map);
        marker.addListener(`click`, (event) => {
          event.stop();
          showInfoWindow({ map, markedPlace, marker, infowindow });
        });
        marker.addListener(`rightclick`, () =>
          this.promptMarkerDeletion(marker)
        );
        return marker;
      };

      const makeMarkersFromCache = ({ google, map, infowindow }) => {
        const markers = this.cachedPlaces.map((markedPlace) => {
          makeMarker({ map, infowindow, markedPlace });
        });
        console.log(`Rendered ${markers.length} markers`);
        return { google, map, markers };
      };

      makeMarkersFromCache({ google, map, infowindow });

      const getAutocompleteResults = ({ google, map, infowindow, places }) => {
        {
          // TODO this is a Maybe
          if (places.length == 0) {
            return;
          }
          const getMarkedPlace = (place) => {
            const {
              name = 'Gathering',
              formatted_address,
              place_id,
              plus_code: { global_code },
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
              global_code,
              url,
              position,
              title,
            };
            return markedPlace;
          };
          // For each place, get the icon, name and location.
          const bounds = new google.maps.LatLngBounds();
          places.forEach((place) => {
            // TODO this is a Maybe
            if (!place.geometry || !place.geometry.location) {
              console.log('Returned place contains no geometry');
              return;
            }
            if (place.geometry.viewport) {
              // Only geocodes have viewport.
              bounds.union(place.geometry.viewport);
            } else {
              bounds.extend(place.geometry.location);
            }
            const markedPlace = getMarkedPlace(place);
            this.onMarkerAdded(markedPlace);
            const marker = makeMarker({
              google,
              map,
              infowindow,
              markedPlace,
            });

            showInfoWindow({ map, markedPlace, marker, infowindow });
          });
          map.fitBounds(bounds);
        }
      };

      const setupAutocomplete = ({ google, map, infowindow }) => {
        const input = document.getElementById('autoCompleteInput');
        const searchBox = new google.maps.places.SearchBox(input);
        map.addListener('bounds_changed', () => {
          searchBox.setBounds(map.getBounds());
        });
        searchBox.addListener('places_changed', () => {
          const places = searchBox.getPlaces();
          getAutocompleteResults({ google, map, infowindow, places });
        });
        return { google, map };
      };
      setupAutocomplete({ google, map, infowindow });

      const geolocationErrorHandler = () => {
        this.status += '\nUnable to retrieve your location';
      };

      const showMap = () => {
        if ('geolocation' in navigator) {
          this.status += `\nThis browser supports geolocation `;
        } else {
          this.status += `\nThis browser does NOT support geolocation `;
        }
        const defaultPoi = this.getPoi();
        this.status += `\nDefault POI ${printJson(defaultPoi)}`;
        if (defaultPoi.namespace) {
          showCity(defaultPoi);
        } else if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            showPosition,
            geolocationErrorHandler
          );
        }
      };

      // last steps in bootstrap
      showMap({ map, geocoder });
      this.ready = true;
    },

    //#region Delete Marker code called by template
    promptMarkerDeletion(marker) {
      this.selectedMarker = marker;
      this.message = `Delete marker for <strong>${marker.title}</strong> from the map?`;
      this.snackbar = true;
    },
    deleteMarker() {
      this.selectedMarker.setMap(null);
      this.onDeletePlace(this.selectedMarker.place_id);
      this.cancelDelete();
    },
    cancelDelete() {
      this.selectedMarker = null;
      this.snackbar = false;
    },
    //#endregion Delete Marker code
  },

  watch: {
    ready() {
      console.log('Map component ready');
      if (this.$route.query.place_id) {
        console.log('Detected a shared event:', this.$route.query.place_id);
        // in space.js
        this.onSharePlace();
      }
    },
  },

  mounted() {
    console.time('Mounted GoogleMaps');

    // TODO this is an EitherAsync
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
      .then(({ google, map }) => this.onMounted({ google, map }))
      .catch((error) => console.log(error))
      .finally(() => {
        console.timeEnd('Mounted GoogleMaps'), (this.overlay = false);
      });
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
  width: 100vw;
  height: 70vh;
}
</style>
