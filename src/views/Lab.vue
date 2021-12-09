<template>
  <v-row dense>
    <v-col>
      <mailToCard />
    </v-col>
  </v-row>
</template>

<script>
import mailToCard from '../components/misc/mailToCard';
export default {
  components: {
    mailToCard,
  },
};
</script>
