import Vue from 'vue';
import VueRouter from 'vue-router';
import GoogleMap from '@/views/GoogleMap.vue';

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'Spaces',
    component: GoogleMap,
    props: true,

    meta: {
      layout: 'AppLayoutSpaces',
    },
  },
  {
    path: '/welcome',
    name: 'Welcome',
    component: () => import('@/views/Welcome.vue'),
    props: true,
    meta: {
      layout: 'AppLayoutWelcome',
    },
  },

  {
    path: '/warning',
    name: 'Warn',
    component: () => import('@/views/Warning.vue'),
    props: true,
    meta: {
      layout: 'AppLayoutWarn',
    },
  },
  {
    path: '/calendar',
    name: 'Calendar',
    component: () => import('@/views/Calendar.vue'),
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
