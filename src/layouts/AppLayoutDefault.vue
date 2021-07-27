<template>
  <div>
    <AppLayoutHeader :namespace="namespace" />
    <CaptureErrorSnackbar>
      <v-btn v-if="test" @click="throwError">Throw error</v-btn>
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
      namespace: 'OR',
      test: false,
      ready: false,
    };
  },
  methods: {
    throwError() {
      throw new Error('Oops, something went wrong!');
    },
    onStateAvailable(f) {
      console.log('onStateAvailable for all components');
      console.log(f({ action: 'test' }));
    },
  },
};
</script>
