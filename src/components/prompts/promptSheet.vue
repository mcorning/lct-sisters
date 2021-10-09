<template>
  <div class="text-center">
    <v-sheet
      class="px-7 pt-7 pb-4 mx-auto text-center d-inline-block"
      color="blue-grey darken-3"
      dark
    >
      <div class="grey--text text--lighten-1 text-body-2 mb-4">
        {{ message }}
      </div>
      <v-text-field v-model="vModel" :label="label" />
      <v-btn class="ma-1" color="grey" plain>
        <v-icon>close</v-icon>
      </v-btn>

      <v-btn class="ma-1" color="error" plain @click="$emit(event, vModel)">
        <v-icon>check</v-icon>
      </v-btn>
    </v-sheet>
  </div>
</template>

<script>
export default {
  name: 'promptSheet',
  props: {
    message: {
      type: String,
      default: 'Proceed?',
    },
    event: String,
    label: String,
  },
  data() {
    return {
      vModel: '',
    };
  },
};
</script>

<style lang="scss" scoped></style>
