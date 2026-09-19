import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Settings2, X } from 'lucide-react';
import './director-web/src/features/rooms/place/place-room.css';
import './director-web/src/features/rooms/place/place-room-premium.css';
import './director-web/src/features/rooms/place/place-room-shell.css';
import PlaceStage from './director-web/src/features/rooms/place/PlaceStage';
import { createPlaceDemoState } from './director-web/src/features/rooms/place/place.fixtures';
import { RoomPresentationProvider, WAVE_ROOM_PRESENTATION } from './director-web/src/features/rooms/roomPresentation';
import RoomSupportPanel from './director-web/src/features/rooms/place/RoomSupportPanel';
import { getRoomSupportWallet } from './director-web/src/features/rooms/place/roomSupport';
import { useRoomSupportThrows } from './director-web/src/features/rooms/place/useRoomSupportThrows';
import type { PlaceRoomState } from './director-web/src/features/rooms/place/place.types';
import './room-video-director.css';

// The web director owns composition, source selection, public vs personal view,
// transitions and its navbar. This adapter only owns Android-local devices/demo.
export default function RoomVideoDirector({ isViewer = false, title = 'La Wave', native = false,
  onExpandedChange, onMicrophoneChange }: { isViewer?: boolean; title?: string; native?: boolean;
  onExpandedChange?: (expanded: boolean) => void; onMicrophoneChange?: (enabled: boolean) => void }) {
  const [room, setRoom] = useState<PlaceRoomState>(() => {
    const state = createPlaceDemoState('android-room-demo', 'wave');
    return { ...state, title, connectionLabel: 'Aperçu de démonstration',
      participants: state.participants.map(p => p.status === 'host'
        ? { ...p, videoUrl: '/media/wave/wave-session.mp4' } : p) };
  });
  const [expanded, setExpanded] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [cameraOn, setCameraOn] = useState(true);
  const [microphoneOn, setMicrophoneOn] = useState(false);
  const [monitoring, setMonitoring] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream>();
  const [micStream, setMicStream] = useState<MediaStream>();
  const camera = useRef<MediaStream | undefined>(undefined);
  const microphone = useRef<MediaStream | undefined>(undefined);
  const cameraGeneration = useRef(0);
  const microphoneGeneration = useRef(0);
  const facing = useRef<'user' | 'environment'>('user');
  const monitor = useRef<HTMLAudioElement>(null);
  const mounted = useRef(true);
  const wallet = useMemo(() => getRoomSupportWallet('demo', 'android-room-demo'), []);
  const support = useRoomSupportThrows({ wallet, recipientId: room.host.id, context: room.id,
    canEngage: isViewer, onError: setNotice });
  const localStreams = useMemo(() => cameraStream ? new Map([[room.host.id, cameraStream]]) : undefined, [cameraStream, room.host.id]);
  const stopDevices = useCallback(() => {
    ++cameraGeneration.current; ++microphoneGeneration.current;
    camera.current?.getTracks().forEach(t => t.stop()); camera.current = undefined;
    microphone.current?.getTracks().forEach(t => t.stop()); microphone.current = undefined;
    setCameraStream(undefined); setMicStream(undefined); setMicrophoneOn(false); setMonitoring(false);
    onMicrophoneChange?.(false);
  }, [onMicrophoneChange]);
  useEffect(() => {
    mounted.current = true;
    const suspend = () => { if (document.hidden) { stopDevices(); setCameraOn(false); } };
    document.addEventListener('visibilitychange', suspend);
    window.addEventListener('meewav:room-suspend', stopDevices);
    return () => { mounted.current = false; stopDevices(); document.removeEventListener('visibilitychange', suspend); window.removeEventListener('meewav:room-suspend', stopDevices); };
  }, [stopDevices]);
  useEffect(() => { if (!notice) return; const t = setTimeout(() => setNotice(''), 4500); return () => clearTimeout(t); }, [notice]);
  useEffect(() => {
    const audio = monitor.current;
    if (!audio) return;
    audio.srcObject = micStream ?? null;
    if (monitoring && micStream) void audio.play().catch(() => { setMonitoring(false); setNotice('Le retour audio n’a pas pu démarrer.'); });
    else audio.pause();
    return () => { audio.pause(); audio.srcObject = null; };
  }, [micStream, monitoring]);
  const startCamera = async (switchFacing = false) => {
    if (isViewer) return;
    const generation = ++cameraGeneration.current;
    if (switchFacing) facing.current = facing.current === 'user' ? 'environment' : 'user';
    camera.current?.getTracks().forEach(t => t.stop()); camera.current = undefined; setCameraStream(undefined);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: {
        facingMode: { ideal: facing.current }, width: { ideal: 1920 }, height: { ideal: 1080 },
      } });
      if (!mounted.current || generation !== cameraGeneration.current) { stream.getTracks().forEach(t => t.stop()); return; }
      camera.current = stream; setCameraStream(stream); setCameraOn(true);
      stream.getVideoTracks()[0].addEventListener('ended', () => { if (camera.current === stream) { setCameraOn(false); setCameraStream(undefined); } }, { once: true });
    } catch {
      if (mounted.current && generation === cameraGeneration.current) { setCameraOn(false); setNotice('Caméra indisponible. Autorise son accès dans les réglages Android puis réessaie.'); }
    }
  };
  const toggleCamera = () => {
    if (cameraOn) { ++cameraGeneration.current; camera.current?.getTracks().forEach(t => t.stop()); camera.current = undefined; setCameraStream(undefined); setCameraOn(false); }
    else void startCamera();
  };
  const toggleMicrophone = async () => {
    if (isViewer) return;
    const generation = ++microphoneGeneration.current;
    if (microphoneOn) {
      microphone.current?.getTracks().forEach(t => t.stop()); microphone.current = undefined;
      setMicStream(undefined); setMicrophoneOn(false); setMonitoring(false); onMicrophoneChange?.(false); return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: { echoCancellation: true, noiseSuppression: true } });
      if (!mounted.current || generation !== microphoneGeneration.current) { stream.getTracks().forEach(t => t.stop()); return; }
      microphone.current = stream; setMicStream(stream); setMicrophoneOn(true); onMicrophoneChange?.(true);
      stream.getAudioTracks()[0].addEventListener('ended', () => { if (microphone.current === stream) { setMicrophoneOn(false); setMicStream(undefined); setMonitoring(false); onMicrophoneChange?.(false); } }, { once: true });
    } catch { if (mounted.current && generation === microphoneGeneration.current) setNotice('Micro indisponible. Autorise son accès dans les réglages Android puis réessaie.'); }
  };
  const setStageExpanded = (value: boolean) => {
    setExpanded(value); onExpandedChange?.(value);
    if (native) window.location.href = `https://appassets.androidplatform.net/native/director-size?expanded=${value}`;
  };
  const activeParticipants = room.participants.filter(p => p.status === 'host' || p.status === 'onstage');
  const selectDemoFormat = (id: string, format: string) => {
    if (id === 'host') { ++cameraGeneration.current; camera.current?.getTracks().forEach(t => t.stop()); camera.current = undefined; setCameraStream(undefined); setCameraOn(true); }
    setRoom(r => ({ ...r, participants: r.participants.map(p => p.id !== id ? p : {
      ...p, videoSources: undefined, videoUrl: format === 'short'
        ? '/media/shorts-demo/portrait-vocal-session.mp4'
        : p.id === 'host' ? '/media/wave/wave-session.mp4' : '/media/shorts-demo/landscape-guitar.mp4',
    }) }));
  };
  const profile = room.participants.find(p => p.profile.id === profileId)?.profile;
  return <RoomPresentationProvider presentation={WAVE_ROOM_PRESENTATION}>
    <div className={`rooms-page android-room-director${native ? ' is-native-embed' : ''}${expanded ? ' is-expanded' : ''}`}>
      <div className="place-room-shell"><div className="place-room-experience">
        <PlaceStage room={room} isHost={!isViewer} isGuest={false} canEngage={isViewer}
          currentUserId={isViewer ? 'android-room-demo' : room.host.id}
          hostCameraEnabled={cameraOn} hostMicrophoneEnabled={microphoneOn} hostMonitoringEnabled={monitoring}
          onToggleHostCamera={toggleCamera} onSwitchCamera={!isViewer ? () => void startCamera(true) : undefined}
          onToggleHostMicrophone={() => void toggleMicrophone()}
          onToggleHostMonitoring={() => { if (!micStream) setNotice('Active ton micro pour écouter le retour.'); else setMonitoring(v => !v); }}
          localCameraStreams={localStreams}
          onOpenDonation={() => setSupportOpen(true)} supportAction={support.action} onSupportThrow={() => void support.launch()}
          goldenUnavailable={room.currentUserHasGoldenLiked}
          onLike={() => setRoom(r => ({ ...r, currentUserHasLiked: !r.currentUserHasLiked, likesCount: r.likesCount + (r.currentUserHasLiked ? -1 : 1) }))}
          onGoldenLike={() => { if (room.currentUserHasGoldenLiked) return false; setRoom(r => ({ ...r, currentUserHasGoldenLiked: true, goldenLikesCount: r.goldenLikesCount + 1 })); return true; }}
          onVotePoll={() => {}} onNotice={setNotice} onOpenProfile={setProfileId}
          screenShareStream={null} screenSharePublished={false} screenShareRequesting={false} screenShareSupported={false}
          onStartScreenShare={() => {}} onStopScreenShare={() => {}}
          panelCollapsed={expanded} onPanelCollapsedChange={setStageExpanded} />
      </div></div>
      {!isViewer && <button className="android-director-sources" aria-label="Sources de la régie" aria-expanded={sourcesOpen} onClick={() => setSourcesOpen(v => !v)}><Settings2 size={17} /><span>Sources</span></button>}
      {sourcesOpen && <section className="android-director-sheet" role="dialog" aria-modal="true" aria-label="Sources de la régie">
        <header><strong>Sources · aperçu</strong><button aria-label="Fermer les sources" onClick={() => setSourcesOpen(false)}><X /></button></header>
        <p>Chaque source conserve son format desktop ou Short.</p>
        <label>Participants à l’antenne<select value={activeParticipants.length} onChange={e => {
          const count = Number(e.target.value);
          setRoom(r => ({ ...r, participants: r.participants.map((p, i) => i === 0 ? p : { ...p, status: i < count ? 'onstage' : 'backstage' }) }));
        }}>{[1, 2, 3, 4].map(n => <option key={n} value={n}>{n} participant{n > 1 ? 's' : ''}</option>)}</select></label>
        {activeParticipants.map(p => <label key={p.id}>{p.profile.displayName}<select aria-label={`Format de ${p.profile.displayName}`} value={p.videoUrl?.includes('portrait') ? 'short' : 'desktop'} onChange={e => selectDemoFormat(p.id, e.target.value)}><option value="desktop">Desktop · 16:9</option><option value="short">Short · 9:16</option></select></label>)}
        <button className="android-director-primary" onClick={() => { setSourcesOpen(false); void startCamera(); }}>Utiliser ma caméra</button>
      </section>}
      {supportOpen && <div className="android-director-modal"><RoomSupportPanel hostId={room.host.id} hostName={room.host.displayName} wallet={wallet} canEngage={isViewer} onClose={() => setSupportOpen(false)} prepared={support.prepared} onPrepare={support.prepare} onCancelPrepared={support.cancel} /></div>}
      {profile && <section className="android-director-sheet" role="dialog" aria-modal="true" aria-label="Artiste"><header><strong>{profile.displayName}</strong><button aria-label="Fermer le profil" onClick={() => setProfileId(null)}><X /></button></header><img width="56" height="56" src={profile.avatarUrl} alt="" /><p>{profile.role} · {profile.city}</p></section>}
      {notice && <div className="android-director-notice" role="status">{notice}</div>}
      <audio ref={monitor} hidden />
    </div>
  </RoomPresentationProvider>;
}
