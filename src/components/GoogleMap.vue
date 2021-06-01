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
          <v-card-text>
            <v-text-field v-html="getStatus" readonly dense hide-details />
          </v-card-text>
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
      @place_changed="setPlace"
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
    getBounds() {
      return this.map.getBounds();
    },
    getStatus() {
      const msg = this.place
        ? `<small>Ready to proceed</small>`
        : '<small>No place reference available</small>';
      return msg;
    },

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

    // these are the addresses for the currently selected space (used by the InfoWindow select)
    // access the currently selected Place using the place_id
    addresses() {
      try {
        const { lat, lng, plus_code } = Place.getPosition(this.place.place_id);
        let x = [
          `Position:  ${lat.toFixed(6)} by ${lng.toFixed(6)}`,
          `Place ID:  ${this.place.place_id}`,
          `Plus_Code: ${plus_code}`,
        ];
        console.log('addresses:', x);
        return x;
      } catch (error) {
        return error;
      }
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
    //#region Place mutators
    /*
    There are seven ways to set a Place before marking a calendar with the Place.place_id:
      * Click a POI
      * Click on a blank space on the map (creates a Gathering)
      * Click on a marked place (a place visited previously)
      * Recent Visits list
      * Autocomplete input field
      * Geolocate button
      * From businessCard
    */

    // click the map (different than using Autocomplete (see setPlace()))
    // space is this.$event and includes the placeId (not place_id) string
    // (place_id is returned in the getDetails() result) and the latLng object
    addPlace(space) {
      /* From googlemaps docs:
          A place ID is a unique reference to a place on a Google Map.
          Place IDs are available for most locations, including
            businesses,
            landmarks,
            parks, and
            intersections.
      */
      if (space.placeId) {
        this.addPlaceWithID(space);
      } else {
        this.addGathering(space);
      }
    },

    addPlaceWithID(space) {
      console.log(highlight('Selected space:'), printJson(space));
      this.placesService.getDetails(
        {
          placeId: space.placeId,
          fields: this.options.fields,
        },
        (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            // getDetails() returns the place
            Place.updatePromise(place)
              .then((result) => this.openInfoWindowWithSelectedPlace(result[0]))
              .catch((err) => {
                this.throwError(
                  'GoogleMap.addPlaceWithID(space).Place.updatePromise(place)',
                  err
                );
              });
          } else {
            this.throwError('GoogleMap.addPlaceWithID(space)', status);
          }
        }
      );
    },

    addGathering(space) {
      try {
        // But if you don't click on one of those listed points of interest above, you don't have a placeId...yet.
        // geocode could take the space.latLng class instance, but for broad consistency,
        // we use the latLng literal because we can't conveniently serialize functions
        this.geocoder.geocode({ location: space.latLng }, (results, status) => {
          if (status === 'OK') {
            // results array provides different levels of address details;
            // we use the first element in the array.
            // note: name will be empty because the spot is...well, nameless.
            // Vistor provides the name using the InfoWindow.
            // geocode results do include the place_id, even for a spot not otherwise noteworthy
            space = results[0];
            console.log('Non-POI (spot) results:', printJson(space));

            // Place.updatePromise() returns all affected places
            // (of which there is always only one)
            Place.updatePromise(space)
              .then((places) => this.openInfoWindowWithSelectedPlace(places[0]))
              .catch((err) => {
                this.throwError(
                  'GoogleMap.addGathering(space).Place.updatePromise(space)',
                  err
                );
              });
          } else {
            this.throwError('GoogleMap.addGathering(space).geocode()', status);
          }
        });
      } catch (err) {
        this.throwError('GoogleMap.addGathering(space)', err);
      }
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

    // called when adding a Gathering
    updateName(name) {
      Place.updateFieldPromise(this.place.place_id, { name: name })
        .then((p) => {
          console.log(highlight('Updated place'), printJson(p));
          this.place = p;
        })
        .catch((err) => {
          this.throwError('GoogleMap.updateName(name)', err);
        });
    },

    openInfoWindowWithSelectedPlace(place) {
      try {
        this.drawer = false;
        this.place = place;
        console.log('Selected Place:', printJson(this.place));
        const { lat, lng } = Place.getPosition(this.place.place_id);

        this.center = { lat, lng };

        this.placeMap.set(this.place.place_id, this.place);
        this.infoWindowPos = this.center;
        this.infoWinOpen = true;
      } catch (err) {
        this.throwError(
          'GoogleMap.openInfoWindowWithSelectedPlace(place)',
          err
        );
      }
    },

    // handled when component calls $autocomplete.getPlace()
    setPlace(place) {
      if (!place.geometry || !place.geometry.location) {
        // User entered the name of a Place that was not suggested and
        // pressed the Enter key, or the Place Details request failed.
        this.needInput = true;
        return;
      }
      Place.updatePromise(place)
        .then((places) => this.openInfoWindowWithSelectedPlace(places[0]))
        .catch((err) => {
          this.throwError('GoogleMap.setPlace(place)', err);
        });
      // If the place has a geometry, then present it on a map.
      // if (place.geometry.viewport) {
      //   this.map.fitBounds(place.geometry.viewport);
      // } else {
      //   this.map.setCenter(place.geometry.location);
      // }
    },

    //#endregion Place mutators

    // called by
    //  * onGo() with the shift startTime
    //  * mark your calendar button
    addVisit(nativeEvent, startTime = Date.now(), endTime, stay) {
      console.log('Start Time:', startTime.toString());
      this.$emit('addedPlace', {
        ...this.place,
        plus_code: Place.getPosition(this.place.place_id).plus_code,
        startTime: startTime,
        endtime: endTime,
        stay: stay,
      });
    },

    // businessCard go event handler
    onGo(data) {
      console.log(data);
      this.dialog = false;
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
      // we are calling a click handler here,
      // so set first arg to null since we don't have a nativeEvent to pass
      this.addVisit(null, startTime, endTime, stay.milliseconds);
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

    //#region functions that depend on Place
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
            if (!visit.place_id) {
              // these are appointments not visits
              return;
            }
            const place = this.place_map.get(visit.place_id);
            // if visit and place are not related, notify and skip further processing
            if (!place) {
              alert(
                `Visit ${visit.id} does not have a Place corresponding to ${visit.place_id}`
              );
              return;
            }

            console.log('Using place:', printJson(place));
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
      } catch (err) {
        this.throwError('GoogleMap.deserializeVisitAsMarker(visits)', err);
      }
    },
    //#endregion Methods for mount()

    throwError(source, err) {
      console.log(error(printJson(err)));
      this.$emit('error', {
        source: source,
        error: err,
      });
    },
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

    Promise.all([self.mapPromise, self.visitsPromise, self.placePromise])
      .then((results) => {
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
      })
      .catch((err) => this.throwError('GoogleMap.mounted()', err));
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
