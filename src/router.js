import Vue from 'vue';
import VueRouter from 'vue-router';
import Hub from '@/views/Hub.vue';
import Customer from '@/views/Customer.vue';
import Space from '@/views/Space.vue';
import Time from '@/views/Time.vue';
import Sponsor from '@/views/Sponsor.vue';
Vue.use(VueRouter);

const routes = [
  {
    path: '/hub',
    name: 'Hub',
    component: Hub,
    meta: { layout: 'AppLayoutBlank' },

    props: true,
  },
  {
    path: '/',
    name: 'Space',
    component: Space,
    props: true,
  },
  {
    path: '/sponsor',
    name: 'Sponsor',
    component: Sponsor,
    meta: { layout: 'AppLayoutRewards' },
    props: true,
  },
  {
    path: '/redeem',
    name: 'RedeemingSponsor',
    component: Sponsor,
    meta: { layout: 'AppLayoutRewards' },
    props: true,
  },
  {
    path: '/customer/:id',
    name: 'Sponsor2Customer',
    component: Customer,
    meta: { layout: 'AppLayoutRewards' },
    props: true,
  },
  {
    path: '/customer',
    // path:'/',
    name: 'Customer',
    component: Customer,
    meta: { layout: 'AppLayoutRewards' },
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
