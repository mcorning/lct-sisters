<template>
  <div>
    <AppLayoutHeader :namespace="namespace" />
    <CaptureErrorSnackbar>
      <v-btn v-if="test" @click="throwError">Throw error</v-btn>

      <State>
        <div slot-scope="{ state, logVisit, isConnected, lastLoggedNodeId }">
          <slot
            :state="state"
            :isConnected="isConnected"
            :logVisit="logVisit"
            :lastLoggedNodeId="lastLoggedNodeId"
          />
        </div>
      </State>
    </CaptureErrorSnackbar>

    <AppLayoutFooter />
  </div>
</template>
<script>
import AppLayoutHeader from '@/layouts/AppLayoutHeader';
import AppLayoutFooter from '@/layouts/AppLayoutFooter';
import State from '@/components/renderless/State.vue';
import CaptureErrorSnackbar from '@/components/errorBoundary/CaptureErrorSnackbar.vue';

export default {
  name: 'DefaultLayout',
  components: {
    AppLayoutFooter,
    AppLayoutHeader,
    State,
    CaptureErrorSnackbar,
  },
  data() {
    return {
      namespace: 'OR',
      test: false,
    };
  },
  methods: {
    throwError() {
      throw new Error('Oops, something went wrong!');
    },
  },
  mounted() {},
};
</script>
