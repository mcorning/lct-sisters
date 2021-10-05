<template>
  <keep-alive>
    <Model>
      <div slot-scope="{ isConnected, usernumber, getVisitors }">
        <component
          :is="layout"
          :isConnected="isConnected"
          :usernumber="usernumber"
          :getVisitors="getVisitors"
        >
          <slot />
        </component>
      </div>
    </Model>
  </keep-alive>
</template>

<script>
const defaultLayout = 'AppLayoutDefault';
import Model from '../components/renderless/Model.vue';

export default {
  name: 'AppLayout',
  components: {
    Model,
  },
  computed: {
    layout() {
      const layout = this.$route.meta.layout || defaultLayout;
      return () => import(`@/layouts/${layout}.vue`);
    },
  },
  data() {
    return {};
  },
  methods: {},
};
</script>
