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
          <v-list-item-title>{{ username }}'s Recent Visits</v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-divider></v-divider>

      <!-- consider replacing list with select and use obects instead of arrays for items -->
      <v-list dense nav>
        <v-list-item-group v-model="recent" mandatory color="primary">
          <v-list-item
            v-for="visit in getFavoriteVisits"
            :key="visit.name"
            link
            :value="visit"
            @click="goRecent(visit)"
          >
            <v-list-item-icon>
              <v-icon>{{ getIcon(visit) }}</v-icon>
            </v-list-item-icon>

            <v-list-item-content>
              <v-list-item-title>{{ visit[0] }}</v-list-item-title>
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
        @closeclick="removeMarker"
      >
        <v-card v-if="place">
          <v-card-title class="mt-0 pt-0">
            <v-text-field
              v-if="!place.name || place.name === 'Here'"
              @change="updateName"
              dense
              hide-details
              placeholder="Give this gathering a name"
            ></v-text-field>
            <span v-else> {{ place.name }} </span>
          </v-card-title>
          <v-card-subtitle class="pb-0">{{ place.address }}</v-card-subtitle>

          <v-select :items="addresses" dense label="Coordinates"></v-select>

          <v-card-actions class="pb-1">
            <v-tooltip top>
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  fab
                  v-bind="attrs"
                  v-on="on"
                  dark
                  color="orange"
                  @click="removeMarker"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
              <span>Remove marker</span></v-tooltip
            >
            <v-spacer></v-spacer>
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
        :draggable="false"
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
import crypto from 'crypto';
const randomId = () => crypto.randomBytes(8).toString('hex');

import Visit from '@/models/Visit';
import Place from '@/models/Place';

import {
  error,
  highlight,
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
    addresses() {
      return [
        `Position:  ${this.place.lat.toFixed(6)} by ${this.place.lng.toFixed(
          6
        )}`,
        `Plus_Code: ${this.place.plusCode}`,
        `Place ID:  ${this.place.placeId}`,
      ];
    },

    ConfirmModernDialog() {
      return this.$refs.ConfirmModernDialog;
    },

    InfoWinContent() {
      return this.place ? this.place : '';
    },

    visitMap() {
      const map =
        this.visits && this.visits.length
          ? this.visits.reduce((a, c) => {
              a.set(c.name, { lat: c.lat, lng: c.lng });
              return a;
            }, new Map())
          : [];
      return map;
    },

    getFavoriteVisits() {
      return [...this.visitMap];
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

    infowindow() {
      const x = new window.google.maps.InfoWindow({ content: this.content });
      return x;
    },
    mapPromise() {
      return this.$refs.mapRef.$mapPromise;
    },
  },

  data() {
    return {
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
      // promises

      visitsPromise: Visit.$fetch(),
      placePromise: Place.$fetch(),

      minimalMarkers: new Map(),
      markers: [],
      markersMap: new Map(),
      markersDataMap: new Map(),
      gender: ['men', 'women'],
      needInput: false,
      marker: null,
      mapSize: '',
      visits: null,
      recent: '',
      loading: true,
      drawer: null,

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
      places: [],
      placeName: '',
      lastId: 1,
      ifw: true,
      ifw2text: '',

      geocoder: null,
      placesService: null,
      LatLngBounds: { north: 45, south: 45.5, west: -122.0, east: -121.0 }, // get definition from Google
      GeocoderComponentRestrictions: {}, // get definition from Google
      geocoderRequest: {
        address: 'Sisters+OR',
        location: null, //{}, //{ lat: 0, lng: 0 },
        placeId: '',
        bounds: null, //, //LatLngBounds,
        componentRestrictions: this.GeocoderComponentRestrictions,
        region: '',
      },
    };
  },

  methods: {
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

    toggleInfoWindow(marker, idx) {
      this.infoWindowPos = marker.position;

      //check if its the same marker that was selected if yes toggle
      if (this.currentMidx == idx) {
        this.infoWinOpen = !this.infoWinOpen;
      }
      //if different marker set infowindow to open and reset current marker index
      else {
        this.infoWinOpen = true;
        this.currentMidx = idx;
      }
    },

    // click on a marker
    getMarker(marker, idx) {
      if (marker != this.marker) {
        this.infoWinOpen = false;
      }
      this.marker = marker;
      this.currentMidx = idx;
      this.toggleInfoWindow(marker, idx);
    },

    addMarker(data) {
      const { title, name, address, placeId, position, plus_code } = data;

      const markerData = {
        // for tooltips and visible marker labels
        title: title, // "Place" or "Gathering"
        label: { text: 'V' + this.markersDataMap.size, color: 'white' }, // label is assigned a value before

        // to cache place data for logging
        // displayed in map and sent to Calendar
        name, // POI name or name given by Visitor
        position, // Latitude and Longitude of space or place
        // displayed in map
        address, // Address or Plus_Code of public space
        placeId, // For known places, a unique identifier
        plus_code, // unique global address (shorter than placeId)
      };
      const icon = {
        path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
        scale: 5,
      };
      this.marker = new window.google.maps.Marker(markerData);
      this.marker.setDraggable(true);
      this.marker.setMap(this.map);
      this.marker.setIcon(icon);
      this.markersDataMap.set(name, markerData);
      console.log(warn('Caching new marker'));
      console.log(printJson([...this.markersDataMap]), '\n');
      // TODO use markersMap for this
      // localStorage.setItem(
      //   'markersDataMap',
      //   JSON.stringify([...this.markersDataMap])
      // );
      this.toggleInfoWindow(this.marker);
    },

    removeMarker() {
      console.log(this.marker);
      console.log(
        `Removed ${this.marker.name} from markersMap`,
        this.markersMap.delete(this.marker.name)
      );
      localStorage.setItem('markersMap', [...this.markersMap]);
      this.marker.setMap(null);
      this.marker = null;
      this.infoWinOpen = false;
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
      this.addMarker({
        title: 'Place',
        label: place.name,
        name: place.name,
        address: place.formatted_address,
        plus_code: place.plus_code?.global_code,
        placeId: place.place_id,
        position: place.geometry.location,
      });
    },

    geolocate: function() {
      navigator.geolocation.getCurrentPosition((position) => {
        this.center = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
      });
    },

    // called by onGo() with the shift start time
    addVisit(nativeEvent, startTime = Date.now(), stay) {
      const { name, placeId, position } = this.marker;
      console.log('Start Time:', startTime.toString());
      // position can be lat() and lng functions, or they can be values.
      // we want values
      const lat =
        typeof position.lat === 'function' ? position.lat() : position.lat;
      const lng =
        typeof position.lng === 'function' ? position.lng() : position.lng;

      this.$emit('addedPlace', {
        name,
        placeId,
        lat: lat,
        lng: lng,
        startTime: startTime,
        stay: stay,
      });
    },

    recentsControl(controlDiv) {
      // Set CSS for the control border.
      const controlUI = document.createElement('div');
      controlUI.style.cursor = 'pointer';
      controlUI.style.textAlign = 'center';
      controlUI.title = 'Set of recent visits sorted by name';
      controlUI.classList.add('custom-map-control-button');
      controlDiv.appendChild(controlUI);
      // Set CSS for the control interior.
      const controlText = document.createElement('div');
      controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
      controlText.style.fontSize = '16px';
      controlText.style.fontWeight = '300';
      controlText.style.lineHeight = '38px';
      controlText.style.paddingLeft = '5px';
      controlText.style.paddingRight = '5px';
      controlText.innerHTML = 'See Recent Visits';
      controlUI.appendChild(controlText);
      // Setup the click event listeners: it talks to Vue, not the map.
      controlUI.addEventListener('click', () => {
        this.drawer = !this.drawer;
      });
    },

    // alternative to Google documentation
    geolocateControl(controlDiv, map) {
      // Set CSS for the control border.
      const controlUI = document.createElement('div');
      controlUI.style.backgroundColor = '#fff';
      controlUI.style.border = '3px solid #fff';
      controlUI.style.borderRadius = '3px';
      controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
      controlUI.style.cursor = 'pointer';
      controlUI.style.marginTop = '8px';
      controlUI.style.marginBottom = '22px';
      controlUI.style.textAlign = 'center';
      controlUI.title = 'Find me';
      controlUI.classList.add('custom-map-control-button');
      controlDiv.appendChild(controlUI);

      // Set CSS for the control interior.
      const controlText = document.createElement('div');
      controlText.style.color = 'rgb(25,25,25)';
      controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
      controlText.style.fontSize = '16px';
      controlText.style.fontWeight = '200';
      controlText.style.lineHeight = '38px';
      controlText.style.paddingLeft = '5px';
      controlText.style.paddingRight = '5px';
      controlText.innerHTML = 'See Recent Visits';
      controlUI.appendChild(controlText);
      // Setup the click event listeners: it talks to Vue, not the map.
      const infoWindow = new window.google.maps.InfoWindow();
      controlUI.addEventListener('click', () => {
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
    },

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
      // const recentsControlDiv = document.createElement('div');
      // this.recentsControl(recentsControlDiv);
      // map.controls[window.google.maps.ControlPosition.LEFT_BOTTOM].push(
      //   recentsControlDiv
      // );
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

    goRecent(val) {
      // TODO replace this with code working from markers array
      this.marker = this.markersDataMap.get(val[0]);
      if (!this.marker) {
        alert(
          `The marker for ${val[0]} is missing. Please mark your map again, and use the marker to mark your calendar.`
        );
        return;
      }

      const question = `Mark your calendar with ${val[0]}?`;
      const consequences =
        'This will add an event to your calendar and a marker to your map.';
      const icon = 'mdi-question';

      this.ConfirmModernDialog.open(question, consequences, {
        icon: icon,
      }).then((act) => {
        if (act) {
          console.log(printJson(printJson(this.marker)));
          this.addVisit();
        }
      });
    },

    getIcon() {
      return 'mdi-account-group';
    },

    updateName(name) {
      this.marker.name = name;
      console.log(
        highlight('markersDataMap'),
        JSON.stringify([...this.markersDataMap], null, 3)
      );

      localStorage.setItem(
        'markersDataMap',
        JSON.stringify([...this.markersDataMap])
      );
    },

    getAvatar() {
      const gender = this.gender[getRandomIntInclusive(0, 1)];
      const id = getRandomIntInclusive(1, 99);
      const avatar = `https://randomuser.me/api/portraits/${gender}/${id}.jpg`;
      return avatar;
    },

    makeMarker(visit, map) {
      return new window.google.maps.Marker({
        title: visit.name,
        label: { text: 'V', color: 'white' },

        name: visit.name,
        position: { lat: visit.lat, lng: visit.lng },
        placeId: visit.placeId,

        map: map,
      });
    },

    deserializeVisitAsMarker(visits, map) {
      let visitMarkerMap = new Map();
      visits.forEach((visit) => {
        let m = this.makeMarker(visit, map);
        visitMarkerMap.set(visit.name, m);
      });
      return visitMarkerMap;
    },

    getVisits() {
      Visit.$fetch().then((all) => {
        console.log(
          'Populating Recent Visits with',
          all.visits?.length || 0,
          'visits'
        );
        this.visits = all.visits;
        this.resolve(all.visits);
      });
      return new Promise((resolve, reject) => {
        this.resolve = resolve;
        this.reject = reject;
      });
    },

    // click the map, mark the place, get a marker there
    // space is this.$event (and includes the placeId string and the latLng object)
    addPlace(space) {
      this.center = space.latLng;
      console.log(highlight('Selected space:'), printJson(space));
      // this.getSpaceDetails(space);
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
            if (
              status === window.google.maps.places.PlacesServiceStatus.OK &&
              place &&
              place.geometry &&
              place.geometry.location
            ) {
              const position = place.geometry.location;

              Place.updatePromise({
                id: randomId(),
                name: place.name,
                address: place.formatted_address,
                placeId: place.place_id,
                plusCode: place.plus_code.global_code,
                lat: position.lat(),
                lng: position.lng(),
              })
                .then((result) => {
                  this.place = result[0];
                  console.log('Updated Place:', printJson(this.place));
                  const protoMarker = {
                    position: { lat: this.place.lat, lng: this.place.lng },
                  };
                  this.toggleInfoWindow(protoMarker);
                })
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
        const latLng = {
          lat: space.lat || space.latLng.lat(),
          lng: space.lng || space.latLng.lng(),
        };
        this.geocoder.geocode({ location: latLng }, (results, status) => {
          if (status === 'OK') {
            const spot = results[0];
            console.log('Spot', printJson(spot));
            const position = spot.geometry.location;

            this.addMarker({
              title: 'A spot',
              name: spot.name || 'Here',
              address: spot.formatted_address,
              plus_code: spot.plus_code?.global_code, // sometimes plus_code is undefined (check Spot debug spew above)
              placeId: spot.place_id,
              position: position,
            });
            console.log(results);
          } else {
            console.log('Error:', status);
          }
        });
      }
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
    console.log(self.getAvatar());
    const bp = self.$vuetify.breakpoint;
    console.log(bp.name, bp.height);
    const x = bp.height;
    const y = 175;
    self.mapSize = `width: 100%; height: ${x - y}px`;
    console.log('mapSize:', self.mapSize);

    Promise.all([self.mapPromise, self.visitsPromise, self.placePromise]).then(
      (results) => {
        const map = results[0];
        const visits = results[1].visits;
        const places = results[2].places;
        console.log('places:', places);
        self.showMap(map);
        const markersMap = self.deserializeVisitAsMarker(visits, map);
        self.markers = Array.from(markersMap.values());
        self.getAssets(map);

        this.map = map;
        this.markersMap = markersMap;
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
