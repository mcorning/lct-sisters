<template>
  <v-sheet class="fill-height position:absolute">
    <ConfirmModernDialog
      id="ConfirmModernDialogId"
      ref="ConfirmModernDialog"
      :customOptions="customOptions"
    />
    <!-- Recent Visits -->
    <v-navigation-drawer v-model="drawer" absolute temporary>
      <v-list-item>
        <v-list-item-avatar>
          <v-img :src="getAvatar()"></v-img>
        </v-list-item-avatar>

        <v-list-item-content>
          <v-list-item-title
            ><strong>{{ username }}'s</strong> Recent Visits</v-list-item-title
          >
        </v-list-item-content>
      </v-list-item>
      <v-card-text>Click outside this box to use Map</v-card-text>

      <v-divider></v-divider>

      <!-- consider replacing list with select and use obects instead of arrays for items -->
      <v-list dense nav>
        <v-list-item-group v-model="recent" mandatory color="primary">
          <v-list-item
            v-for="place in places"
            :key="place.name"
            link
            :value="place"
            @click="openInfoWindowWithSelectedPlace(place)"
          >
            <v-list-item-icon>
              <v-icon>{{ getIcon(place) }}</v-icon>
            </v-list-item-icon>

            <v-list-item-content>
              <v-list-item-title>{{ place.name }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-item-group>
      </v-list>
    </v-navigation-drawer>

    <GmapMap
      :center="center"
      :zoom="zoom"
      :style="mapSize"
      ref="mapRef"
      @click="addPlace($event)"
    >
      <GmapInfoWindow
        :options="infoOptions"
        :position="infoWindowPos"
        :opened="infoWinOpen"
        @closeclick="infoWinOpen = false"
      >
        <v-card v-if="place">
          <h3 class="headline">
            <v-text-field
              v-if="!place.name || place.name === 'Here'"
              @change="updateName"
              dense
              hide-details
              placeholder="Give this gathering a name"
              autofocus
            ></v-text-field>
            <span v-else> {{ place.name }} </span>
          </h3>
          <v-card-subtitle class="pb-0">{{
            place.formatted_address
          }}</v-card-subtitle>
          <v-card-text>
            <v-select :items="addresses" dense label="Coordinates"></v-select>
          </v-card-text>
          <v-card-actions v-if="place.name" class="pb-1">
            <businessCard :name="place.name" @go="onGo"></businessCard>
            <v-spacer></v-spacer>

            <v-tooltip bottom>
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  v-bind="attrs"
                  v-on="on"
                  color="primary"
                  fab
                  dark
                  @click="addVisit"
                >
                  <v-icon>mdi-calendar</v-icon>
                </v-btn>
              </template>
              <span>Mark your calendar with a Visit</span></v-tooltip
            >
          </v-card-actions>
        </v-card>
      </GmapInfoWindow>
      <GmapMarker
        :key="index"
        v-for="(m, index) in markers"
        :position="m.position"
        :draggable="true"
        @click="getMarker(m, index)"
        >{{ m.title }}
      </GmapMarker>
    </GmapMap>

    <GmapAutocomplete
      class="pl-3"
      @place_changed="openInfoWindowWithSelectedPlace"
      auto-select-first
      :options="options"
      style="
        width: 100%;
        border: orange;
        border-width: 2px;
        border-style: solid;
      "
    >
    </GmapAutocomplete>
    <v-banner v-if="needInput" single-line transition="slide-y-transition">
      No details available for input value. Be sure you select the location from
      the dropdown.
      <template v-slot:actions="{ dismiss }">
        <v-btn text color="primary" @click="dismiss">Dismiss</v-btn>
      </template>
    </v-banner>
  </v-sheet>
</template>

<script>
// See https://github.com/xkjyeah/vue-google-maps

import Visit from '@/models/Visit';
import Place from '@/models/Place';

import {
  error,
  highlight,
  success,
  warn,
  getRandomIntInclusive,
  printJson,
} from '../utils/colors';
import { DateTime } from '../utils/luxonHelpers';

export default {
  // see main.js for vue2-google-maps instantiation
  name: 'GoogleMap',

  components: {
    ConfirmModernDialog: () => import('./cards/dialogCardModern'),
    businessCard: () => import('./cards/businessCard'),
  },

  computed: {
    places() {
      const p = Place.query()
        .where('name', (v) => v) // ignore places without names (if any)
        .orderBy('name')
        .get();

      return p;
    },

    markers() {
      const m = this.markersMap ? Array.from(this.markersMap.values()) : [];
      return m;
    },

    translatedPosition() {
      const lat = this.place.lat || this.place.geometry.location.lat() || 0;
      const lng = this.place.lng || this.place.geometry.location.lng() || 0;
      const plus_code =
        this.place.plus_code?.global_code ||
        this.place.plus_code ||
        'not available';
      return { lat, lng, plus_code };
    },

    // these are the addresses for the currently selected space (used by the InfoWindow select)
    // access the currently selected Place using the place_id
    addresses() {
      const { lat, lng, plus_code } = this.translatedPosition;
      let x = [
        `Position:  ${lat.toFixed(6)} by ${lng.toFixed(6)}`,
        `Place ID:  ${this.place.place_id}`,
        `Plus_Code: ${plus_code}`,
      ];
      console.log('addresses:', x);
      return x;
    },

    ConfirmModernDialog() {
      return this.$refs.ConfirmModernDialog;
    },

    username() {
      return localStorage.getItem('username');
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

    // promises
    mapPromise() {
      return this.$refs.mapRef.$mapPromise;
    },
    visitsPromise() {
      return Visit.$fetch();
    },
    placePromise() {
      return Place.$fetch();
    },
  },

  data() {
    return {
      drawer: false,

      place: null,
      customOptions: {
        buttons: [
          { label: "Don't Save" },
          { label: 'Cancel', agree: 0 },
          {
            label: 'Save',
            color: 'secondary',
            outlined: true,
            agree: 1,
          },
        ],
      },

      placeMap: new Map(),
      minimalMarkers: new Map(),
      markersMap: null, // initialize as null so markers computed property works properly
      gender: ['men', 'women'],
      needInput: false,
      marker: null,
      mapSize: '',
      visits: null,
      recent: false,
      loading: true,

      markersData: [],
      edit: true,
      infoWindowLatLang: null,
      currLoc: '',
      map: null,
      infoWindowPos: null,
      infoWinOpen: false,
      currentMidx: null,

      //optional: offset infowindow so it visually sits nicely on top of our marker
      infoOptions: {
        pixelOffset: {
          width: 0,
          height: -35,
        },
      },
      infoTitle: 'Visit',
      content: 'Default info',
      zoom: 15,
      center: null,
      // places: [],
      placeName: '',
      lastId: 1,
      ifw: true,
      ifw2text: '',

      geocoder: null,
      placesService: null,
      LatLngBounds: { north: 45, south: 45.5, west: -122.0, east: -121.0 }, // get definition from Google
      GeocoderComponentRestrictions: {}, // get definition from Google

      // not used currently:
      geocoderRequest: {
        address: 'Sisters+OR',
        location: null, //{}, //{ lat: 0, lng: 0 },
        place_id: '',
        bounds: null, //, //LatLngBounds,
        componentRestrictions: this.GeocoderComponentRestrictions,
        region: '',
      },
    };
  },

  methods: {
    // businessCard go event handler
    onGo(data) {
      console.log(data);
      this.dialog = false;
      this.$emit('connectMe');
      const openAt = (data.time1 || localStorage.getItem('openAt')).split(':');
      const closeAt = (data.time2 || localStorage.getItem('closeAt')).split(
        ':'
      );

      const startTime = DateTime.fromObject({
        hour: openAt[0] / 1,
        minute: openAt[1] / 1,
      });
      const endTime = DateTime.fromObject({
        hour: closeAt[0] / 1,
        minute: closeAt[1] / 1,
      });
      const stay = endTime.diff(startTime);

      console.log(`onGo() startTime: ${startTime.toString()} `);

      console.log(`onGo() endTime:  ${endTime.toString()}`);
      console.log(`onGo() startTime/stay: ${startTime}`, printJson(stay));
      // we hare calling a click handler here, so set first arg to null since we don't have a nativeEvent to pass
      this.addVisit(null, startTime, stay.milliseconds);
    },

    getIcon() {
      return 'mdi-account-group';
    },

    getAvatar() {
      const gender = this.gender[getRandomIntInclusive(0, 1)];
      const id = getRandomIntInclusive(1, 99);
      const avatar = `https://randomuser.me/api/portraits/${gender}/${id}.jpg`;
      return avatar;
    },

    // click on a marker
    getMarker(marker) {
      if (marker != this.marker) {
        this.infoWinOpen = false;
      }
      this.marker = marker;
      this.place = Place.find(marker.place_id);
      this.infoWindowPos = marker.position;
      this.infoWinOpen = true;
    },

    // called by onGo() with the shift start time
    addVisit(nativeEvent, startTime = Date.now(), stay) {
      console.log('Start Time:', startTime.toString());
      this.$emit('addedPlace', {
        ...this.place,
        plus_code: this.place.plus_code.global_code,
        startTime: startTime,
        stay: stay,
      });
    },

    updateName(name) {
      Place.updateFieldPromise(this.place.place_id, { name: name })
        .then((p) => {
          console.log(highlight('Updated place'), printJson(p));
          this.place = p;
        })
        .catch((error) => {
          this.$emit('error', error);
        });
    },

    // handled when component calls $autocomplete.getPlace()
    setPlace(place) {
      if (!place.geometry || !place.geometry.location) {
        // User entered the name of a Place that was not suggested and
        // pressed the Enter key, or the Place Details request failed.

        this.needInput = true;
        return;
      }

      // If the place has a geometry, then present it on a map.
      if (place.geometry.viewport) {
        this.map.fitBounds(place.geometry.viewport);
      } else {
        this.map.setCenter(place.geometry.location);
      }
    },

    openInfoWindowWithSelectedPlace(place) {
      try {
        this.drawer = false;
        this.place = place;
        console.log('Updated Place:', printJson(this.place));
        const { lat, lng } = this.translatedPosition;

        const protoMarker = {
          position: { lat, lng },
        };
        console.log(printJson(protoMarker.position));
        this.placeMap.set(this.place.place_id, this.place);
        this.infoWindowPos = protoMarker.position;
        this.infoWinOpen = true;
      } catch (error) {
        this.$emit('error', error);
      }
    },

    // click the map (different than using Autocomplete (see setPlace()))
    // space is this.$event and includes the placeId (not place_id) string (place_id is returned in the getDetails() result)
    // and the latLng object
    addPlace(space) {
      try {
        // since we serialize strings, we convert the latLng class into the latLng literal
        const latLng = {
          lat: space.lat || space.latLng.lat(),
          lng: space.lng || space.latLng.lng(),
        };
        console.log(highlight('Selected space:'), printJson(space));
        /* From googlemaps docs:
          A place ID is a unique reference to a place on a Google Map.
          Place IDs are available for most locations, including
            businesses,
            landmarks,
            parks, and
            intersections.
      */
        if (space.placeId) {
          this.placesService.getDetails(
            {
              placeId: space.placeId,
              fields: [
                'name',
                'formatted_address',
                'place_id',
                'geometry',
                'plus_code',
              ],
            },
            (place, status) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                Place.updatePromise(place)
                  .then((result) =>
                    this.openInfoWindowWithSelectedPlace(result[0])
                  )
                  .catch((err) => {
                    console.log(error(err));
                    this.$emit('error', err);
                  });
              } else {
                console.log('Error:', status);
              }
            }
          );
        } else {
          // But if you don't click on one of those listed points of interest above, you don't have a placeId...yet.
          // geocode could take the space.latLng class instance, but for broad consistency,
          // we use the latLng literal because we can't conveniently serialize functions
          this.geocoder.geocode({ location: latLng }, (results, status) => {
            if (status === 'OK') {
              // results array provides different levels of address details. we use the first element in the array
              const {
                name,
                formatted_address,
                place_id,
                geometry,
                plus_code,
              } = results[0];

              // note name will be empty because the spot is...well, nameless. Vistor provides the name using the InfoWindow.
              const spot = {
                name,
                formatted_address,
                place_id,
                geometry,
                plus_code,
              };
              // geocode results do include the place_id, even for a spot not otherwise noteworthy
              console.log('Non-POI (spot) results:', printJson(spot));

              // Place.updatePromise() returns all affected places (of which there is always only one)
              Place.updatePromise(spot)
                .then((result) =>
                  this.openInfoWindowWithSelectedPlace(result[0])
                )
                .catch((err) => {
                  console.log(error(err));
                  this.$emit('error', err);
                });
            } else {
              console.log('Error:', status);
            }
          });
        }
        this.center = latLng;
      } catch (error) {
        this.$emit('error', error);
      }
    },

    //#region Methods for mount()
    setUpGeolocation(map) {
      const infoWindow = new window.google.maps.InfoWindow();

      const locationButton = document.createElement('button');
      const icon = document.createElement('i');
      icon.className = 'mdi mdi-target';
      locationButton.appendChild(icon);
      locationButton.title = 'Find Me';
      locationButton.classList.add('custom-map-control-button-icon');

      locationButton.addEventListener('click', () => {
        // Try HTML5 geolocation.
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              };
              this.addPlace(pos);
            },
            () => {
              this.handleLocationError(true, infoWindow, map.getCenter());
            }
          );
        } else {
          // Browser doesn't support Geolocation
          this.handleLocationError(false, infoWindow, map.getCenter());
        }
      });
      map.controls[window.google.maps.ControlPosition.RIGHT_TOP].push(
        locationButton
      );
    },

    setUpRecentVisits(map) {
      const recentVisitsButton = document.createElement('button');
      // <button class="btn"><i class="fa fa-target"></i></button>
      recentVisitsButton.textContent = 'Recent Visits';
      recentVisitsButton.classList.add('custom-map-control-button');
      recentVisitsButton.title = 'Sorted set of past visits';
      recentVisitsButton.addEventListener('click', () => {
        this.drawer = !this.drawer;
      });
      map.controls[window.google.maps.ControlPosition.LEFT_BOTTOM].push(
        recentVisitsButton
      );
    },

    handleLocationError(browserHasGeolocation, infoWindow, pos) {
      infoWindow.setPosition(pos);
      infoWindow.setContent(
        browserHasGeolocation
          ? 'Error: The Geolocation service failed.'
          : "Error: Your browser doesn't support geolocation."
      );
      infoWindow.open(this.map);
    },

    showMap(map) {
      this.setUpRecentVisits(map);
      this.setUpGeolocation(map);
      return map;
    },

    getAssets(map) {
      this.$gmapApiPromiseLazy().then(() => {
        this.geocoder = new window.google.maps.Geocoder();
        this.placesService = new window.google.maps.places.PlacesService(map);
      });
    },

    deserializeVisitAsMarker(visits) {
      try {
        this.place_map = Place.getPlaceMap();
        this.markersMap = new Map();
        console.groupCollapsed(
          warn(
            `deserializeVisitAsMarker(visits) making ${visits.length} markers:`
          )
        );
        if (visits) {
          this.visitSet = new Set(visits);
          visits.forEach((visit, index) => {
            const place = this.place_map.get(visit.place_id);
            console.log('using place:', printJson(place));
            let m = {
              title: visit.name,
              label: { text: 'V' + index, color: 'white' },
              name: visit.name,
              place_id: visit.place_id,
              position: { lat: place.lat, lng: place.lng },
            };
            this.markersMap.set(visit.name, m);
            this.$emit('log', `added marker for ${visit.name}`);
          });
          console.groupEnd();
        }
      } catch (error) {
        this.$emit('error', error);
      }
    },
    //#endregion Methods for mount()
  },

  watch: {},

  created() {
    // do this before GoogleMap component is finished instantiating
    this.center = {
      lat: parseFloat(process.env.VUE_APP_LAT),
      lng: parseFloat(process.env.VUE_APP_LNG),
    };
  },

  mounted() {
    const self = this;
    console.groupCollapsed('Mounting GoogleMap');
    const bp = self.$vuetify.breakpoint;
    console.log(bp.name, bp.height);
    const x = bp.height;
    const y = 175;
    self.mapSize = `width: 100%; height: ${x - y}px`;
    console.log('mapSize:', self.mapSize);
    console.groupEnd();

    Promise.all([self.mapPromise, self.visitsPromise, self.placePromise]).then(
      (results) => {
        const map = results[0];
        const visits = results[1].visits;
        self.showMap(map);
        self.getAssets(map);

        // we don't use results[2] here,
        // but the promise resolved with fetched Place records used next
        if (visits) {
          self.deserializeVisitAsMarker(visits, map);
        }
        this.map = map;

        // not sure we need this...
        this.recent = true;
        console.log(success('GoogleMap loaded successfully'));
      }
    );
  },
};
</script>
<style>
.custom-map-control-button-icon {
  background-color: #d500f9;
  border: none;
  color: white;
  padding: 5px 5px;
  margin: 10px;
  font-size: 24px;
  width: 40px;
  cursor: pointer;
}
.custom-map-control-button {
  background-color: #d500f9;
  border: none;
  color: white;
  padding: 10px 10px;
  margin: 10px;
  font-size: 18px;
  cursor: pointer;
}

/* Darker background on mouse-over */
.custom-map-control-button-icon:hover {
  background-color: #aa00ff;
}

.custom-map-control-button:hover {
  background-color: #aa00ff;
}
</style>
