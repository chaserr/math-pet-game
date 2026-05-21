import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router/index.js';
import { useAuthStore } from './stores/auth.js';
import App from './App.vue';
import './style.css';

const app = createApp(App);
app.use(createPinia());

// 先初始化登录态，再挂载路由，避免守卫误判
const auth = useAuthStore();
auth.init().finally(() => {
  app.use(router);
  app.mount('#app');
});
