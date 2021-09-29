<template>
  <v-container fluid>
    <!-- <v-row align="center" justify="center">
      <v-spacer></v-spacer>
      <v-col cols="12"> -->
    <v-card>
      <v-card-title>Redis Monitor</v-card-title>

      <v-card-text>
        <v-textarea :value="query" label="Query:" />
        <v-textarea :value="res" label="Results" />
      </v-card-text>
      <!-- <v-card-title>Welcome to LCT-{{ nsp }}</v-card-title>
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
      <v-card-text class="text-center">{{ welcomeMessage }}</v-card-text> -->

      <v-card-actions>
        <!-- <myCard @go="onGo"></myCard> -->
        <v-btn @click="testGraph(query)">Run</v-btn>
      </v-card-actions>
    </v-card>
    <!-- </v-col>
    </v-row> -->
  </v-container>
</template>

<script>
export default {
  name: 'testCard',
  props: { testGraph: Function, res:Object, },
  components: {},

  computed: {},

  data() {
    return {
      query: `MATCH p=(:visitor{userID:'b6644acc815efb64'})-[v:visited]->(s:space) RETURN p`,
      ready: false,
    };
  },

  methods: {},

  watch: {},
  created() {},

  beforeUnmount() {},

  mounted() {
    console.log('\tTESTCARD mounted');
  },
};
</script>
