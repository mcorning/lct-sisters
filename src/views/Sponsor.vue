<template>
  <v-container fluid>
    <v-card max-width="500">
      <v-card-title>{{ welcome }}</v-card-title>
      <v-card-text v-html="message"> </v-card-text>
      <v-card-actions>
        <v-card-text v-if="newSponsor">
          <v-row align="center"
            ><v-col cols="8">
              <v-text-field
                v-model="id"
                label="Your business name"
              ></v-text-field>
            </v-col>
            <v-spacer></v-spacer>
            <v-col
              ><v-btn block color="primary" @click="getVisits">Visits</v-btn>
            </v-col>
            <v-col
              ><v-btn
                :disabled="!id || registered"
                block
                color="primary"
                @click="register"
                >Register</v-btn
              >
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-text v-else>
          <v-btn block color="primary" @click="addVisit">Visit</v-btn>
        </v-card-text>
      </v-card-actions>
      <div v-if="registered">
        <v-card-title class="text-h6"
          >To see a preview of your QR card...</v-card-title
        >
        <v-card-subtitle>...press the Print button below</v-card-subtitle>
      </div>
      <div ref="printDiv">
        <v-card-text v-if="registered" class="text-center">
          <div id="targetDiv" ref="targetDiv" class="text-center">
            <v-row v-if="printing"
              ><v-col
                ><p>
                  Scan this QR code to access our
                  <strong>{{ id }} Customer Rewards</strong> app.
                </p>
                <p>
                  Each time you access the app, you earn points for future
                  discounts.
                </p></v-col
              ></v-row
            >
            <v-row>
              <v-spacer />
              <v-col class="text-center">
                <VueQRCodeComponent id="qr" ref="qr" :text="decodedUri">
                </VueQRCodeComponent>
              </v-col>
              <v-spacer />
            </v-row>
          </div>

          <v-card-actions v-if="printing">
            <v-row>
              <v-btn text color="primary" plain @click="printing = false"
                >Cancel</v-btn
              >
              <v-spacer />
              <v-btn text color="primary" plain @click="printMe">Print</v-btn>
            </v-row>
          </v-card-actions>
        </v-card-text>
      </div>
      <v-snackbar
        v-model="showMe"
        centered
        timeout="-1"
        height="100px"
        color="blue-grey darken-3"
      >
        {{ snackBarMessage }}
        <template v-slot:action="{ attrs }">
          <v-btn
            v-if="snackBtnText"
            text
            color="#00f500"
            v-bind="attrs"
            @click.stop="snackBarAction"
          >
            {{ snackBtnText }}
          </v-btn>
        </template>
      </v-snackbar>
    </v-card>
  </v-container>
</template>

<script>
import VueQRCodeComponent from 'vue-qr-generator';
import * as easings from 'vuetify/lib/services/goto/easing-patterns';

export default {
  name: 'SponsorView',
  props: {},
  components: { VueQRCodeComponent },
  computed: {
    snackBarAction() {
      const action =
        this.snackBarActionIndex === 0 ? this.addSponsor : this.closeSnackbar;
      return action;
    },
    decodedUri() {
      const d = `${window.location.origin}/sponsor/${this.id}`;
      return d;
    },

    newSponsor() {
      return !this.$route.params.id;
    },
    welcome() {
      const msg = this.$route.params.id
        ? `Welcome to the ${this.$route.params.id} Community`
        : 'Welcome to our Community of Communities';

      return msg;
    },
    message() {
      const msg = this.$route.params.id
        ? 'You join our community without sharing any personal identifying information. This gives us the ability to communicate opportunities and news about us.'
        : 'You can now connect with your customers while protecting their privacy.';
      return msg;
    },

    options() {
      return {
        duration: this.duration,
        offset: this.offset,
        easing: this.easing,
      };
    },
  },

  data() {
    return {
      id: '',
      snackBtnText: 'ok',
      snackBarMessage: 'Ready to get started?',
      snackBarActionIndex: 0,
      confirmation: null,
      showMe: false,
      registered: false,
      printing: false,
      duration: 300,
      offset: 0,
      easing: 'easeInOutCubic',
      easings: Object.keys(easings),
    };
  },
  methods: {
    onPrintQR() {
      this.printing = true;
    },
    printMe() {
      //  this.preview = true;
      window.print();
    },
    register() {
      this.showMe = true;
      this.printing = true;
    },
    emitFromClient(eventName, data, ack) {
      this.$socket.client.emit(eventName, data, ack);
    },
    closeSnackbar() {
      this.showMe = false;
    },
    addSponsor() {
      // get the Stream ID for the biz and the ID of the biz owner
      const sid = this.id;
      const oid = this.$socket.client.auth.userID;
      const eventName = 'addSponsor';

      console.log(sid, oid);
      this.emitFromClient(eventName, { sid, oid }, (res) => {
        this.snackBarMessage = res;
        this.snackBarActionIndex = 1;
        this.showMe = true;
      });

      this.registered = true;
      this.showMe = false;
      this.$vuetify.goTo(this.$refs.printDiv, this.options);
    },

    addVisit() {
      const sid = this.$route.params.id;
      const uid = this.$socket.client.auth.userID;

      if (!sid || !uid) {
        console.log(
          `Insufficient parameters: sid provided ${sid} uid provided ${uid}`
        );
        return;
      }

      const eventName = 'addVisit';
      // get the Stream ID for the biz and the ID of the biz owner
      console.log(sid, uid);
      this.emitFromClient(eventName, { sid, uid }, (res) => {
        this.snackBarMessage = res;
        this.snackBarActionIndex = 1;
        this.showMe = true;
      });

      this.registered = true;
      this.showMe = false;
      this.$vuetify.goTo(this.$refs.printDiv, this.options);
    },
    getVisits() {
      const sid = this.id;

      if (!sid) {
        console.log(`Missing sid`);
        return;
      }

      const eventName = 'getVisits';
      // get the Stream ID for the biz and the ID of the biz owner
      console.log(sid);
      this.emitFromClient(eventName,  sid, (res) => {
        this.snackBarMessage = res;
        this.snackBarActionIndex = 1;
        this.showMe = true;
      });

      this.registered = true;
      this.showMe = false;
      this.$vuetify.goTo(this.$refs.printDiv, this.options);
    },
  },
  mounted() {},
};
</script>

<style lang="scss" scoped>
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
