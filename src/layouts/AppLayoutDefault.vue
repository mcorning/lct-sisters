<template>
  <div>
    <AppLayoutHeader :namespace="namespace" />
    <State>
      <div slot-scope="{ state, logVisit, isConnected, lastLoggedNodeId }">
        <slot
          :state="state"
          :isConnected="isConnected"
          :logVisit="logVisit"
          :lastLoggedNodeId="lastLoggedNodeId"
        />
      </div>
    </State>

    <AppLayoutFooter />
  </div>
</template>
<script>
import AppLayoutHeader from '@/layouts/AppLayoutHeader';
import AppLayoutFooter from '@/layouts/AppLayoutFooter';
import State from '@/components/renderless/State.vue';

export default {
  name: 'DefaultLayout',
  components: {
    AppLayoutFooter,
    AppLayoutHeader,
    State,
  },
  data() {
    return {
      namespace: 'OR',
    };
  },
  mounted() {},
};
</script>
