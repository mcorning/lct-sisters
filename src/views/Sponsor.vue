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
                label="Enter your place of business"
              ></v-text-field>
            </v-col>
            <v-spacer></v-spacer>
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
          <v-btn block color="primary" @click="register">Visit</v-btn>
        </v-card-text>
      </v-card-actions>
      <v-card-text v-if="registered" class="text-center">
        <div id="targetDiv" class="text-center">
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
      <v-snackbar
        v-model="showMe"
        centered
        timeout="-1"
        height="100px"
        color="blue-grey darken-3"
      >
        Ready to get started?
        <template v-slot:action="{ attrs }">
          <v-btn
            v-if="snackBtnText"
            text
            color="#00f500"
            v-bind="attrs"
            @click.stop="addSponsor"
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

export default {
  name: 'SponsorView',
  props: {},
  components: { VueQRCodeComponent },
  computed: {
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
  },

  data() {
    return {
      id: '',
      snackBtnText: 'ok',
      confirmation: null,
      showMe: false,
      registered: false,
      printing: false,
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
    addSponsor() {
      this.registered = true;
      this.showMe = false;
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
