<template>
  <div>
    <v-row align="center" justify="center">
      <v-spacer></v-spacer>
      <v-col cols="12">
        <v-card max-width="320">
          <v-card-title>Welcome to LCT-{{ nsp }}</v-card-title>
          <v-card-subtitle
            >Instead of time-consuming contact tracing driving COVID testing,
            Local Contact Tracing deprives the virus of time to replicate and
            mutate because you use your tracking data to drive testing and
            treatment.
          </v-card-subtitle>

          <v-card-text>
            LCT is our community's way of getting back to work safely. This
            means we can balance the risk of infection against the risk of
            bankruptcy.
          </v-card-text>
          <v-card-text class="text-center">{{ welcomeMessage }}</v-card-text>

          <v-card-actions>
            <myCard @go="onGo"></myCard>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
export default {
  name: 'WelcomeCard',
  props: {},
  components: {
    myCard: () => import('./myCard.vue'),
  },

  computed: {
    welcomeMessage() {
      let msg =
        "We can beat this thing. Let's get started, shall we? There's no time to lose. So let's get you connected to the server...";
      return msg;
    },
  },

  data() {
    return {
      nsp: 'Sisters',
    };
  },

  methods: {
    onGo(data) {
      console.info(
        'Passing data back to App.vue with connectMe event',
        JSON.stringify(data, null, 3)
      );

      this.dialog = false;
      this.$emit('connectMe', data);
    },
  },

  watch: {},
  created() {},

  beforeUnmount() {},

  mounted() {},
};
</script>
