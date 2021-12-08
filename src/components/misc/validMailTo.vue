<template>
  <v-form ref="form" v-model="valid" lazy-validation>
    <v-text-field
      v-model="email"
      :rules="emailRules"
      label="Email"
      placeholder="Enter email(s separated by commas)"
      required
    ></v-text-field>
    <v-text-field
      v-model="subject"
      label="Subject"
      required
    ></v-text-field>

    <v-textarea
      placeholder="Body"
      type="text"
      v-model="body"
      v-on:keyup="updateOutputUrl"
    ></v-textarea>

    <v-btn :href="outputUrl">
      Send
    </v-btn>
  </v-form>
</template>
<script>
export default {
  name: 'validMailTo',

  data: () => ({
    outputUrl: '',
    email: '',
    subject:'',
    body:'',
    // email: {
    //   subject: 'Meet me',
    //   body: 'Details:',
    // },
    emailRules: [
      (v) => !!v || 'Email is required',
      (v) => /.+@.+\..+/.test(v) || 'Email must be valid',
    ],
  }),

  computed: {
    emailErrors() {
      const errors = [];
      if (!this.$v.email.$dirty) return errors;
      !this.$v.email.email && errors.push('Must be valid e-mail');
      !this.$v.email.required && errors.push('E-mail is required');
      return errors;
    },
  },

  methods: {
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
  mounted() {
    console.log('mounted');
  },
};
</script>
