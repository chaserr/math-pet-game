import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // 友好提示：未配置 .env
  console.error('[Supabase] 缺少配置：请在 client/.env 里设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(url || 'http://localhost', anonKey || 'missing', {
  auth: { persistSession: true, autoRefreshToken: true },
});

export const isConfigured = !!(url && anonKey);
