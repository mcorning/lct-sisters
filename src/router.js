import Vue from 'vue';
import VueRouter from 'vue-router';

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'Welcome',
    component: () => import('@/components/Welcome.vue'),
    meta: {
      layout: 'AppLayoutWelcome',
    },
  },
  {
    path: '/spaces',
    name: 'Spaces',
    component: () => import('@/components/GoogleMap.vue'),
    props: true,
    meta: {
      layout: 'AppLayoutSpaces',
    },
  },
  {
    path: '/warning',
    name: 'Warn',
    component: () => import('@/components/Warning.vue'),
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
