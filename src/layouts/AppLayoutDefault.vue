<template>
  <div>
    <AppLayoutHeader :namespace="namespace" />
    <CaptureErrorSnackbar>
      <!-- <ErrorThrowerButton v-if="test" slot-scope="{ info }" /> -->
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
// these components are still experimental until we see they work across the app
import CaptureErrorSnackbar from '@/components/lab/CaptureErrorSnackbar.vue';
// import ErrorThrowerButton from '@/components/lab/ErrorThrowerButton';

export default {
  name: 'DefaultLayout',
  components: {
    AppLayoutFooter,
    AppLayoutHeader,
    State,
    CaptureErrorSnackbar,
    // ErrorThrowerButton,
  },
  data() {
    return {
      namespace: 'OR',
      test: true,
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
