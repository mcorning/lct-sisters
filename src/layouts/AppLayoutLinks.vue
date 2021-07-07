<template>
  <div id="nav">
    <!-- be sure the to prop uses the same name in -->
    <router-link to="/">Welcome</router-link> |
    <router-link to="/spaces">Spaces</router-link> |
    <router-link to="/warning">Warn</router-link> |
    <router-link to="/calendar">Calendar</router-link> |
  </div>
</template>

<script>
export default {
  name: 'AppLayoutLinks',
};
</script>

<style scoped>
#nav {
  padding: 30px;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  color: #42b983;
}
</style>
