import { RING_AUDIO_URL } from './ring-audio';

export function createRingPlayback(canPlay: () => boolean) {
  const audio = new Audio();
  audio.preload = 'metadata'; audio.loop = true;
  let muted = false;
  try { muted = localStorage.getItem('meewav.ring-muted.v1') === 'true'; } catch { /* Optional preference. */ }
  audio.muted = muted;
  // Rotation and soundtrack have independent controls after the first Play.
  let audioRequested = false, playing = false, pending = false, disposed = false;
  let generation = 0, error = '';
  let sourceReady = false, sourceLoading = false, sourceUrl = '';
  const sourceRequest = new AbortController();
  let lastState: ReturnType<typeof state> | null = null;
  const available = () => !disposed && !sourceLoading && canPlay();
  const state = () => ({ playing, pending, muted, available: available(), error });
  const publish = () => {
    if (disposed) return;
    const available = state().available;
    if (lastState?.playing === playing && lastState.pending === pending &&
      lastState.available === available && lastState.error === error && lastState.muted === muted) return;
    const detail = { playing, pending, muted, available, error };
    lastState = detail;
    window.dispatchEvent(new CustomEvent('meewav:ring-playback', { detail }));
  };
  const pauseRotation = () => { playing = false; publish(); };
  const suspend = () => {
    generation++; audioRequested = playing = pending = false;
    audio.pause(); publish();
  };
  const onPlaying = () => {
    if (audio?.paused) return;
    if (!audioRequested || !canPlay() || disposed) { suspend(); return; }
    pending = false; publish();
  };
  const onWaiting = () => { pending = audioRequested; publish(); };
  const onPause = () => {
    if (audio && !audio.paused) return;
    generation++; audioRequested = pending = false; publish();
  };
  const onError = () => {
    error = 'Le morceau ne peut pas être lu. Réessaie.';
    audioRequested = pending = false; publish();
  };
  const hidden = () => { if (document.hidden) suspend(); else publish(); };
  // Read the small bundled track once through the asset interceptor. The media
  // decoder then seeks inside a Blob, without WebView HTTP range reads.
  const prepareSource = async () => {
    if (disposed || sourceLoading || sourceReady) return;
    sourceLoading = true; error = ''; publish();
    try {
      const response = await fetch(RING_AUDIO_URL, { signal: sourceRequest.signal });
      if (!response.ok) throw new Error('Local audio unavailable');
      const blob = await response.blob();
      if (!blob.size) throw new Error('Empty local audio');
      if (disposed) return;
      sourceUrl = URL.createObjectURL(blob);
      audio.src = sourceUrl;
      sourceReady = true;
      audio.load();
    } catch {
      if (!disposed) error = 'Chargement du morceau impossible. Appuie sur Play pour réessayer.';
    } finally {
      sourceLoading = false; publish();
    }
  };
  audio?.addEventListener('playing', onPlaying);
  audio?.addEventListener('waiting', onWaiting);
  audio?.addEventListener('pause', onPause);
  audio?.addEventListener('error', onError);
  document.addEventListener('visibilitychange', hidden);
  window.addEventListener('pagehide', suspend);
  window.addEventListener('meewav:ring-portrait-select', pauseRotation);
  void prepareSource();
  return {
    get playing() { return playing; },
    state,
    refresh() { if (!canPlay() && (audioRequested || playing || pending)) suspend(); else publish(); },
    suspend,
    toggleMuted() {
      if (disposed) return;
      muted = !muted; audio.muted = muted;
      try { localStorage.setItem('meewav.ring-muted.v1', String(muted)); } catch { /* Optional preference. */ }
      publish();
    },
    toggle() {
      if (playing) { pauseRotation(); return; }
      if (disposed || !canPlay()) return;
      if (!sourceReady) { void prepareSource(); return; }
      playing = true;
      // Resume rotation without restarting, seeking or pausing the soundtrack.
      if (audioRequested && !audio.paused) { publish(); return; }
      const attempt = ++generation;
      error = ''; audioRequested = pending = true; publish();
      if (audio.error) audio.load();
      // L’appel reste dans le tap utilisateur, requis par Android WebView.
      void audio.play().catch(() => {
        if (disposed || attempt !== generation) return;
        onError();
      });
    },
    dispose() {
      suspend(); disposed = true;
      sourceRequest.abort();
      document.removeEventListener('visibilitychange', hidden);
      window.removeEventListener('pagehide', suspend);
      window.removeEventListener('meewav:ring-portrait-select', pauseRotation);
      if (!audio) return;
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('error', onError);
      audio.removeAttribute('src'); audio.load();
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    },
  };
}
