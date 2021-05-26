<template>
  <v-card>
    <v-card-title>LCT Auditor</v-card-title>
    <v-card-subtitle>A transient record of runtime events</v-card-subtitle>
    <v-card-text>
      Log:<br />
      {{ log }}
    </v-card-text>
    <v-card-actions>
      <v-btn text @click="$emit('endReview')"> Close</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
export default {
  props: {
    auditor: Object,
  },
  computed: {
    log() {
      const x = [...this.auditor.getLog()];
      return x;
    },
  },
};
</script>
