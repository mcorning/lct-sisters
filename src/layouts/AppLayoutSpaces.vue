<template>
  <div>
    <slot />
  </div>
</template>

<script>
export default {
  name: 'AppLayoutSpaces',

  components: {},
  data() {
    return {
      snackbar: true,
    };
  },
};
</script>

<style scoped></style>
