import Vue from 'vue';
import VueRouter from 'vue-router';
import Space from '@/views/Space.vue';
import Time from '@/views/Time.vue';
// import Test from '@/views/Test.vue';

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'Space',
    component: Space,
    props: true,
  },

  {
    path: '/warning',
    name: 'Warn',
    component: () => import('@/views/Warning.vue'),
    props: true,
    // TODO using this layout keeps Warning.vue from mounting more than once. odd...
    // meta: {
    //   layout: 'AppLayoutWarn',
    // },
  },
  {
    path: '/time',
    name: 'Time',
    component: Time,
    props: true,
  },
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
});

export default router;
