import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { useSyncExternalStore } from 'react';
import { createNativeSessionReader } from './sessionIdentity';

export type MobileConfig = { preview: boolean; url: string; key: string; token: string | null; userId: string | null; route?: string; nativeVoice?:boolean };
let config: MobileConfig;
export const { getSessionUser, getSessionFactors } = createNativeSessionReader(() => config);
export let supabase: SupabaseClient;
type AuthSnapshot = { user: (Pick<User, 'id'> & Partial<User>) | null };
let authSnapshot: AuthSnapshot = { user: null };
const authListeners = new Set<() => void>();
const subscribeAuth = (listener: () => void) => { authListeners.add(listener); return () => { authListeners.delete(listener); }; };
const readAuth = () => authSnapshot;
let identityRequest = 0;
export async function refreshIdentity() {
  const request = ++identityRequest;
  const id = config?.userId;
  if (!id || config.preview || !config.token) return;
  const { data } = await getSessionUser();
  if (request !== identityRequest || !data.user || config.preview || !config.token || config.userId !== id) return;
  const { data: profile } = await supabase.from('profiles')
    .select('display_name,full_name,username,bio,profile_image_url,avatar_url,primary_role_key,artist_type,city,country,grade')
    .eq('id', id).maybeSingle();
  if (request !== identityRequest || config.preview || !config.token || config.userId !== id) return;
  // Canonical profile edits take precedence over older OAuth metadata. Never
  // use this presentation metadata to grant server permissions or token rights.
  const metadata = { ...data.user.user_metadata };
  if (profile) for (const [key, value] of Object.entries(profile)) {
    if (value !== null) metadata[key] = value;
  }
  if (profile?.display_name || profile?.full_name) metadata.display_name = profile.display_name || profile.full_name;
  const user = { ...data.user, user_metadata: metadata };
  if(JSON.stringify(authSnapshot.user) === JSON.stringify(user)) return;
  authSnapshot = { user };
  authListeners.forEach(listener => listener());
}
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
  void refreshIdentity().catch(() => undefined);
}

export function updateToken(token: string | null) {
  if (!config) return;
  config.token = token;
  if (!token) identityRequest++;
  publishIdentity(!config.preview && token ? config.userId : null);
  if (!config.preview) {
    if (token) void supabase.realtime.setAuth(token).catch(() => undefined);
    else void supabase.removeAllChannels();
  }
  if (token) void refreshIdentity().catch(() => undefined);
}

export default function NativeNav() { return null; }
