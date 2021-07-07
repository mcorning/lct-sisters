<template>
  <!-- the new layouts strategy still requires the v-app wrapper for vueitfy to work properly -->
  <v-app>
    <div id="app">
      <AppLayout>
        <router-view />
      </AppLayout>
    </div>
  </v-app>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>
