import Vue from 'vue';
import VueRouter from 'vue-router';
import Space from '@/views/Space.vue';
// import Time from '@/components/Calendar.vue';
import Time from '@/views/Time.vue';

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'Space',
    component: Space,
    props: true,
  },
  {
    path: '/time',
    name: 'Time',
    component: Time,
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
