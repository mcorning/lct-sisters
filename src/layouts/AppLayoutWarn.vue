<template>
  <div>
    <AppLayoutHeader :namespace="namespace" />
    <CaptureErrorSnackbar>
      <slot />
    </CaptureErrorSnackbar>
  </div>
</template>

<script>
import AppLayoutHeader from '@/layouts/AppLayoutHeader';
import CaptureErrorSnackbar from '@/components/errorBoundary/CaptureErrorSnackbar.vue';

export default {
  name: 'AppLayoutWarn',
  components: {
    AppLayoutHeader,
    CaptureErrorSnackbar,
  },

  data() {
    return {
      // TODO namespace should come from Model, but Model currently wraps Space and Time individually.
      // Can we move Model here (or even at the AppLayout.vue level?)
      namespace: 'Sisters',
      ready: false,
    };
  },
};
</script>

<style scoped></style>
