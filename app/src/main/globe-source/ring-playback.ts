import { RING_AUDIO_URL } from './ring-audio';

export function createRingPlayback(canPlay: () => boolean) {
  const audio = RING_AUDIO_URL ? new Audio(RING_AUDIO_URL) : null;
  if (audio) { audio.preload = 'metadata'; audio.loop = true; }
  let requested = false, playing = false, pending = false, disposed = false;
  let generation = 0, error = '';
  let lastState: ReturnType<typeof state> | null = null;
  const state = () => ({ playing, pending, available: !disposed && canPlay(), error });
  const publish = () => {
    if (disposed) return;
    const available = canPlay();
    if (lastState?.playing === playing && lastState.pending === pending &&
      lastState.available === available && lastState.error === error) return;
    const detail = { playing, pending, available, error };
    lastState = detail;
    window.dispatchEvent(new CustomEvent('meewav:ring-playback', { detail }));
  };
  const pause = () => {
    generation++; requested = playing = pending = false;
    audio?.pause(); publish();
  };
  const onPlaying = () => {
    if (audio?.paused) return;
    if (!requested || !canPlay() || disposed) { pause(); return; }
    playing = true; pending = false; publish();
  };
  const onWaiting = () => { playing = false; pending = requested; publish(); };
  const onPause = () => {
    if (audio && !audio.paused) return;
    generation++; requested = playing = pending = false; publish();
  };
  const onError = () => { error = 'Le morceau ne peut pas être lu. Réessaie.'; pause(); };
  const hidden = () => { if (document.hidden) pause(); else publish(); };
  const otherMedia = (event: Event) => { if (event.target !== audio) pause(); };
  audio?.addEventListener('playing', onPlaying);
  audio?.addEventListener('waiting', onWaiting);
  audio?.addEventListener('pause', onPause);
  audio?.addEventListener('error', onError);
  document.addEventListener('visibilitychange', hidden);
  document.addEventListener('play', otherMedia, true);
  window.addEventListener('pagehide', pause);
  window.addEventListener('meewav:ring-portrait-select', pause);
  return {
    get playing() { return playing; },
    state,
    refresh() { if (!canPlay() && requested) pause(); else publish(); },
    pause,
    toggle() {
      if (requested || playing || pending) { pause(); return; }
      if (disposed || !canPlay()) return;
      const attempt = ++generation;
      error = ''; requested = pending = true; publish();
      // Sans morceau configuré, permet de préparer la rotation indépendamment.
      if (!audio) { onPlaying(); return; }
      if (audio.error) audio.load();
      // L’appel reste dans le tap utilisateur, requis par Android WebView.
      void audio.play().catch(() => {
        if (disposed || attempt !== generation) return;
        onError();
      });
    },
    dispose() {
      pause(); disposed = true;
      document.removeEventListener('visibilitychange', hidden);
      document.removeEventListener('play', otherMedia, true);
      window.removeEventListener('pagehide', pause);
      window.removeEventListener('meewav:ring-portrait-select', pause);
      if (!audio) return;
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('error', onError);
      audio.removeAttribute('src'); audio.load();
    },
  };
}
