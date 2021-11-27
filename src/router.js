import Vue from 'vue';
import VueRouter from 'vue-router';
import Space from '@/views/Space.vue';
import Time from '@/views/Time.vue';
import Sponsor from '@/views/Sponsor.vue';
Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'Space',
    component: Space,
    props: true,
  },
  {
    path: '/sponsor/',
    name: 'Sponsor',
    component: Sponsor,
    props: true,
  },
  {
    path: '/sponsor/:id',
    name: 'Sponsor',
    component: Sponsor,
    props: true,
  },

  {
    path: '/warning',
    name: 'Warn',
    component: () => import('@/views/Warning.vue'),
    props: true,
  },
  {
    path: '/lab',
    name: 'Lab',
    component: () => import('@/views/Lab.vue'),
    props: true,
  },
  {
    path: '/time',
    name: 'Time',
    component: Time,
    props: true,
  },
  {
    path: '/monitor',
    name: 'Monitor',
    component: () => import('@/views/Monitor.vue'),
    props: true,
  },
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
});

export default router;
