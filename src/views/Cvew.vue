<template>
  <Model @error="onError">
    <div slot-scope="{ state }">
      <acts :state="state" />
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
    return {};
  },

  methods: {},

  watch: {},

  async mounted() {
    console.log('Cvew mounted');
  },
};
</script>

<style scoped>
a:link {
  text-decoration: none;
}
</style>
