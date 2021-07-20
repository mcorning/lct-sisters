<template>
  <div class="ErrorThrowerButton">
    <v-btn @click="throwError">Throw error</v-btn>
  </div>
</template>

<script>
export default {
  methods: {
    throwError() {
      throw new Error('Oops, something went wrong!');
    },
  },
};
</script>
