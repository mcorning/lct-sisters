<template>
  <Act>
    <div slot-scope="{ act, alert, riskScore, refresh, visits }">
      <v-container fluid>
        <prompt-banner
          :alert="alert"
          :riskScore="riskScore"
          :refresh="refresh"
        ></prompt-banner>
        <v-card-title>CoVid Early Warning System</v-card-title>
        <v-card-subtitle
          >The virus likely visited these places when you did</v-card-subtitle
        >
        <pre class="text-caption">{{ visits }}</pre>
        <v-card-actions>
          <v-btn @click="act">Warn them</v-btn>
        </v-card-actions>
      </v-container>
    </div>
  </Act>
</template>

<script>
import PromptBanner from '../components/prompts/promptBanner.vue';
import Act from './renderless/Act.vue';
export default {
  name: 'acts',
  components: { PromptBanner, Act },
  props: {
    state: Object,
    addWarnings: Function,
    updateVisit: Function,
    warnings: Object,
  },
  computed: {},
  mounted() {
    console.log(this.state);
  },
};
</script>

<style lang="scss" scoped>
.SplitHorizontal {
  width: 100vw;
  height: 50vh;
}
</style>
