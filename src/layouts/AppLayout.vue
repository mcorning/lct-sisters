<template>
  <keep-alive>
    <component :is="layout">
      <slot />
    </component>
  </keep-alive>
</template>

<script>
const defaultLayout = 'AppLayoutDefault';

export default {
  name: 'AppLayout',

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
