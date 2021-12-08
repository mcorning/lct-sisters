<template>
  <v-card>
    <v-card-text>
      <v-form ref="form" v-model="valid" lazy-validation>
        <v-text-field
          v-model="emailId"
          :rules="emailRules"
          type="email"
          label="Email"
          placeholder="Enter email(s separated by commas)"
          required
          v-on:keyup="updateOutputUrl"
        ></v-text-field>

        <v-text-field
          placeholder="Subject"
          type="text"
          v-model="email.subject"
          v-on:keyup="updateOutputUrl"
        />

        <v-textarea
          placeholder="Body"
          type="text"
          v-model="email.body"
          v-on:keyup="encode"
        ></v-textarea>
      </v-form>

      <v-btn class="btn" :href="outputUrl">
        Send
      </v-btn>
      <code class="outputBox">
        {{ outputUrl }}
      </code>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: 'mailToCard',
  created() {
    this.updateOutputUrl();
  },
  data() {
    return {
      valid: true,

      emailRules: [
        (v) => !!v || 'Email is required',
        (v) => /.+@.+\..+/.test(v) || 'Email must be valid',
      ],
      outputUrl: '',
      emailId: '',
      email: {
        subject: 'Meet me at',
        body: '',
      },
    };
  },
  methods: {
    encode() {
      console.log(this.email.body);
      this.updateOutputUrl();
    },
    updateOutputUrl() {
      this.outputUrl = 'mailto:' + this.emailId;
      const emailKeys = Object.keys(this.email);
      const remaining = emailKeys.filter(
        (key) => this.email[key].trim().length > 0
      );
      if (remaining.length > 0) {
        this.outputUrl += '?';
      }

      this.outputUrl += remaining
        .map((key) => `${key}=${encodeURI(this.email[key].trim())}`)
        .join('&');
    },
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
  overflow-x: auto;
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
