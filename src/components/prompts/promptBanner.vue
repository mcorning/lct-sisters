<template>
  <div>
    <!-- Used in Space.vue -->
    <v-banner v-model="banner">
      <v-text-field
        value="model"
        @input="updateSetting"
        :label="label"
        :hint="hint"
        persistent-hint
      />
      <template v-slot:actions="{ dismiss }">
        <!-- <v-btn color="green" text input-value @click="updateSetting">
          Save
        </v-btn> -->
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
    updateUsernumber: Function,
    connectMe: Function,
    label: String,
    hint: String,
  },
  data() {
    return { banner: this.needsUsername, model: '', ready: false };
  },
  methods: {
    updateSetting() {
      this.updateUsernumber(this.model);
      this.banner = false;
      // Model doesn't handle connectMe() anymore (it's in AppLayoutHeader.vue)
      //call into Model here:
      // const msg = this.connectMe({ username: this.model });
      // console.log(msg);
    },
  },
  watch: {
    ready() {
      console.log();
    },
  },

  mounted() {
    this.ready = true;
    console.log('promptBanner mounted');
  },
};
</script>

<style lang="scss" scoped></style>
