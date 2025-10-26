import { createRouter, createWebHistory } from 'vue-router';
import LandingPage from '../views/LandingPage.vue';
import MainLayout from '../layouts/MainLayout.vue';
import authService from '@/services/authService';
import AdminDashboard from '../admin/AdminDashboard.vue';
import TeamsManager from '../admin/TeamsManager.vue';
import MembersManager from '../admin/MembersManager.vue';
import SprintsManager from '../admin/SprintsManager.vue';
import RetrosManager from '../admin/RetrosManager.vue';
import RetroBoard from '@/views/RetroBoard.vue';
import CompaniesManager from '@/admin/CompaniesManager.vue';
import ContactPage from '@/views/ContactPage.vue';
import Legales from '@/views/Legales.vue';
import ConnectionPage from '@/views/ConnectionPage.vue';
const routes = [
  {
    path: '/',
    name: '/',
    component: LandingPage,
    meta: { public: true },
  },
  {
    path: '/',
    name: 'Landing',
    component: LandingPage,
    meta: { public: true },
  },
  {
    path: '/connection',
    name: 'Connection',
    component: ConnectionPage,
    meta: { public: true },
  },
  {
    path: '/legales',
    name: 'Legales',
    component: Legales,
    meta: { public: true },
  },
  {
    path: '/contact',
    name: 'Contact',
    component: ContactPage,
    meta: { public: true },
  },
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '/retro',
        name: 'Retro',
        component: RetroBoard,
        props: true,
      },
      {
        path: '/admin',
        name: 'AdminDashboard',
        component: AdminDashboard,
        props: true,
        meta: { requiresAuth: true, requiresScrumMaster: true },
      },
      {
        path: '/admin/companies',
        name: 'CompaniesManager',
        component: CompaniesManager,
        props: true,
        meta: { requiresAuth: true, requiresScrumMaster: true },
      },
      {
        path: '/admin/teams',
        name: 'TeamsManager',
        component: TeamsManager,
        props: true,
        meta: { requiresAuth: true, requiresScrumMaster: true },
      },
      {
        path: '/admin/members',
        name: 'MembersManager',
        component: MembersManager,
        props: true,
        meta: { requiresAuth: true, requiresScrumMaster: true },
      },
      {
        path: '/admin/sprints',
        name: 'SprintManager',
        component: SprintsManager,
        props: true,
        meta: { requiresAuth: true, requiresScrumMaster: true },
      },
      {
        path: '/admin/retros',
        name: 'RetrosManager',
        component: RetrosManager,
        props: true,
        meta: { requiresAuth: true, requiresScrumMaster: true },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const user = authService.getUser();

  if (to.meta.requiresAuth && !user) {
    next({ name: '/' });
  } else if (to.meta.requiresScrumMaster && !user?.isScrumMaster) {
    next({ name: '/' });
  } else {
    next();
  }
});

export default router;
