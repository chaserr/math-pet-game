import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';

const routes = [
  { path: '/login', name: 'login', component: () => import('../views/LoginView.vue'), meta: { guest: true } },
  { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },
  { path: '/quiz', name: 'quiz', component: () => import('../views/QuizView.vue') },
  { path: '/shop', name: 'shop', component: () => import('../views/ShopView.vue') },
  { path: '/pets', name: 'pets', component: () => import('../views/PetHouseView.vue') },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (!to.meta.guest && !auth.isLoggedIn) return { name: 'login' };
  if (to.meta.guest && auth.isLoggedIn) return { name: 'home' };
});

export default router;
