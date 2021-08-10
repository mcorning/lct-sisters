<template>
  <div>
    <CaptureErrorSnackbar>
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
    return {};
  },
  methods: {},
  mounted() {
    console.log('\tAppLayoutWelcome.vue mounted');
  },
};
</script>

<style scoped></style>
