import Vue from 'vue';
import VueRouter from 'vue-router';
import Map from '@/views/Map.vue';
import Calendar from '@/views/Calendar.vue';

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'Spaces',
    component: Map,
    props: true,
  },
  {
    path: '/calendar',
    name: 'Calendar',
    component: Calendar,
    props: true,
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
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
});

export default router;
