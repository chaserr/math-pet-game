import { defineStore } from 'pinia';
import { supabase } from '../supabase.js';
import { getProfile } from '../db.js';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,        // Supabase auth user
    points: 0,
    pets: [],          // 当前用户的宠物（HomeView 加载后写入，QuizView 用首只决定口粮掉落）
    ready: false,
    _readyPromise: null,
  }),
  getters: {
    isLoggedIn: (s) => !!s.user,
  },
  actions: {
    init() {
      if (this._readyPromise) return this._readyPromise;
      this._readyPromise = (async () => {
        try {
          // 给 supabase 最多 4 秒：网络不通时不要把首屏卡死
          // （getSession 在有过期 token 时会触发 refresh 网络请求，可能永久挂起）
          const res = await Promise.race([
            supabase.auth.getSession(),
            new Promise((_, rej) => setTimeout(() => rej(new Error('supabase getSession timeout')), 4000)),
          ]);
          const data = res?.data;
          if (data?.session?.user) {
            this.user = data.session.user;
            await this.refreshProfile();
          }
        } catch (e) { console.warn('[auth] init skipped:', e?.message || e); }
        this.ready = true;
      })();
      return this._readyPromise;
    },
    async whenReady() {
      if (this.ready) return;
      if (this._readyPromise) await this._readyPromise;
    },
    async refreshProfile() {
      try {
        const { points } = await getProfile();
        this.points = points;
      } catch { /* profile 可能尚未就绪 */ }
    },
    async register(email, password) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw new Error(translate(error.message));
      if (!data.session) {
        // 邮箱确认未关闭的情况
        throw new Error('注册成功，但该 Supabase 项目开启了邮箱验证。请在 Supabase 后台关闭 “Confirm email” 后重试。');
      }
      this.user = data.user;
      await this.refreshProfile();
    },
    async login(email, password) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(translate(error.message));
      this.user = data.user;
      await this.refreshProfile();
    },
    async logout() {
      await supabase.auth.signOut();
      this.user = null;
      this.points = 0;
    },
    setPoints(p) { this.points = p; },
    setPets(p) { this.pets = Array.isArray(p) ? p : []; },
  },
});

function translate(msg) {
  if (/Invalid login credentials/i.test(msg)) return '邮箱或密码错误';
  if (/User already registered/i.test(msg)) return '该邮箱已注册';
  if (/Password should be at least/i.test(msg)) return '密码太短（至少 6 位）';
  if (/Unable to validate email/i.test(msg)) return '邮箱格式不正确';
  return msg;
}
