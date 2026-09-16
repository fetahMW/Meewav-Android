import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { useSyncExternalStore } from 'react';
import { createNativeSessionReader } from './sessionIdentity';

export type MobileConfig = { preview: boolean; url: string; key: string; token: string | null; userId: string | null; route?: string; nativeVoice?:boolean };
let config: MobileConfig;
export const { getSessionUser, getSessionFactors } = createNativeSessionReader(() => config);
export let supabase: SupabaseClient;
type AuthSnapshot = { user: { id: string } | null };
let authSnapshot: AuthSnapshot = { user: null };
const authListeners = new Set<() => void>();
const subscribeAuth = (listener: () => void) => { authListeners.add(listener); return () => { authListeners.delete(listener); }; };
const readAuth = () => authSnapshot;
function publishIdentity(userId: string | null) {
  if ((authSnapshot.user?.id ?? null) === userId) return;
  authSnapshot = { user: userId ? { id: userId } : null };
  authListeners.forEach(listener => listener());
}
// Stable identity across renders/refreshes: a fresh object here re-triggered
// every profile effect on every render and caused endless backend requests.
export const useAuth = () => useSyncExternalStore(subscribeAuth, readAuth, readAuth);
export const isLocalAuthPreviewEnabled = () => config?.preview === true;
export const previewEnabled = isLocalAuthPreviewEnabled;
export const nativeVoiceEnabled = () => config?.nativeVoice === true;

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
  publishIdentity(!value.preview && value.token ? value.userId : null);
}

export function updateToken(token: string | null) {
  if (!config) return;
  config.token = token;
  publishIdentity(!config.preview && token ? config.userId : null);
  if (!config.preview) {
    if (token) void supabase.realtime.setAuth(token).catch(() => undefined);
    else void supabase.removeAllChannels();
  }
}

export default function NativeNav() { return null; }
