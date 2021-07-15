<template>
  <div>
    <slot @cachedVisits="onCachedVisits" />
  </div>
</template>

<script>
export default {
  name: 'AppLayoutCalendar',

  methods: {
    onCachedVisits(data) {
      alert(data.length);
    },
  },
};
</script>

<style scoped></style>
