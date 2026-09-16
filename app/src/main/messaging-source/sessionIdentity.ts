import type { SupabaseClient, User } from '@supabase/supabase-js';

export type NativeSessionIdentity = { preview: boolean; url: string; key: string; token: string | null; userId: string | null };

/** Auth stays owned by Kotlin. These reads never create/refresh a JS session. */
export function createNativeSessionReader(current: () => NativeSessionIdentity | undefined, request: typeof fetch = fetch) {
  const getSessionUser = async (_client?: SupabaseClient) => {
    const session = current();
    const failure = () => ({ data: { user: null }, error: new Error('Session indisponible. Reconnecte-toi.') });
    if (!session || session.preview || !session.token || !session.userId) return failure();
    const { token, userId, url, key } = session;
    try {
      const response = await request(`${url.replace(/\/$/, '')}/auth/v1/user`, {
        headers: { apikey: key, Authorization: `Bearer ${token}` }, cache: 'no-store',
      });
      if (!response.ok) return failure();
      const user = await response.json() as User;
      // Discard a read that completes after logout or an account switch.
      const latest = current();
      if (!latest?.token || latest.preview || latest.userId !== userId || user.id !== userId) return failure();
      return { data: { user }, error: null };
    } catch { return failure(); }
  };
  const getSessionFactors = async (client?: SupabaseClient) => {
    const { data, error } = await getSessionUser(client);
    if (error || !data.user) return { data: null, error };
    const all = data.user.factors ?? [];
    return { data: { all, totp: all.filter(f => f.factor_type === 'totp' && f.status === 'verified'),
      phone: all.filter(f => f.factor_type === 'phone' && f.status === 'verified') }, error: null };
  };
  return { getSessionUser, getSessionFactors };
}
