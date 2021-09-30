<template>
  <v-container fluid>
    <v-card class="mx-auto">
      <v-card-title>Redis Monitor</v-card-title>

      <v-card-text>
        <v-row>
          <v-col>
            <v-list nav dense>
              <v-subheader>Diagnostic Queries</v-subheader>
              <v-list-item-group v-model="selectedItem" color="primary">
                <v-list-item v-for="(item, i) in items" :key="i">
                  <v-list-item-content>
                    <v-list-item-title v-text="item.query"></v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </v-list-item-group>
            </v-list>
          </v-col>
          <v-col>
            <v-text-field
              v-if="getParamName"
              v-model="param"
              label="Parameter value:"
              :hint="getHint"
              persistent-hint
            ></v-text-field>
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn @click="composeTest()">Run</v-btn>
        <v-spacer />
      </v-card-actions>
      <v-divider></v-divider>
      <v-card-text>
        <v-textarea :value="getResults" label="Results" />
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
export default {
  name: 'testCard',
  props: { testGraph: Function, results: Object },
  components: {},

  computed: {
    getQuery() {
      return this.items[this.selectedItem].query;
    },
    getParamName() {
      return this.items[this.selectedItem].param || '';
    },
    getHint() {
      return `Enter parameter value for ${this.getParamName}:`;
    },

    getResults() {
      //this.results is a prop updated by the parent Test.vue
      // and Test.vue handles the updatedGraphTest event emitted by Model.test.js
      const text = this.results.msg
        ? `${this.results.msg}
      ${this.results.results.join('\n')}`
        : 'Select a test query and press the Run button for results.';
      console.log(text);
      return text;
    },
  },

  data() {
    return {
      selectedItem: 0,
      param: '',
      items: [
        { query: 'matchWithParamsQuery', param: 'userID' },
        { query: 'matchNamedPathsQuery', param: 'userID' },

        { query: 'matchAllSpacesQuery', param: '' },
        { query: 'matchQuery', param: '' },
        { query: 'matchAllNodesQuery', param: '' },
      ],
      ready: false,
    };
  },

  methods: {
    composeTest() {
      const param = { [this.getParamName]: this.param };
      this.testGraph({ query: this.getQuery, param });
    },
  },

  watch: {
    results(n, o) {
      console.log(n, o);
    },
    query(val) {
      console.log('query', val);
    },
  },
  created() {},

  beforeUnmount() {},

  mounted() {
    console.log('\tTESTCARD mounted');
  },
};
</script>

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
