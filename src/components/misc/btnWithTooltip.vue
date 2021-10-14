<template>
  <v-tooltip :left="left" :bottom="bottom">
    <template v-slot:activator="{ on, attrs }">
      <v-btn
        :icon="isIconic"
        v-bind="attrs"
        v-on="on"
        text
        :color="color"
        @click="click"
      >
        <v-icon> {{ icon }} </v-icon>
      </v-btn>
    </template>
    <span>{{ tip }} </span>
  </v-tooltip>
</template>

<script>
export default {
  name: 'btnWithTooltip',
  props: {
    top: {
      type: Boolean,
      default: true,
    },
    bottom: {
      type: Boolean,
      default: false,
    },
    left: {
      type: Boolean,
      default: false,
    },

    left: {
      type: Boolean,
      default: false,
    },
    color: {
      type: String,
      default: 'grey darken-2',
    },
    icon: {
      type: String,
      default: 'mdi-close',
    },

    isIconic: {
      type: Boolean,
      default: true,
    },
    tip: {
      type: String,
      default: 'You could use a tooltip right about now',
    },
    click: { type: Function, default: () => alert('no click handler yet') },
  },
};
</script>

<style lang="scss" scoped></style>
