<template>
  <div>
    <CaptureErrorSnackbar>
      <v-btn v-if="test" @click="throwError">Throw error</v-btn>
      <welcome-card />
    </CaptureErrorSnackbar>
  </div>
</template>

<script>
import CaptureErrorSnackbar from '@/components/errorBoundary/CaptureErrorSnackbar.vue';
import WelcomeCard from '@/components/cards/welcomeCard';

export default {
  name: 'AppLayoutWelcome',
  components: {
    CaptureErrorSnackbar,
    WelcomeCard,
  },
  data() {
    return {
      test: false,
    };
  },
  methods: {
    throwError() {
      throw new Error('Oops, something went wrong!');
    },
  },
  mounted() {
    console.log('\tAppLayoutWelcome.vue mounted');
  },
};
</script>

<style scoped></style>
