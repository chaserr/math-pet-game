<template>
  <div class="login-wrap center">
    <div class="card login-card col">
      <div class="logo">🧮</div>
      <h1>数字积木大冒险</h1>
      <p class="sub">{{ mode === 'login' ? '欢迎回来！' : '创建一个新账号开始冒险' }}</p>

      <input v-model="email" type="email" placeholder="邮箱" autocomplete="username" @keyup.enter="submit" />
      <input v-model="password" type="password" placeholder="密码（至少 6 位）" autocomplete="current-password" @keyup.enter="submit" />

      <p v-if="error" class="err">{{ error }}</p>

      <button class="btn-primary" :disabled="loading" @click="submit">
        {{ loading ? '请稍候…' : (mode === 'login' ? '登录' : '注册并开始') }}
      </button>

      <button class="switch" @click="toggle">
        {{ mode === 'login' ? '没有账号？去注册' : '已有账号？去登录' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';

const auth = useAuthStore();
const router = useRouter();

const mode = ref('login');
const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

function toggle() {
  mode.value = mode.value === 'login' ? 'register' : 'login';
  error.value = '';
}

async function submit() {
  error.value = '';
  if (!email.value || !password.value) { error.value = '请填写邮箱和密码'; return; }
  loading.value = true;
  try {
    if (mode.value === 'login') await auth.login(email.value.trim(), password.value);
    else await auth.register(email.value.trim(), password.value);
    router.push({ name: 'home' });
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-wrap { flex: 1; }
.login-card { padding: 36px 32px; width: 360px; gap: 14px; align-items: stretch; text-align: center; }
.logo { font-size: 64px; }
h1 { font-size: 26px; color: var(--primary-dark); }
.sub { color: #9b8b7a; font-size: 14px; margin-bottom: 6px; }
input {
  font-family: inherit; font-size: 16px; padding: 14px 16px;
  border: 2px solid #ffe1a3; border-radius: 14px; background: #fffdf8; outline: none;
}
input:focus { border-color: var(--primary); }
.err { color: #e85b5b; font-size: 14px; }
.switch { background: transparent; color: var(--accent-dark); padding: 6px; font-size: 14px; }
</style>
