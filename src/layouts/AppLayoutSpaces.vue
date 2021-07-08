<template>
  <!--  <div>
    <State>
      <div slot-scope="{ state }">
        Session ID {{ state.sessionID }}
        <div v-if="!state.sessionID">
          <v-snackbar
            v-model="snackbar"
            bottom
            left
            timeout="-1"
            height="100px"
          >
            Ready to beat this thing?
            <template v-slot:action="{ attrs }">
              <v-btn text color="#00f500" v-bind="attrs" to="/welcome">
                Yes
              </v-btn>
              <v-btn icon class="ml-4" @click="snackbar = false">
                <v-icon>close</v-icon>
              </v-btn>
            </template>
          </v-snackbar>
        </div>
      </div>
    </State> -->
  <div>
    <slot />
  </div>
  <!-- </div> -->
</template>

<script>
export default {
  name: 'AppLayoutSpaces',
  components: {
    // State: () => import('../components/renderless/State.vue'),
  },
  data() {
    return {
      snackbar: true,
    };
  },
};
</script>

<style scoped></style>
