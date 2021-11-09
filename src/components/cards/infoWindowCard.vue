<template>
  <div>
    <v-card v-if="info" class="mx-auto" max-width="344">
      <v-card-text class="text-subtitle-2  mr-5 pb-0">
        <div v-if="!isGathering">{{ name }}</div>
        <v-text-field
          v-else
          v-model="gatheringName"
          label="Enter a name for your gathering"
        />
      </v-card-text>

      <v-card-subtitle
        >{{ address }}<br /><span v-if="placeLink" v-html="placeLink"></span
      ></v-card-subtitle>

      <v-btn
        block
        color="primary"
        @click="onVisitPlace({ placeId, gatheringName })"
        >Mark Calendar</v-btn
      >
      <v-card-actions>
        <v-dialog v-model="enlargeQR" width="500">
          <template v-slot:activator="{ on, attrs }">
            <v-btn color="primary" icon v-bind="attrs" v-on="on">
              <v-icon>share</v-icon>
            </v-btn>
          </template>

          <v-card>
            <v-btn
              icon
              absolute
              top
              right
              large
              color="primary"
              @click="enlargeQR = false"
              ><v-icon>close</v-icon></v-btn
            >

            <v-card-title class="text-subtitle-1 text-sm-h5">{{
              name
            }}</v-card-title>
            <v-card-subtitle class="text-subtitle-2 mr-6"
              >Use this dialog to share this public place with visitors or
              employees.</v-card-subtitle
            >

            <v-card-text>
              <v-tabs v-model="tab" grow background-color="transparent">
                <v-tab v-for="item in items" :key="item.tab">
                  {{ item.tab }}
                </v-tab>
              </v-tabs>
              <v-tabs-items v-model="tab">
                <v-tab-item v-for="item in items" :key="item.tab">
                  <v-card flat>
                    <v-row v-if="item.content === 'Shift'">
                      <date-time-card-today
                        :size="16"
                        @closeDateTimeCard="onCloseDateTimeCard"
                      />
                    </v-row>
                    <v-card-text v-else v-text="item.content"></v-card-text>
                  </v-card>
                </v-tab-item>
              </v-tabs-items>
            </v-card-text>
            <v-card-text>
              <v-row>
                <v-spacer />
                <v-col class="text-center">
                  <VueQRCodeComponent
                    id="qr"
                    ref="qr"
                    :text="decodedUri"
                    :size="128"
                  >
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
              <v-divider class="my-3"></v-divider>

              <!-- <v-btn block @click="copyLink"
                ><v-icon left>content_copy</v-icon>Copy event link</v-btn
              > -->
              <v-card-title>Event Link</v-card-title>
              <v-card-text class="text-caption text-sm-body-2">{{
                decodedUri
              }}</v-card-text>
              <v-sheet
                v-if="showConf"
                class="px-5 pt-5 pb-4 mx-auto text-center d-inline-block"
                color="blue-grey darken-3"
                dark
                width="100%"
              >
                <div class="grey--text text--lighten-1 text-body-2 mb-4">
                  Link copied
                </div>
                <v-btn
                  color="grey"
                  plain
                  class="ma-1"
                  @click="showConf = false"
                >
                  Close
                </v-btn>
              </v-sheet>
            </v-card-text>
          </v-card>
        </v-dialog>

        <v-spacer />

        <v-btn text color="primary" @click="reveal = true">
          Positions
        </v-btn>

        <v-spacer />

        <v-btn icon plain color="primary" @click="deleteMarker"
          ><v-icon>delete</v-icon></v-btn
        >
      </v-card-actions>

      <v-expand-transition>
        <v-card
          v-if="reveal"
          class="transition-fast-in-fast-out v-card--reveal"
          style="height: 100%;"
          ><v-card-title>{{ name }}</v-card-title>
          <v-card-subtitle>Position values:</v-card-subtitle>
          <v-card-text class="pb-0">
            {{ `Lat: ${info.position.lat} Lng: ${info.position.lng}` }}<br />
            {{ `PlaceID:    ${placeId}` }}<br />
            {{ `GlobalCode: ${globalCode}` }}<br />
          </v-card-text>
          <v-card-actions class="pt-0">
            <v-btn text color="primary" @click="reveal = false">
              Close
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-expand-transition>
    </v-card>
  </div>
</template>

<script>
// https://www.npmjs.com/package/vue-qr-generator
import VueQRCodeComponent from 'vue-qr-generator';

import DateTimeCardToday from './dateTimeCardToday.vue';

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
    DateTimeCardToday,
  },

  computed: {
    decodedUri() {
      return this.tab === 0 ? this.decodedShiftUri : this.mailToUri;
    },
    mailToUri() {
      const escapedName = this.name.replace(/ /g, '_').replace(/&/g, 'and');
      // do normal url encoding for the rest of the args
      // we will reverse this edit in space.js
      const uri = encodeURIComponent(
        `place_id=${this.placeId}&name=${escapedName}`
      );
      return `${window.location.origin}/?${uri}`;
    },

    decodedShiftUri() {
      // the QR code generator needs to use the decoded URI
      const uri = `${this.mailToUri}&start=${this.startShift}&end=${this.endShift}`;
      const d = decodeURIComponent(uri);
      return d;
    },

    isGathering() {
      return this.name === 'Gathering';
    },
    latLng: () => {
      return this.info
        ? `Lat: ${this.info?.position.lat ?? ''} Lng:  ${this.info?.position
            .lng ?? ''}`
        : '';
    },
    name() {
      return this.info?.name ?? '';
    },
    position() {
      return this.info?.position ?? '';
    },

    placeId() {
      return this.info?.place_id ?? '';
    },
    globalCode() {
      // TODO make globalCode the primary index in graph for space nodes
      return this.info?.global_code ?? '';
    },
    placeLink() {
      if (!this.info) {
        return '';
      }
      return `<a href="${this.info.url}">Show place details on Googlemap</a>`;
    },
    address() {
      return this.info?.formatted_address ?? '';
    },
  },
  data() {
    return {
      tab: null,
      items: [
        { tab: 'Employees', content: 'Shift' },
        { tab: 'Visitors', content: 'Visit defaults to current time' },
      ],
      showConf: false,
      reveal: false,
      enlargeQR: false,
      gatheringName: '',
      startShift: '',
      endShift: '',
    };
  },
  methods: {
    onCloseDateTimeCard({ startString, endString }) {
      this.startShift = startString;
      this.endShift = endString;
    },

    // disabled for lack of idempotency: copied is true, but pasting does not paste last copy
    copyLink() {
      const copied = this.$clipboard(this.decodedUri);
      this.showConf = copied;
    },
    deleteMarker() {
      this.$emit('deleteMarker');
    },
  },

  watch: {},
  mounted() {},
};
</script>
<style>
.v-card--reveal {
  bottom: 0;
  opacity: 1 !important;
  position: absolute;
  width: 100%;
}
</style>
