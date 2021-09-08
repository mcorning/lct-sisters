<template>
  <v-container fluid>
    <!-- <v-row align="center" justify="center">
      <v-spacer></v-spacer>
      <v-col cols="12"> -->
    <v-card max-width="320">
      <v-card-title>Welcome to LCT-{{ nsp }}</v-card-title>
      <v-card-subtitle>A COVID Early Warning System</v-card-subtitle>
      <v-card-text>
        LCT is our community's way of getting back to work safely. This means we
        can balance the risk of infection against the risk of bankruptcy.
      </v-card-text>
      <v-card-text
        >How? By depriving the virus of time to replicate and mutate. As soon as
        you show symptoms or test positive, LCT sends alerts to all your tracked
        visits. Each of those alerted users, in turn, alerts their own tracked
        visits. An entire small community or large organization can get tested
        and treated orders of magnitude faster than with conventional
        time-consuming contract tracing.
      </v-card-text>
      <v-card-text class="text-center">{{ welcomeMessage }}</v-card-text>

      <v-card-actions>
        <myCard @go="onGo"></myCard>
      </v-card-actions>
    </v-card>
    <!-- </v-col>
    </v-row> -->
  </v-container>
</template>

<script>
export default {
  name: 'testCard',
  props: { test: Function },
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

  mounted() {
    console.log('\tWELCOMECARD mounted');
    this.test('WELCOMECARD mounted');
  },
};
</script>
