<template>
  <v-tooltip position>
    <template v-slot:activator="{ on, attrs }">
      <v-icon color="primary" dark v-bind="attrs" v-on="on">
        {{ icon }}
      </v-icon>
    </template>
    <span>{{ tooltip }}</span>
  </v-tooltip>
</template>

<script>
export default {
  props: {
    tooltip: String,
    icon: String,
    position: { type: String, default: 'bottom' },
  },
};
</script>
