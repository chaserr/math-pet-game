import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router/index.js';
import { useAuthStore } from './stores/auth.js';
import App from './App.vue';
import './style.css';

const app = createApp(App);
app.use(createPinia());
app.use(router);

// 登录态初始化转为非阻塞：立刻挂载，首屏先出现加载占位，再由路由守卫等待 ready
useAuthStore().init();
app.mount('#app');
