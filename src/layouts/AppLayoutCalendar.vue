<template>
  <div>
    <slot @logVisit="onLogVisit" />
  </div>
</template>

<script>
export default {
  name: 'AppLayoutCalendar',

  methods: {
    onLogVisit() {
      alert('good');
    },
  },
};
</script>

<style scoped></style>
