<template>
  <div>
    <v-snackbar v-model="snackbar" timeout="5000"
      >Message: {{ confirmationMessage }}
      <template v-slot:action="{ attrs }">
        <v-btn color="red" text v-bind="attrs" @click="snackbar = false">
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script>
export default {
  name: 'ConfirmationSnackbar',
  props: {
    confirmationMessage: String,
  },

  data() {
    return { snackbar: true };
  },
  mounted() {
    console.log('Snackbar mounted');
  },
};
</script>

<style lang="scss" scoped></style>
