<template>
  <v-card v-if="ready">
    <v-card-text>
      <v-form ref="form" v-model="valid" lazy-validation>
        <v-text-field
          v-model="emailId"
          label="Email"
          :rules="emailRules"
          type="email"
          placeholder="Enter email(s separated by commas)"
          required
        ></v-text-field>
        <v-text-field
          v-model="subject"
          label="Subject"
          placeholder="Place and optional Room"
          type="text"
        />

        <v-text-field
          v-model="description"
          label="Description"
          placeholder="Description"
          type="text"
          v-on:keyup="updateOutputUrl"
        />
        <v-divider />
        <v-text-field
          v-model="href.name"
          label="Meeting place name"
          type="text"
          readonly
        />
        <v-text-field
          v-model="href.place_id"
          label="Meeting place ID"
          type="text"
          readonly
        />
        <v-text-field
          v-model="href.start"
          label="Start time"
          type="text"
          readonly
        />
        <v-text-field
          v-model="href.end"
          label="End time"
          type="text"
          readonly
        />
        <v-text-field
          v-model="href.graphName"
          label="Exposure Network"
          type="text"
          readonly
        />
        <v-textarea
          label="Body"
          placeholder="Body"
          type="text"
          v-model="body"
        ></v-textarea>
      </v-form>

      <v-btn class="btn" :href="mailtoUrl"> Send </v-btn>
      <code class="outputBox">
        {{ mailtoUrl }}
      </code>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: 'mailToCard',

  computed: {},
  data() {
    return {
      ready: false,
      origin: window.location.origin,
      mailtoUrl: 'mailto:',
      valid: true,

      emailRules: [
        (v) => !!v || 'Email is required',
        (v) => /.+@.+\..+/.test(v) || 'Email must be valid',
      ],

      cvewUrl: '',
      start: 1638949500000,
      date: new Date(this.start).toString(),
      description: '',

      href: {
        place_id: 'ChIJ-1UaTswwv1QRb7e_AZQolkU',
        date: new Date(1638949500000).toString(),
        start: '1638949500000',
        end: '1638951300000',
        name: `FivePine Lodge and Spa ${this.description ?? ''}`,
        graphName: 'Sisters OR',
      },
      emailId: 'mcorning@outlook.com',
      subject: '',
      body: '',
    };
  },
  methods: {
    updateOutputUrl() {
      this.cvewUrl = `${origin}`;
      this.subject = encodeURIComponent(
        `Meet me at ${this.href.name} ${this.description}`
      );
      const hrefKeys = Object.keys(this.href);
      const remaining = hrefKeys.filter(
        (key) => this.href[key].trim().length > 0
      );
      console.log('remaining:', JSON.stringify(remaining, null, 3));
      if (remaining.length > 0) {
        this.cvewUrl += '?';
      }

      // TODO replace with en[de]codeURI[Component]()
      this.cvewUrl += remaining
        .map((key) => `${key}=${encodeURIComponent(this.href[key].trim())}`)
        .join('&');
      // const uri = encodeURIComponent(this.cvewUrl);
      this.body = cvewUrl //uri;
      this.mailtoUrl = `mailto:${this.emailId}?subject=${this.subject}&body=${this.body}`;
    },
  },

  watch: {
    ready() {
      this.updateOutputUrl();
    },
  },
  mounted() {
    this.ready = true;
  },
};
</script>

<style>
.outputBox {
  -ms-user-select: all;
  -webkit-user-select: all;
  user-select: all;
  background: #2d2b55;
  border-radius: 6px;
  box-sizing: border-box;
  color: #fad000;
  display: block;
  margin: 0 auto 20px;
  overflow: hidden;
  padding: 20px;
  white-space: nowrap;
  width: 100%;
}

@media (min-width: 720px) {
  .btn {
    margin: 10px 0 10px 10px;
    width: auto;
    color: 'white';
  }
}
</style>
