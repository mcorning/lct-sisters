<template>
  <v-container fluid class="fill-height">
    <div class="text-center text-black">
      <v-overlay :value="overlay" opacity=".25">
        <v-progress-circular indeterminate width="10" size="200" color="purple">
          <span> Starting LCT, contacting server, and loading map... </span>
        </v-progress-circular>
      </v-overlay>
    </div>

    <v-toolbar v-show="ready" dense floating id="autocompleteToolbar">
      <div class="text-center">
        <v-menu
          v-model="menu"
          :close-on-content-click="false"
          :nudge-width="200"
          offset-x
        >
          <template v-slot:activator="{ on, attrs }">
            <v-btn icon v-bind="attrs" v-on="on">
              <v-icon>mdi-dots-vertical</v-icon>
            </v-btn>
          </template>
          <v-card>
            <div v-if="underConstruction">
              <v-card-text>Under construction</v-card-text>
            </div>
            <div v-else>
              <v-row
                ><v-col class="text-center"
                  ><img src="https://picsum.photos/200/200" alt="nice"
                /></v-col>
                <v-col cols="auto">
                  <v-list>
                    <v-list-item>
                      <v-list-item-action>
                        <v-select
                          v-model="workplace"
                          :items="places"
                          :menu-props="{ top: true, offsetY: true }"
                          label="Workplace"
                        ></v-select>
                      </v-list-item-action>
                    </v-list-item>
                    <v-list-item>
                      <v-list-item-action>
                        <v-text-field
                          v-model="shift"
                          label="Shift hours:"
                          hide-details
                        ></v-text-field>
                      </v-list-item-action>
                    </v-list-item>

                    <v-list-item>
                      <v-list-item-action>
                        <v-switch v-model="hints" color="purple"></v-switch>
                      </v-list-item-action>
                      <v-list-item-title>Enable hints</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-col></v-row
              >

              <v-divider></v-divider>
            </div>
            <v-card-actions>
              <v-spacer></v-spacer>

              <v-btn text @click="menu = false">
                Cancel
              </v-btn>
              <v-btn color="primary" text @click="saveSpecial">
                Save
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>
      </div>

      <v-text-field
        hide-details
        prepend-icon="mdi-magnify"
        single-line
        class="ml-3"
        dense
        id="autoCompleteInput"
        placeholder="Type here to search"
      >
      </v-text-field>
      <btn-with-tooltip
        tip="Pan to your location"
        :click="panToCurrentLocation"
        icon="mdi-crosshairs-gps"
      />
    </v-toolbar>
    <!-- Map container -->
    <!-- map size set in .Map class below -->
    <div class="Map" ref="map"></div>

    <info-window-card
      ref="infowin"
      id="infowin"
      :info="info"
      :onVisitPlace="onVisitPlace"
      @namedGathering="onNamedGathering"
      @deleteMarker="deleteMarker"
    ></info-window-card>
    <v-snackbar
      v-model="snackbarThanks"
      centered
      :color="confirmationColor"
      timeout="40000"
      multi-line
    >
      <v-card color="green" flat>
        <v-card-text class="text-h6 mb-0 pb-0"
          >Welcome Microsoft Giving Campaign Supporters</v-card-text
        >
        <v-card-subtitle class="pt-1"
          >Thank you for taking the time to look at our work.</v-card-subtitle
        >
        <v-card-text
          >Click on the building for your next meeting. You will see the event
          on your COVID-aware calendar.
        </v-card-text>
        <v-card-text>
          If you test positive later, come back to LCT and click the Big Red
          Button to warn others of possible exposure to the virus.
        </v-card-text>
        <v-card-actions>
          <v-btn text @click="snackbarThanks = false">
            Thanks a 0x4240 for your support
          </v-btn></v-card-actions
        >
      </v-card>
    </v-snackbar>
    <v-snackbar v-model="snackbar" color="orange" centered>
      <v-card-title>{{ title }}</v-card-title>
      <v-card color="orange" flat>
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
    <v-snackbar
      v-model="snackbarPrompt"
      centered
      timeout="-1"
      multi-line
      vertical
    >
      <v-card-title>{{ title }}</v-card-title>
      <v-card flat>
        <v-card-text v-html="message" />
        <v-text-field v-model="startFrom" :label="prompt"></v-text-field>
      </v-card>

      <template v-slot:action="{ attrs }">
        <v-btn dark text v-bind="attrs" @click="goThere">
          <v-icon>check</v-icon>
        </v-btn>
        <v-btn dark text v-bind="attrs" @click="snackbarPrompt = false">
          <v-icon>close</v-icon>
        </v-btn>
      </template>
    </v-snackbar>
    <status-card
      v-if="ready && showStatus"
      :status="status"
      :toggleStatus="toggleStatus"
      :copyStatus="copyStatus"
      :cutStatus="cutStatus"
    ></status-card>
  </v-container>
</template>

<script>
import gmapsInit from '../utils/gmaps';
import { compose, firstOrNone } from '@/fp/utils';
import { nullable } from 'pratica';
import { printJson } from '@/utils/helpers';

import InfoWindowCard from './cards/infoWindowCard.vue';
import StatusCard from './cards/statusCard.vue';
import BtnWithTooltip from './misc/btnWithTooltip.vue';

export default {
  name: `Map`,
  props: {
    state: {
      type: Object,
      required: true,
    },
    setSpecial: Function,
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
    StatusCard,
    BtnWithTooltip,
  },

  computed: {
    places() {
      return this.state.places.map((v) => v.name);
    },
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
      workplace: this.state.settings.workplace,
      shift: this.state.settings.shift,
      confirmationMessage: 'Welcome to a safer Microsoft Campus',
      confirmationColor: 'green',
      snackbarThanks: false,
      underConstruction: false,
      fav: true,
      menu: false,
      messages: false,
      hints: true,

      map: null, // only used for panToCurrentLocation()
      showStatus: true,
      startFrom: '',
      prompt: '',
      snackbarPrompt: false,
      title: '',
      status: '',
      overlay: true,
      message: null,
      info: null,
      snackbar: false,
      timeout: 10000,
      selectedMarker: null,
      ready: false,
      defaultZoom: 16,
      positionOptions: {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
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
    saveSpecial() {
      this.setSpecial({ workplace: this.workplace, shift: this.shift });
      this.menu = false;
    },
    panToCurrentLocation() {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          this.map.setCenter(pos);
          this.map.setZoom(18);
        },
        (error) => {
          console.log(error);
        },
        this.positionOptions
      );
    },
    onNamedGathering(val) {
      this.info.name = val;
    },

    toggleStatus() {
      this.showStatus = !this.showStatus;
    },
    setStatus(msg) {
      this.status += `${msg}
      `;
    },
    copyStatus() {
      this.setStatus(`Copied to clipboard ${this.$clipboard(this.status)}`); // this.$clipboard copy any String/Array/Object you want
    },
    cutStatus() {
      this.$clipboard(this.status);
      this.status = 'Status cut to clipboard';
    },

    goThere() {
      alert(this.startFrom);
    },

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
          global_code: plus_code?.global_code,
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
        this.selectedMarker = marker;
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
      this.setStatus('Mounting map');
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

      const showCity = (poi) => {
        const vm = this;
        const { global_code, location, viewport } = poi;

        this.setStatus(`showCity(): global_code: ${global_code}
        ${printJson(location)}
        ${printJson(viewport)}`);

        if (location) {
          map.setCenter(location);
          if (viewport) {
            map.fitBounds(viewport);
          }
          map.setZoom(vm.defaultZoom);
          this.ready = true;
        }
      };

      const showInfoWindow = ({ map, markedPlace, marker, infowindow }) => {
        this.info = markedPlace;
        this.selectedMarker = marker; // for deleting purposes
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
        this.setStatus('1) Markers ready');
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
        this.setStatus('2) Autocomplete setup');
        const toolbar = document.getElementById('autocompleteToolbar');
        map.controls[google.maps.ControlPosition.TOP_CENTER].push(toolbar);

        return { google, map };
      };
      setupAutocomplete({ google, map, infowindow });

      const getAddressFrom = (results) => {
        const address =
          results.address_components.length > 3
            ? results.address_components[2].short_name +
              ',' +
              results.address_components[4].short_name
            : results.address_components[0].short_name;
        console.log('\tgetAddressFrom():');
        console.log(printJson(address));
        return { address };
      };

      const showPosition = (position) => {
        const vm = this;
        console.log('\tshowPosition():');
        console.log(printJson(position.coords));
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        geocoder
          .geocode({ location: { lat, lng } })
          .toEither()
          .map(({ results }) => {
            console.log('\tgeocode results:');
            console.log(printJson(results));

            geocoder
              .geocode(getAddressFrom(results[0]))
              .then((poi) => {
                const city = poi.results[0];
                const geometry = city.geometry;
                map.setCenter(geometry.location);
                map.fitBounds(geometry.bounds);
                map.setZoom(vm.defaultZoom - 3);
                vm.setPoi({
                  namespace: city.address_components[2].short_name,
                  location: JSON.stringify(geometry.location),
                  viewport: JSON.stringify(geometry.viewport),
                });
                this.ready = true;
              })
              .catch('oops.', (e) => console.log(e));
          })
          .cata({
            ok: (map) => map,
            error: (results) => {
              console.log(results, 'Issues in setupGeocoder()');
            },
          });
      };

      const showMap = ({ map }) => {
        try {
          this.map = map;
          if ('geolocation' in navigator) {
            this.setStatus(`This browser supports geolocation `);
          } else {
            this.setStatus(`This browser does NOT support geolocation `);
          }

          const defaultPoi = this.getPoi();
          this.setStatus(`Default POI `);
          this.setStatus(`${printJson(defaultPoi)})`);

          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              // success event handler
              showPosition,
              // error event handler
              (error) => {
                alert(`Trouble getting your position: ${error.message}`);
              },
              this.positionOptions
            );
          } else if (defaultPoi.namespace) {
            showCity(defaultPoi);
          }

          this.setStatus('3) Ran showMap()');
        } catch (error) {
          this.overlay = false;
          console.log(error.message);
          this.setStatus(error.message);
          this.setStatus(error.stack);
        }
      };

      // last steps in bootstrap
      showMap({ map, geocoder });
    },

    //#region Delete Marker code called by template
    promptMarkerDeletion(marker) {
      this.selectedMarker = marker;
      this.title = 'Delete Marker/Place';
      this.message = `Delete marker for <strong>${marker.title}</strong> from the map?`;
      this.snackbar = true;
    },
    deleteMarker() {
      if (this.selectedMarker) {
        this.selectedMarker.setMap(null);
        this.onDeletePlace(this.selectedMarker.place_id);
        this.cancelDelete();
      }
    },
    cancelDelete() {
      this.selectedMarker = null;
      this.snackbar = false;
    },
    //#endregion Delete Marker code
  },

  watch: {
    group() {
      this.drawer = false;
    },
    ready() {
      console.log('Map component ready');
      if (this.$route.query.place_id) {
        console.log('Detected a shared event:', this.$route.query.place_id);
        this.setStatus(
          `Detected a shared event: ${this.$route.query.place_id}`
        );
        this.setStatus(printJson(this.$route.query) + '\n\n');
        // in space.js
        this.onSharePlace();
      }
      if (this.$route.query.sponsor) {
        this.snackbarThanks = true;
      } else this.overlay = false;
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
          fullscreenControl: true,
          fullscreenControlOptions: {
            position: google.maps.ControlPosition.LEFT_BOTTOM,
          },
        });
        return { google, map };
      })
      .then(({ google, map }) => this.onMounted({ google, map }))
      .catch((error) => console.log(error))
      .finally(() => {
        console.timeEnd('Mounted GoogleMaps');
        this.overlay = false;
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
  height: 88vh;
}
</style>
