<template>
  <div>
    <v-banner v-model="banner">
      <v-text-field
        v-model="model"
        :label="label"
        :hint="hint"
        persistent-hint
      />
      <template v-slot:actions="{ dismiss }">
        <v-btn color="green" text input-value @click="updateSetting">
          Save
        </v-btn>
        <v-btn color="red" text @click="dismiss">Dismiss </v-btn>
      </template>
    </v-banner>
  </div>
</template>

<script>
export default {
  name: 'promptBanner',
  props: {
    needsUsername: Boolean,
    updateUsername: Function,
    label: String,
    hint: String,
  },
  data() {
    return { banner: this.needsUsername, model: '' };
  },
  methods: {
    updateSetting() {
      this.updateUsername(this.model);
      this.banner = false;
    },
  },
  mounted() {
    console.log('promptBanner mounted');
  },
};
</script>

<style lang="scss" scoped></style>
