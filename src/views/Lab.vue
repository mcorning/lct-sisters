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
  data() {
    return {
      key: [['Gathering', [['1639100997131-0', ['uid', 'ed8de5f32d6d1bff']]]]],
    };
  },
};
</script>
