<template>
  <v-tooltip :left="left" :bottom="bottom">
    <template v-slot:activator="{ on, attrs }">
      <v-btn v-bind="attrs" v-on="on" text :color="color" @click="click">
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
    bottom: {
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
    left: {
      type: Boolean,
      default: false,
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
