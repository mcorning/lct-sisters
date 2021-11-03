<template>
  <div>
    <v-card v-if="info">
      <v-card-text class="text-h6 pb-0">
        <div v-if="!isGathering">{{ name }}</div>
        <v-text-field
          v-else
          v-model="gatheringName"
          label="Enter a name for your gathering"
        />
      </v-card-text>
      <v-card-subtitle
        >{{ address }}<br /><span v-if="info.url" v-html="placeLink"></span
      ></v-card-subtitle>
      <v-card-actions>
        <v-btn
          block
          color="primary"
          @click="onVisitPlace({ placeId, gatheringName })"
          >Mark Calendar</v-btn
        >
      </v-card-actions>
      <v-card-actions>
        <v-btn class=" text-caption " @click="toggle">
          Positions
          <!-- {{ showPostions ? 'Hide' : 'Show' }} Positions -->
        </v-btn>
        <v-spacer />
        <v-dialog v-model="enlargeQR" width="500">
          <template v-slot:activator="{ on, attrs }">
            <v-btn icon v-bind="attrs" v-on="on">
              <v-icon>qr_code_2</v-icon>
            </v-btn>
          </template>

          <v-card>
            <v-btn icon absolute top right @click="enlargeQR = false"
              ><v-icon>close</v-icon></v-btn
            >
            <v-card-title>QR for {{ name }}</v-card-title>

            <v-card-text>
              <v-row>
                <v-spacer />
                <v-col class="text-center">
                  <VueQRCodeComponent id="qr" ref="qr" :text="decodedUri">
                  </VueQRCodeComponent>
                </v-col>
                <v-spacer />
              </v-row>
              <v-row
                ><v-col
                  ><span class="text-caption"
                    >Right-click and "Save image as..." then print QR for
                    customer convenience.</span
                  ></v-col
                ></v-row
              >
            </v-card-text>
            <v-card-title class="mb-0 pb-1">Event URL:</v-card-title>
            <v-card-text class="text-caption text-sm-body-2">{{
              decodedUri
            }}</v-card-text>

            <v-divider></v-divider>
          </v-card>
        </v-dialog>
        <v-spacer />
        <v-btn @click="deleteMarker">Delete</v-btn>
        <div v-if="showPostions">
          {{ `Lat: ${info.position.lat} Lng: ${info.position.lng}` }}<br />
          {{ `PlaceID:    ${placeId}` }}<br />
          {{ `GlobalCode: ${globalCode}` }}
          }}
        </div>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script>
import VueQRCodeComponent from 'vue-qr-generator';

export default {
  name: 'InfowindowCard',
  props: {
    info: {
      type: Object,
      require: true,
    },
    onVisitPlace: Function,
  },
  components: {
    VueQRCodeComponent,
  },

  computed: {
    decodedUri() {
      // the QR code generator needs to use the decoded URI
      const d = decodeURIComponent(this.mailToUri);
      return d;
    },

    mailToUri() {
      const escapedName = this.name.replace(/ /g, '_').replace(/&/g, 'and');
      // do normal url encoding for the rest of the args
      // we will reverse this edit in space.js (but see note above in decodedUri())
      const uri = encodeURIComponent(
        `place_id=${this.placeId}&name=${escapedName}`
      );
      return `${window.location.origin}/?${uri}`;
    },
    isGathering() {
      return this.name === 'Gathering';
    },
    latLng: () => {
      return this.info
        ? `Lat: ${this.info.position.lat} Lng:  ${this.info.position.lng}`
        : '';
    },
    name() {
      return this.info.name;
    },
    position() {
      return this.info.position;
    },

    placeId() {
      return this.info.place_id;
    },
    globalCode() {
      // TODO make globalCode the primary index in graph for space nodes
      return this.info.global_code;
    },
    placeLink() {
      return `<a href="${this.info.url}">Show place details on Googlemap</a>`;
    },
    address() {
      return this.info.formatted_address;
    },
  },
  data() {
    return {
      enlargeQR: false,
      showPostions: false,
      gatheringName: '',
    };
  },
  methods: {
    deleteMarker() {
      this.$emit('deleteMarker');
    },
    toggle() {
      this.showPostions = !this.showPostions;
    },
  },

  watch: {},
  mounted() {
    console.log();
  },
};
</script>
