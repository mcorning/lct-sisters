<template>
  <keep-alive>
    <Model>
      <div slot-scope="{ isConnected, usernumber }">
        <component
          :is="layout"
          :isConnected="isConnected"
          :usernumber="usernumber"
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
