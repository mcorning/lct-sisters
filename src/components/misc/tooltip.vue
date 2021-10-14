<template>
  <v-tooltip position>
    <template v-slot:activator="{ on, attrs }">
      <slot v-bind="attrs" v-on="on" />
    </template>
    <span>{{ tip }}</span>
  </v-tooltip>
</template>

<script>
export default {
  name: 'tootipTemplate',
  props: {
    tip: String,
    position: { type: String, default: 'bottom' },
  },
};
</script>
