<template>
  <!-- Step 2: include all and only properties from State render() function... -->
  <div>
    <!-- Recent Visits -->
    <v-navigation-drawer v-model="drawer" absolute temporary>
      <v-list-item>
        <v-list-item-avatar>
          <v-img :src="getAvatar()"></v-img>
        </v-list-item-avatar>

        <v-list-item-content>
          <v-list-item-title>
            <!-- <strong>{{ state.settings.username }}'s</strong> -->
            Recent Visits</v-list-item-title
          >
        </v-list-item-content>
      </v-list-item>
      <v-card-text>Click outside this box to use Map</v-card-text>

      <v-divider></v-divider>
      <!-- consider replacing list with select and use obects instead of arrays for items -->
      <v-list dense nav slot-scope="{ state }">
        <v-list-item-group v-model="recent" mandatory color="primary">
          <v-list-item
            v-for="place in state.places"
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
      @click="
        addPlace({ placesService, fields: options.fields, place: $event })
      "
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
            <!-- <State> -->
            <div slot-scope="{ state }">
              <businessCard
                :settings="state.settings"
                @go="onGo"
              ></businessCard>
            </div>
            <!-- </State> -->
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
        >{{ m.title }}
      </GmapMarker>
    </GmapMap>
  </div>
</template>

<script>
import { gmapApi } from 'vue2-google-maps';

import { highlight, getRandomIntInclusive, printJson } from '../utils/helpers';
// import { DateTime } from '../utils/luxonHelpers';

export default {
  name: 'GoogleMap',
  components: {},
  computed: {
    google: gmapApi,

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

    mapRef() {
      return this.$refs.mapRef;
    },

    geocoder() {
      return new this.google.maps.Geocoder();
    },

    markers() {
      const m = this.markersMap ? Array.from(this.markersMap.values()) : [];
      return m;
    },

    addresses() {
      try {
        const { lat, lng, plus_code, place_id } = this.place;
        let x = [
          `Position:  ${lat.toFixed(6)} by ${lng.toFixed(6)}`,
          `Place ID:  ${place_id}`,
          `Plus_Code: ${plus_code}`,
        ];
        console.log('addresses:', x);
        return x;
      } catch (error) {
        return error;
      }
    },
    getStatus() {
      const msg = this.place
        ? `<small>Ready to proceed</small>`
        : '<small>No place reference available</small>';
      return msg;
    },
  },

  data() {
    return {
      ready: false,
      drawer: false,
      recent: false,

      gender: ['men', 'women'],

      center: null,
      zoom: 15,
      mapSize: '',

      //optional: offset infowindow so it visually sits nicely on top of our marker
      infoOptions: {
        pixelOffset: {
          width: 0,
          height: -35,
        },
      },
      infoWindowPos: null,
      infoWinOpen: false,

      map: null,
      placesService: null,
      place: null,
      placeMap: new Map(),
      markersMap: null, // initialize as null so markers computed property works properly
    };
  },
  methods: {
    addPlace() {
      console.log('TODO: get rid of this');
    },
    onStateAvailable(f) {
      console.log('onStateAvailable for all components');
      console.log(f({ action: 'test' }));
    },
    onCacheUpdated(space) {
      this.openInfoWindowWithSelectedPlace(space);
    },
    // called by
    //  * onGo() with the shift startTime
    //  * mark your calendar button
    addVisit(nativeEvent, startTime = Date.now(), endTime, shift) {
      console.log('Start Time:', startTime.toString());
      const selectedSpace = {
        ...this.place,
        startTime: startTime,
        endtime: endTime,
        shift: shift,
      };
      console.log('selectedSpace:', { ...selectedSpace });

      // TODO NOTE: be sure the router push to Calendar uses the same params everywhere
      // e.g., forgetting 'logVisit' and 'isConnected' below made Calendar misbehave
      // but when called from the appLayoutFooter push, Calendar could access logVisit.
      this.$router.push({
        name: 'Calendar',
        params: {
          selectedSpace,
        },
      });
    },
    openInfoWindowWithSelectedPlace(place) {
      console.log('results from State:', printJson(place));
      try {
        this.drawer = false;
        this.place = place;
        console.log('Selected Place:', printJson(this.place));

        this.center = { lat: place.lat, lng: place.lng };

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

    // click on a marker
    getMarker(marker, places) {
      if (marker != this.marker) {
        this.infoWinOpen = false;
      }
      this.marker = marker;
      // TODO Refactor for State
      this.place = places.find(marker.place_id);
      this.infoWindowPos = marker.position;
      this.infoWinOpen = true;
    },

    setUpRecentVisits() {
      const recentVisitsButton = document.createElement('button');
      // <button class="btn"><i class="fa fa-target"></i></button>
      recentVisitsButton.textContent = 'Recent Visits';
      recentVisitsButton.classList.add('custom-map-control-button');
      recentVisitsButton.title = 'Sorted set of past visits';
      recentVisitsButton.addEventListener('click', () => {
        this.drawer = !this.drawer;
      });
      this.map.controls[this.google.maps.ControlPosition.LEFT_BOTTOM].push(
        recentVisitsButton
      );
    },

    setUpGeolocation() {
      const infoWindow = new this.google.maps.InfoWindow();

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
              this.handleLocationError(true, infoWindow, this.map.getCenter());
            }
          );
        } else {
          // Browser doesn't support Geolocation
          this.handleLocationError(false, infoWindow, this.map.getCenter());
        }
      });
      this.map.controls[this.google.maps.ControlPosition.RIGHT_TOP].push(
        locationButton
      );
    },

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
    addSpace(space) {
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
          if (status === this.google.maps.places.PlacesServiceStatus.OK) {
            // getDetails() returns the place
            // TODO Refactor for State
            this.state.places
              .updatePromise(place)
              .then((result) => {
                this.openInfoWindowWithSelectedPlace(result[0]);
              })
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

    // geolocation uses lat and lng values
    // map click uses latLng class with lat() and lng() functions
    addGathering(space) {
      try {
        const latLng = space.latLng || { lat: space.lat, lng: space.lng };
        // But if you don't click on one of those listed points of interest above, you don't have a placeId...yet.
        // geocode could take the space.latLng class instance, but for broad consistency,
        // we use the latLng literal because we can't conveniently serialize functions
        this.geocoder.geocode(
          {
            location: latLng,
          },
          (results, status) => {
            if (status === 'OK') {
              // results array provides different levels of address details;
              // we use the first element in the array.
              // note: name will be empty because the spot is...well, nameless.
              // Vistor provides the name using the InfoWindow.
              // geocode results do include the place_id, even for a spot not otherwise noteworthy
              space = results[0];
              if (!space.plus_code) {
                space.plus_code = { global_code: 'NA' };
              }
              console.log('Non-POI (spot) results:', printJson(space));

              // Place.updatePromise() returns all affected places
              // (of which there is always only one)
              // TODO Refactor for State
              // this.state
              //   .updatePromise(space)
              //   .then((places) =>
              //     this.openInfoWindowWithSelectedPlace(places[0])
              //   )
              //   .catch((err) => {
              //     this.throwError(
              //       'GoogleMap.addGathering(space).Place.updatePromise(space)',
              //       err
              //     );
              //   });
            } else {
              this.throwError(
                'GoogleMap.addGathering(space).geocode()',
                status
              );
            }
          }
        );
      } catch (err) {
        this.throwError('GoogleMap.addGathering(space)', err);
      }
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

    showMap() {
      const self = this;
      this.$refs.mapRef.$mapPromise.then((map) => {
        self.map = map;
        self.placesService = new self.google.maps.places.PlacesService(map);

        this.setUpRecentVisits(map);
        this.setUpGeolocation(map);
      });
    },
  },
  watch: {
    google() {
      // this.showMap();
    },
  },

  created() {
    // do this before GoogleMap component is finished instantiating
    this.center = {
      lat: parseFloat(process.env.VUE_APP_LAT),
      lng: parseFloat(process.env.VUE_APP_LNG),
    };
    const self = this;
    console.groupCollapsed('Creating GoogleMap');
    const bp = self.$vuetify.breakpoint;
    console.log(bp.name, bp.height);
    const x = bp.height;
    const y = 195;
    self.mapSize = `width: 100%; height: ${x - y}px`;
    console.log('mapSize:', self.mapSize);
    console.groupEnd();
  },
  mounted() {
    this.$nextTick(() => {
      this.$refs.mapRef.$mapPromise.then((map) => {
        self.map = map;
        self.placesService = new self.google.maps.places.PlacesService(map);

        this.setUpRecentVisits(map);
        this.setUpGeolocation(map);
      });
    });
  },
};
</script>
