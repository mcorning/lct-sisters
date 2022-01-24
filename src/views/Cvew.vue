<template>
  <Model @error="onError">
    <div slot-scope="{ state, addWarnings, updateVisit }">
      <acts
        :state="state"
        :addWarnings="addWarnings"
        :updateVisit="updateVisit"
        :warnings="warnings"
      />
    </div>
  </Model>
</template>

<script>
import acts from '../components/acts.vue';
import Model from '@/components/renderless/Model.vue';

export default {
  name: 'CvewView',
  props: {},
  components: { Model, acts },
  computed: {},
  data() {
    return {
      warnings: '',
    };
  },

  methods: {},

  watch: {},

  mounted() {
    // if AppLayoutDefault calls acts.vue, pick up the warnings here
    console.log('params', JSON.stringify(this.$route.params, null, 2));
    this.warnings = this.$route.params;
    console.log('Cvew mounted');
  },
};
</script>

<style scoped>
a:link {
  text-decoration: none;
}
</style>
