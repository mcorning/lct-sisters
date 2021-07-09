import Vue from 'vue';
import VueRouter from 'vue-router';

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'Spaces',
    component: () => import('@/components/GoogleMap.vue'),
    props: true,

    meta: {
      layout: 'AppLayoutSpaces',
    },
  },
  {
    path: '/welcome',
    name: 'Welcome',
    component: () => import('@/components/Welcome.vue'),
    props: true,
    meta: {
      layout: 'AppLayoutWelcome',
    },
  },

  {
    path: '/warning',
    name: 'Warn',
    component: () => import('@/components/Warning.vue'),
    props: true,
    meta: {
      layout: 'AppLayoutWarn',
    },
  },
  {
    path: '/calendar',
    name: 'Calendar',
    component: () => import('@/components/Calendar.vue'),
    props: true,
    meta: {
      layout: 'AppLayoutCalendar',
    },
  },
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
});

export default router;
