<template>
  <div>
    <AppLayoutHeader :namespace="namespace" />
    <CaptureErrorSnackbar>
      <slot :test="test" val="Test" />
    </CaptureErrorSnackbar>
  </div>
</template>

<script>
import AppLayoutHeader from '@/layouts/AppLayoutHeader';
import CaptureErrorSnackbar from '@/components/errorBoundary/CaptureErrorSnackbar.vue';

export default {
  name: 'AppLayoutTest',
  components: {
    AppLayoutHeader,
    CaptureErrorSnackbar,
  },
  props: {
    test: {
      type: Function,
    },
  },

  data() {
    return {
      // TODO namespace should come from Model, but Model currently wraps Space and Time individually.
      // Can we move Model here (or even at the AppLayout.vue level?)
      namespace: 'Sisters',
      ready: false,
    };
  },
  mounted() {
    this.test('in layout');
  },
};
</script>

<style scoped></style>
