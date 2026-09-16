import { useAuth as useNativeAuth } from '../messaging-source/runtime';
export { configure, previewEnabled, updateToken, supabase, getSessionUser, getSessionFactors, type MobileConfig } from '../messaging-source/runtime';
export function useAuth() {
  const { user } = useNativeAuth();
  return { user, status: user ? 'authenticated' : 'anonymous', error: null };
}
export default function NativeNav() { return null; }
