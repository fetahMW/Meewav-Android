import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type MobileConfig = { preview: boolean; url: string; key: string; token: string | null; userId: string | null; route?: string };
let config: MobileConfig;
export let supabase: SupabaseClient;
export const useAuth = () => ({ user: config?.userId ? { id: config.userId } : null });
export const isLocalAuthPreviewEnabled = () => config?.preview === true;
export const previewEnabled = isLocalAuthPreviewEnabled;

// The native SDK alone owns refresh and encrypted session persistence. The
// bundled client receives only the short-lived access token, kept in memory.
export function configure(value: MobileConfig) {
  config = value;
  supabase = createClient(value.preview ? 'https://preview.invalid' : value.url,
    value.preview ? 'preview-public-key' : value.key, {
      accessToken: async () => config.token,
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: (input, init) => {
        if (config.preview || !config.token) return Promise.reject(new Error('messaging_session_required'));
        return fetch(input, init);
      } },
    });
}

export function updateToken(token: string | null) {
  if (!config) return;
  config.token = token;
  if (!config.preview) {
    if (token) void supabase.realtime.setAuth(token).catch(() => undefined);
    else void supabase.removeAllChannels();
  }
}

export default function NativeNav() { return null; }
