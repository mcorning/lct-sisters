<template>
  <v-sheet>
    <div class="text-center text-black">
      <v-overlay :value="overlay" opacity=".25">
        <v-progress-circular indeterminate width="10" size="200" color="purple">
          <span> Contacting server and loading map... </span>
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
            <v-row dense no-gutters
              ><v-col cols="10"
                ><img src="https://picsum.photos/200/200" alt="nice" />
              </v-col>

              <v-col col="1" class="text-right">
                <v-btn color="primary" icon @click="menu = false">
                  <v-icon>close</v-icon>
                </v-btn></v-col
              >
            </v-row>
            <v-row>
              <v-col cols="auto">
                <v-list>
                  <v-list-item>
                    <v-row dense
                      ><v-col cols="8">
                        <!-- <v-list-item>
                            <v-list-item-action> -->
                        <v-select
                          v-model="workplace"
                          :items="places"
                          :menu-props="{ top: true, offsetY: true }"
                          label="Workplace"
                        ></v-select>
                        <!-- </v-list-item-action>
                          </v-list-item>--> </v-col
                      ><v-col cols="4">
                        <!-- <v-list-item>
                            <v-list-item-action> -->
                        <v-text-field
                          v-model="shift"
                          label="Shift:"
                          placeholder="(in hours)"
                          hide-details
                        ></v-text-field>
                        <!-- </v-list-item-action>
                          </v-list-item>  -->
                      </v-col></v-row
                    ></v-list-item
                  >
                </v-list>
                <span class="text-caption ml-4"
                  >Default map center is: {{ showMapCenter() }}</span
                >
              </v-col></v-row
            >
            <v-divider></v-divider>
            <v-card-actions>
              <v-switch
                v-model="savedMapCenter"
                label="Map center saved"
                color="primary"
                @change="changeMapCenter"
              ></v-switch>
              <v-spacer />
              <v-switch
                v-model="emergency"
                label="Diagnostics Open"
                color="primary"
                @click="menu = false"
              ></v-switch>
            </v-card-actions>
            <v-card-actions>
              <v-btn text @click="clearMyLocationSettings"
                >Clear location</v-btn
              >
              <v-spacer />
              <v-btn text @click="volunteer">
                Volunteer
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
    <v-row no-gutters
      ><v-col>
        <div :class="checkEmergency" width="100%" ref="map"></div> </v-col
      ><v-col v-if="emergency">
        <v-card>
          <v-btn absolute top right icon @click="emergency = false"
            ><v-icon>close</v-icon></v-btn
          >
          <v-btn plain text @click="emailDiagnostics" large class="mt-3"
            >Diagnostics</v-btn
          >
          <pre class="ml-5">{{ diagnostics }}</pre>
        </v-card>
      </v-col>
    </v-row>
    <info-window-card
      ref="infowin"
      id="infowin"
      :info="info"
      :onVisitPlace="onVisitPlace"
      @namedGathering="onNamedGathering"
      @deleteMarker="deleteMarker"
    ></info-window-card>
    <v-snackbar
      color="green darken-2"
      v-model="snackbarThanks"
      centered
      timeout="60000"
      multi-line
    >
      <v-card color="green darken-2" class="white-text" flat>
        <v-btn absolute top right icon @click="snackbarThanks = false"
          ><v-icon>close</v-icon>
        </v-btn>
        <v-card-text class="text-h6 mx-auto "
          >Welcome Microsoft Giving Campaign Supporters</v-card-text
        >
        <v-card-subtitle class="pt-1"
          >Thank you for taking the time to look at our work.</v-card-subtitle
        >

        <v-card-text>
          For your next meeting, click on the appropriate building or location.
          You will see the event on your COVID-aware calendar. That's all you
          have to do, for now.
        </v-card-text>
        <v-card-text>
          Later, if you test positive for COVID, come back to LCT and click the
          Big Red Button to warn others in the meeting of possible exposure to
          the virus.
          <p class="mx-auto my-5">
            Thanks a 0x4240 for your support, and stay safe out there...
          </p>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-row no-gutters dense align="center"
            ><v-col>
              <v-btn text @click="volunteer">
                Volunteer
              </v-btn>
              <v-btn text @click="goToDocs">
                Github
              </v-btn> </v-col
            ><v-spacer /><v-col>
              <v-btn text @click="goToDocs">
                LCT Policies
              </v-btn>
              <v-btn text @click="goToDocs">
                LCT Docs
              </v-btn>
            </v-col></v-row
          >
        </v-card-actions>
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

    <confirmation-snackbar
      v-if="confSnackbar"
      :confirmationTitle="confirmationTitle"
      :confirmationMessage="confirmationMessage"
      :bottome="confBottom"
    />
  </v-sheet>
</template>

<script>
import gmapsInit from '../utils/gmaps';
import { compose, firstOrNone } from '@/fp/utils';
import { nullable } from 'pratica';
import { printJson } from '@/utils/helpers';

import InfoWindowCard from './cards/infoWindowCard.vue';
// import StatusCard from './cards/statusCard.vue';
import BtnWithTooltip from './misc/btnWithTooltip.vue';
import ConfirmationSnackbar from './prompts/confirmationSnackbar.vue';

export default {
  name: `Map`,
  props: {
    state: {
      type: Object,
      required: true,
    },
    setSpecial: Function,
    clearLocationSettings: Function,
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
    setDefaultMapCenter: Function,
  },
  components: {
    InfoWindowCard,
    // StatusCard,
    BtnWithTooltip,
    ConfirmationSnackbar,
  },

  computed: {
    checkEmergency() {
      if (!this.emergency) {
        return 'Map';
      }
      return this.$vuetify.breakpoint.mdAndUp ? 'EmergencyW' : 'EmergencyH';
    },
    breakpoint() {
      return this.$vuetify.breakpoint.name;
    },
    lastLocation() {
      // double check for bad location value
      if (this.state.settings.location === '{}') return null;

      const loc = this.state.settings.location
        ? JSON.parse(this.state.settings.location)
        : null;

      return loc;
    },
    defaultMapCenter() {
      return this.state.settings.default_map_center
        ? JSON.parse(this.state.settings.default_map_center)
        : null;
    },
    diagnostics() {
      return this.msg.join('\n');
    },

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
      sponsor: '',
      defaultPosition: {
        lat: parseFloat(process.env.VUE_APP_LAT),
        lng: parseFloat(process.env.VUE_APP_LNG),
      },
      sponsorPosition: this.defaultPosition,
      savedMapCenter: false,
      emergency: true,
      msg: [],
      workplace: this.state.settings.workplace,
      shift: this.state.settings.shift || 8,

      confSnackbar: false,
      confirmationTitle: '',
      confirmationMessage: 'Welcome to a safer Microsoft Campus',
      confirmationColor: '',
      confBottom: true,

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
      overlay: false,
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
    changeMapCenter(val) {
      const center = val ? this.getMapCenter() : null;
      this.setDefaultMapCenter(center);
    },
    emailDiagnostics() {
      this.$clipboard(this.msg);
      window.location = `mailto:mcorning@soteriaInstitute.org?subject=Diagnostics&body=Paste copied text here, please.}`;
    },
    goToPolicies() {
      window.open(
        'https://lct-docs.netlify.app/policy/#privacy-notice',
        '_blank',
        'noopener noreferrer'
      );
    },
    goToDocs() {
      window.open(
        'https://lct-docs.netlify.app',
        '_blank',
        'noopener noreferrer'
      );
    },
    goToGithub() {
      window.open(
        'https://github.com/mcorning/lct-sisters',
        '_blank',
        'noopener noreferrer'
      );
    },
    saveSpecial() {
      this.setSpecial({ workplace: this.workplace, shift: this.shift });
      this.menu = false;
    },
    clearMyLocationSettings() {
      this.clearLocationSettings();
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

        return marker;
      };

      const makeMarkersFromCache = ({ google, map, infowindow }) => {
        const markers = this.cachedPlaces.map((markedPlace) => {
          makeMarker({ map, infowindow, markedPlace });
        });
        console.log(`Rendered ${markers.length} markers`);
        this.setStatus('1) Markers ready');
        this.msg.push(`1) Rendered ${markers.length} markers`);

        return { google, map, markers };
      };

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
              url,
              plus_code,
              geometry,
            } = place;
            const position = {
              lat: geometry.location.lat(),
              lng: geometry.location.lng(),
            };
            const global_code = plus_code?.global_code || '';

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
        this.msg.push('2) Autocomplete setup');

        return { google, map };
      };

      const showPosition = (latLng) => {
        const getLocality = (poi) => {
          let locality = poi.address_components.find((v) =>
            v.types.includes('locality')
          );
          this.msg.push(
            `\tc) ${
              locality ? 'Found' : 'Could not find'
            } locality address component`
          );
          if (!locality) {
            this.msg.push('Looking for postal_town type, instead.');
            locality = poi.address_components.find((v) =>
              v.types.includes('postal_town')
            );
            this.msg.push(printJson(locality));
            if (!locality) {
              this.msg.push('Listing available address_component types:');
              this.msg.push(
                `\t${printJson(poi.address_components.map((v) => v.types))})`
              );
            }
          }
          return locality;
        };

        const vm = this;
        console.log('\tshowPosition():');
        console.log(`\t${latLng}`);
        const location = latLng;
        console.log('\t', printJson(location));
        vm.msg.push(`\tb) showPosition(): calling geocoder`);
        vm.msg.push(`\t\twith location: ${printJson(location)}`);
        geocoder
          .geocode({ location })
          .toEither()
          .map(({ results }) => {
            const poi = results[0];

            console.log('\tgeocode results:');
            console.log(printJson(poi));

            const locality = getLocality(poi);

            const namespace = locality ? locality.short_name : 'NA';
            const geometry = poi.geometry;
            const { location, viewport } = geometry;
            vm.msg.push('\td) Geocode geometry results:');
            vm.msg.push(`\t${printJson(geometry)}`);
            map.setCenter(location);
            map.setZoom(vm.defaultZoom - 2);
            const err = vm.setPoi({
              namespace,
              location: JSON.stringify(location),
              viewport: JSON.stringify(viewport),
            });
            const msg = err ? err : '\te) Saved location settings';
            vm.msg.push(msg);

            vm.ready = true;
          })
          .cata({
            ok: () => {
              vm.msg.push('\td) Leaving geocoder in showPosition() ');
            },
            error: (results) => {
              console.log(results, 'Issues in setupGeocoder()');
              vm.msg.push(`!!!! showPosition():error: ${results} !!!!`);
              vm.msg.push(
                `Your location setting is: ${this.state.settings.location}`
              );
              vm.msg.push('\tReverting to default position:');
              vm.msg.push(`\t${printJson(vm.defaultPosition)}`);
              map.setCenter(vm.defaultPosition);
              vm.emergency = true;
              vm.ready = true;
            },
          });
      };

      makeMarkersFromCache({ google, map, infowindow });
      setupAutocomplete({ google, map, infowindow });

      // final step in loading map:
      try {
        this.map = map;
        this.msg.push('3) Getting default location:');
        const center = this.defaultMapCenter || this.lastLocation;
        if (this.sponsor === 'microsoft') {
          this.msg.push(`\tWelcome Microsoft...`);
          const position = {
            coords: { latitude: 47.6888958, longitude: -122.1517598 },
          };
          showPosition(position);
        } else if (center) {
          this.msg.push(`\ta) found saved center:`);
          this.msg.push(`\t${printJson(center)}`);

          showPosition(center);
        } else {
          this.msg.push(`\ta) panning to current location`);
          this.panToCurrentLocation();
        }
      } catch (error) {
        this.emergency = true;

        throw 'Sorry. Error loading map: ' + error.message;
      }
    },

    // called above in the last step to showing the map
    panToCurrentLocation() {
      const self = this;
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // only HTML5 geolocation returns a position object
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          self.map.setCenter(pos);
          self.map.setZoom(18);
          self.ready = true;
          self.setPoi({
            location: JSON.stringify(pos),
          });
        },
        (error) => {
          if (error.code === 1) {
            // default to sponsor or Sisters
            const pos = self.sponsorPosition || self.defaultPosition;
            self.map.setCenter(pos);
            self.map.setZoom(18);
            self.ready = true;
            self.setPoi({
              location: JSON.stringify(pos),
            });
            self.showPosition(pos);
            self.msg.push(`Disabling geolocation service.`);
            self.msg.push(`\t${error}`);
            self.emergency = true;
          }
        },
        self.positionOptions
      );
    },
    //#region Delete Marker code called by template
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

    getMapCenter() {
      return this.map ? this.map.getCenter() : null;
    },
    showMapCenter() {
      const latLng = this.getMapCenter();
      return latLng
        ? `${latLng.lat().toFixed(5)} X ${latLng.lng().toFixed(5)}`
        : '';
    },

    volunteer() {
      this.snackbarThanks = false;
      window.location =
        'mailto:mcorning@soteriaInstitute.org?subject=I want to help&body=I can help make Local Contact Tracing better by: [fill in the blank]';
    },
  },

  watch: {
    group() {
      this.drawer = false;
    },
    workplace() {
      this.saveSpecial();
    },
    shift() {
      this.saveSpecial();
    },
    ready() {
      const query = this.$route.query;

      this.savedMapCenter = this.defaultMapCenter;
      this.msg.push('Map component ready');
      if (query.place_id) {
        console.log('Detected a shared event:', query.place_id);
        this.setStatus(`Detected a shared event: ${query.place_id}`);
        this.setStatus(printJson(query) + '\n\n');
        // in space.js
        this.onSharePlace();
      }
      this.overlay = false;
    },
  },

  mounted() {
    const query = this.$route.query;

    this.sponsor = query.sponsor;
    this.emergency = query.d && query.d === '1';
    this.msg.push(`${this.emergency ? 'Enabled diagnostics' : ''}`);

    if (this.sponsor) {
      this.snackbarThanks = true;
      // TODO Microsoft is the only sponsor right now
      // so make position part of the querystring
      this.sponsorPosition = {
        coords: {
          lat: 47.64223080000001,
          lng: -122.1369332,
        },
      };
    }
    console.time('Mounted GoogleMaps');

    // TODO this is an EitherAsync
    gmapsInit()
      .then((google) => {
        const map = new google.maps.Map(this.$refs.map, {
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
            mapTypeIds: ['roadmap', 'terrain'],
            position: google.maps.ControlPosition.BOTTOM,
          },
          fullscreenControl: true,
          fullscreenControlOptions: {
            position: google.maps.ControlPosition.LEFT_BOTTOM,
          },
        });
        this.msg.push('0) Initialized google map');
        return { google, map };
      })
      .then(({ google, map }) => this.onMounted({ google, map }))
      .catch(() => {
        this.confirmationTitle = 'Oops. Trouble loading your map.';
        this.confirmationMessage =
          'If you are inside a building, you may not have internet connection. Try again outside.';
        this.confSnackbar = true;
        this.confBottom = true;
        this.msg.push(`gmapsInit().catch() ${this.confirmationTitle}`);
      })
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
  overflow-y: hidden;
}
.EmergencyW {
  width: 50vw;
  height: 88vh;
}
.EmergencyH {
  width: 100vw;
  height: 50vh;
}
</style>
