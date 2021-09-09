<template>
  <Model>
    <div
      slot-scope="{ isConnected, needsUsername, state, updateLoggedVisitId }"
    >
      <AppLayoutHeader
        :namespace="namespace"
        :isConnected="isConnected"
        :needsUsername="needsUsername"
        :state="state"
        :updateLoggedVisitId="updateLoggedVisitId"
      />
      <CaptureErrorSnackbar>
        <slot />
      </CaptureErrorSnackbar>

      <AppLayoutFooter /></div
  ></Model>
</template>
<script>
import Model from '../components/renderless/Model.vue';

import AppLayoutHeader from '@/layouts/AppLayoutHeader';
import AppLayoutFooter from '@/layouts/AppLayoutFooter';
import CaptureErrorSnackbar from '@/components/errorBoundary/CaptureErrorSnackbar.vue';

export default {
  name: 'DefaultLayout',
  components: {
    AppLayoutFooter,
    AppLayoutHeader,
    CaptureErrorSnackbar,
    Model,
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
