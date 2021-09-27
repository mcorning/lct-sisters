<template>
  <v-container>
    <v-row no-gutters align="start">
      <v-col cols="10" sm="11">
        <v-textarea
          :value="status"
          label="Status:"
          class="text-caption ml-0"
          no-resize
          outlined
          row-height="10"
          rows="4"
          dense
          hide-details
          readonly
      /></v-col>
      <v-col cols="2" sm="1">
        <v-btn class="ml-2" text @click="toggleStatus()"
          ><v-icon>cancel</v-icon></v-btn
        >
        <v-btn class="ml-2" text @click="copyStatus"
          ><v-icon>content_copy</v-icon></v-btn
        >
        <v-btn class="ml-2" text @click="cutStatus"
          ><v-icon>content_cut</v-icon></v-btn
        >
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  data() {
    return {};
  },
  props: {
    status: {
      type: String,
      default: 'Status:',
    },
    toggleStatus: Function,
    copyStatus: Function,
    cutStatus: Function,
  },
  methods: {},
};
</script>

<style lang="scss" scoped></style>
