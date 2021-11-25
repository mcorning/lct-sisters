<template>
  <div>
    <v-card v-if="info" class="mx-auto" max-width="344">
      <v-card-text class="text-subtitle-1   pb-0">
        <div v-if="!isGathering">{{ name }}</div>
        <v-text-field
          v-else
          v-model="gatheringName"
          label="Enter a name for your gathering"
        />
      </v-card-text>

      <v-card-subtitle class="text-sm-subtitle-2 text-caption pb-xs-0"
        >{{ address }}<br /><span v-if="placeLink" v-html="placeLink"></span
      ></v-card-subtitle>
      <v-btn
        class="text-caption pt-xs-0"
        text
        block
        color="primary"
        :small="$vuetify.breakpoint.xs"
        @click="reveal = true"
      >
        {{ locationDetailsText }}
      </v-btn>
      <v-btn
        block
        :small="$vuetify.breakpoint.xs"
        color="primary"
        @click="onVisitPlace({ placeId, gatheringName })"
        >Mark Calendar</v-btn
      >
      <v-card-actions>
        <v-tooltip top>
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              v-bind="attrs"
              v-on="on"
              @click="deleteMarker"
              icon
              color="primary"
            >
              <v-icon>delete</v-icon>
            </v-btn>
          </template>
          <span>Delete selected marker from map</span>
        </v-tooltip>

        <v-spacer />

        <v-tooltip top>
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              v-bind="attrs"
              v-on="on"
              @click="changeMapCenter"
              icon
              color="primary"
            >
              <v-icon>save</v-icon>
            </v-btn>
          </template>
          <span>Save this marker as your default map center</span>
        </v-tooltip>

        <v-spacer />
        <v-dialog v-model="enlargeQR" width="520">
          <!-- never could figure out how to add a tooltip to an activator button -->
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
              @click="closeDialog"
              ><v-icon>close</v-icon></v-btn
            >

            <div id="targetDiv">
              <v-card-title class="text-subtitle-1 text-sm-h5">{{
                name
              }}</v-card-title>
              <v-card-subtitle class="text-subtitle-2 mr-6">{{
                dialogSubtitle
              }}</v-card-subtitle>

              <v-card-text v-if="!printing">
                <v-tabs v-model="tab" grow background-color="transparent">
                  <v-tab v-for="item in items" :key="item.tab">
                    {{ item.tab }}
                  </v-tab>
                </v-tabs>
                <v-tabs-items v-model="tab">
                  <v-tab-item v-for="item in items" :key="item.tab">
                    <v-card flat>
                      <v-card-text v-if="!employee" v-text="item.content">
                      </v-card-text>
                      <v-card-text v-if="!employee">
                        <v-row align="center"
                          ><v-col cols="9" sm="5">
                            <v-text-field
                              v-model="avgStay"
                              label="Visitor average stay (minutes)"
                            ></v-text-field></v-col
                          ><v-spacer />
                          <v-col cols="2">
                            <v-btn icon color="primary" plain @click="printMe"
                              ><v-icon>print</v-icon></v-btn
                            ></v-col
                          ></v-row
                        >
                      </v-card-text>

                      <!-- <v-row v-if="item.content === 'Shift'"> -->
                      <v-row v-if="employee">
                        <date-time-card
                          :size="24"
                          :edit="edit"
                          @printQR="onPrintQR"
                          @closeDateTimeCard="onCloseDateTimeCard"
                        />
                      </v-row>
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

                <v-divider class="my-3"></v-divider>
                <v-card-title>Event Link</v-card-title>
                <v-card-text class="text-caption text-sm-body-2">{{
                  decodedUri
                }}</v-card-text>

                <!-- <v-btn block @click="copyLink"
                  ><v-icon left>content_copy</v-icon>Copy event link</v-btn
                > -->

                <!-- confirmation screen -->
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
            </div>
            <v-divider class="my-3"></v-divider>
            <v-card-actions v-if="printing">
              <v-btn text color="primary" plain @click="printing = false"
                >Cancel</v-btn
              >
              <v-spacer />
              <v-btn text color="primary" plain @click="printMe">OK</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
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

import dateTimeCard from './dateTimeCard.vue';
import { DateTime, asHour, asMinute } from '@/utils/luxonHelpers';
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
    dateTimeCard,
  },

  computed: {
    locationDetailsText() {
      return this.$vuetify.breakpoint.xs
        ? 'Location details'
        : 'Show location details';
    },
    employee() {
      return this.tab === 0;
    },

    dialogSubtitle() {
      const text = this.printing
        ? this.employee
          ? 'Use the LCT QR code to sign in to work safely.'
          : 'Help us do our part to beat the virus. Scan QR to open our Local Contact Tracing app and log your visit today.'
        : 'Use this dialog to log in at work or to share this public place with visitors.';
      return text;
    },

    decodedUri() {
      return this.employee ? this.decodedShiftUri : this.decodedVisitorUri;
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
    decodedVisitorUri() {
      // the QR code generator needs to use the decoded URI
      const uri = `${this.mailToUri}&avgStay=${this.avgStay}`;
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
      return `<a href="${this.info.url}">Show ${
        this.$vuetify.breakpoint.xs ? '' : 'place details'
      } on Googlemap</a>`;
    },
    address() {
      return this.info?.formatted_address ?? '';
    },
  },
  data() {
    return {
      avgStay: 30,
      preview: false,
      edit: false,
      printing: false,
      tab: null,
      items: [
        { tab: 'Employees', content: 'Log in your shift' },
        { tab: 'Visitors', content: 'Shared visits default to current time' },
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
    changeMapCenter() {
      this.$emit('changeMapCenter');
    },
    onPrintQR() {
      this.printing = true;
    },

    closeDialog() {
      this.enlargeQR = false;
      this.printing = false;
    },
    getDateString(x) {
      const data = { dateTime: x, padded: true };
      const hour = asHour(data);
      const minute = asMinute(data);
      return `${hour}:${minute}`;
    },
    onCloseDateTimeCard({ start, end }) {
      // start/endshift uses time literal
      // this.startShift = new DateTime.fromMillis(start).toFormat('hh:mm a');
      // this.endShift = new DateTime.fromMillis(end).toFormat('hh:mm a');
      // space getting in the way. use millis.
      this.startShift = new DateTime.fromMillis(start).toISOTime();
      this.endShift = new DateTime.fromMillis(end).toISOTime();
    },

    // disabled for lack of idempotency: copied is true, but pasting does not paste last copy
    copyLink() {
      const copied = this.$clipboard(this.decodedUri);
      this.showConf = copied;
    },
    deleteMarker() {
      this.$emit('deleteMarker');
    },
    printMe() {
      this.preview = true;
      window.print();
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

@media print {
  body * {
    visibility: hidden;
  }
  #targetDiv,
  #targetDiv * {
    visibility: visible;
    border: none;
  }
}
</style>
