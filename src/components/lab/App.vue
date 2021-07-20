<template>
  <div id="app">
    <h2>CaptureErrorSnackbar</h2>
    <CaptureErrorSnackbar>
      <ErrorThrowerButton />
    </CaptureErrorSnackbar>
  </div>
</template>

<script>
import CaptureErrorSnackbar from './CaptureErrorSnackbar';
import ErrorThrowerButton from './ErrorThrowerButton';

export default {
  name: 'App',
  components: {
    CaptureErrorSnackbar,
    ErrorThrowerButton,
  },
};
</script>

<style></style>
