import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';

const routes = [
  { path: '/login', name: 'login', component: () => import('../views/LoginView.vue'), meta: { guest: true } },
  { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },
  { path: '/stages', name: 'stages', component: () => import('../views/StageSelectView.vue') },
  { path: '/quiz', name: 'quiz', component: () => import('../views/QuizView.vue') },
  { path: '/shop', name: 'shop', component: () => import('../views/ShopView.vue') },
  { path: '/pets', name: 'pets', component: () => import('../views/PetHouseView.vue') },
  { path: '/textbook', name: 'textbook', component: () => import('../views/TextbookView.vue') },
  { path: '/lesson', name: 'lesson', component: () => import('../views/LessonView.vue') },
  { path: '/pinyin', name: 'pinyin', component: () => import('../views/PinyinHubView.vue') },
  { path: '/reading', name: 'reading', component: () => import('../views/ReadingHubView.vue') },
  { path: '/division-hub',  name: 'division-hub',   component: () => import('../views/DivisionHubView.vue') },
  { path: '/intro/division', name: 'division-intro', component: () => import('../views/DivisionIntroView.vue') },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  await auth.whenReady();
  if (!to.meta.guest && !auth.isLoggedIn) return { name: 'login' };
  if (to.meta.guest && auth.isLoggedIn) return { name: 'home' };
});

export default router;
