<template>
  <div>
    <AppLayoutHeader :namespace="namespace" />
    <CaptureErrorSnackbar>
      <slot />
    </CaptureErrorSnackbar>

    <AppLayoutFooter />
  </div>
</template>
<script>
import AppLayoutHeader from '@/layouts/AppLayoutHeader';
import AppLayoutFooter from '@/layouts/AppLayoutFooter';
import CaptureErrorSnackbar from '@/components/errorBoundary/CaptureErrorSnackbar.vue';

export default {
  name: 'DefaultLayout',
  components: {
    AppLayoutFooter,
    AppLayoutHeader,
    CaptureErrorSnackbar,
  },
  data() {
    return {
      namespace: 'Sisters',
      ready: false,
    };
  },
  methods: {},
};
</script>
