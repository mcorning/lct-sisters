<template>
  <v-tooltip position>
    <slot />
    <span>{{ tip }}</span>
  </v-tooltip>
</template>

<script>
export default {
  name: 'tootip',
  props: {
    tip: String,
    position: { type: String, default: 'bottom' },
  },
};
</script>
