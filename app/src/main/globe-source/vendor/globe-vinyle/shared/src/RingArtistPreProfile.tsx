import { type CSSProperties, type RefObject, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { PreProfileFrame } from "./reference/features/globe/components/PreProfileFrame";
import HoverPreProfileContent from "./reference/features/globe/components/preProfile/HoverPreProfileContent";
import { getPreProfileArtistForSeed } from "./reference/features/globe/components/preProfile/demoPreProfileArtist";
import { sceneDemoArtist } from "./reference/features/shorts/sceneArtistPortraits";
import { getGradeBadgeMeta } from "./reference/features/grades/gradeBadges";
import "./ring-artist-preprofile.css";
import { mobileArtistPanel } from '../../../../mobile-artist-panel';
import { TopTenProfileNavigator, type ProfileNavigation } from './TopTenProfileNavigator';
import { TopTenProfilePages } from './TopTenProfilePages';
import { openArtistMessaging } from '../../../../messaging-navigation';

const RING_ARTIST_GRADE = getGradeBadgeMeta(6);

type PortraitSelection = {
  instanceId: number;
  slug: string;
  name: string;
  portraitUrl: string;
  gradeLevel?: number;
  anchor: { x: number; y: number; clearance: number; viewportWidth: number; viewportHeight: number };
};

export default function RingArtistPreProfile({ selection, onClose, navigation, profiles }: {
  selection: PortraitSelection; onClose: () => void; navigation?: ProfileNavigation; profiles?: PortraitSelection[];
}) {
  const panel = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const [viewport, setViewport] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }));

  // Keep the original 413 x 588 Rooms composition, fitting it only when needed.
  const margin = 16, leftGuard = viewport.width > 760 ? 112 : 88;
  const mobile = mobileArtistPanel(viewport);
  const scale = mobile?.scale ?? Math.min(1, (viewport.width - leftGuard - margin * 2) / 413, (viewport.height - 104) / 588);
  const width = 413 * scale, height = 588 * scale;
  const anchor = selection.anchor;
  const x = anchor.x * viewport.width / anchor.viewportWidth;
  const y = anchor.y * viewport.height / anchor.viewportHeight;
  const clearance = anchor.clearance * viewport.width / anchor.viewportWidth + 22;
  const right = x + clearance, left = x - clearance - width;
  const placement = right + width <= viewport.width - margin ? "right"
    : left >= leftGuard ? "left" : viewport.width - x >= x - leftGuard ? "right" : "left";
  const popupLeft = Math.max(leftGuard, Math.min(viewport.width - margin - width, placement === "right" ? right : left));
  const popupTop = Math.max(88, Math.min(viewport.height - margin - height, y - height * 0.45));

  useLayoutEffect(() => {
    const trigger = document.activeElement as HTMLElement | null;
    closeButton.current?.focus({ preventScroll: true });
    return () => {
      if (trigger?.isConnected && (document.activeElement === document.body || panel.current?.contains(document.activeElement))) {
        trigger.focus({ preventScroll: true });
      }
    };
  }, []);
  useEffect(() => {
    const resize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    const outside = (event: Event) => {
      if (event.target instanceof Node && !panel.current?.contains(event.target)) closeRef.current();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault(); event.stopPropagation(); closeRef.current();
    };
    window.addEventListener("resize", resize);
    document.addEventListener("pointerdown", outside, true);
    document.addEventListener("wheel", outside, { capture: true, passive: true });
    document.addEventListener("keydown", escape, true);
    return () => {
      window.removeEventListener("resize", resize);
      document.removeEventListener("pointerdown", outside, true);
      document.removeEventListener("wheel", outside, true);
      document.removeEventListener("keydown", escape, true);
    };
  }, []);

  return createPortal(<div ref={panel} className="ring-artist-preprofile" role="dialog" aria-modal="false"
    aria-label={`Pré-profil de ${selection.name}`} data-placement={placement}
    style={{ left: mobile?.left ?? popupLeft, top: mobile?.top ?? popupTop, transform: `scale(${scale})`,
      ...(mobile ? { width: mobile.width, height: mobile.height,
        '--mw-bubble-w': `${mobile.width}px`, '--mw-bubble-h': `${mobile.height}px` } : {}),
      "--mw-arrow-y": `${Math.max(40, Math.min(548, (y - popupTop) / scale))}px` } as CSSProperties}
    onPointerDown={event => event.stopPropagation()} onClick={event => event.stopPropagation()}>
    {navigation && profiles ? <TopTenProfilePages index={navigation.index} total={profiles.length}
      onChange={navigation.onChange} renderPage={(index, active) =>
        <ArtistProfileCard key={`${profiles[index].slug}-${active}`} selection={profiles[index]}
          onClose={onClose} closeButton={active ? closeButton : undefined} />}
    /> : <ArtistProfileCard key={selection.slug} selection={selection} onClose={onClose} closeButton={closeButton} />}
    {navigation && <>
      <span id="top-ten-active-profile" className="top-ten-profile-navigation__announcement" role="status">
        {navigation.index + 1} sur {navigation.total} : {selection.name}
      </span>
      <TopTenProfileNavigator {...navigation} />
    </>}
  </div>, document.body);
}

export function ArtistProfileCard({ selection, onClose, closeButton }: {
  selection: PortraitSelection; onClose: () => void; closeButton?: RefObject<HTMLButtonElement | null>;
}) {
  const [notice, setNotice] = useState('');
  const artist = useMemo(() => {
    const original = sceneDemoArtist(selection.name);
    const grade = selection.gradeLevel == null ? RING_ARTIST_GRADE : getGradeBadgeMeta(selection.gradeLevel);
    const seed = getPreProfileArtistForSeed({
      profileId: original?.artistId || `ring-demo-${selection.slug}`, displayName: selection.name,
      mainRole: original?.role, zoneName: original?.city, gradeLevel: grade.level, gradeColor: grade.mainColor,
    });
    return { ...seed, portraitUrl: selection.portraitUrl,
      role: original?.role || seed.role, location: original?.city || seed.location,
      bio: original ? `${original.role} à ${original.city}. Univers ${original.style.toLowerCase()}.` : seed.bio,
      followersLabel: '0 abonnés', online: false, verified: false, goldenLikesCount: 0, golden_likes_count: 0,
    };
  }, [selection]);
  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(''), 3500);
    return () => window.clearTimeout(timeout);
  }, [notice]);
  return <>
    <PreProfileFrame arrow>
      <HoverPreProfileContent artist={artist} demoFollow showMapPin={false}
        onOpenProfile={() => setNotice('Le profil complet sera bientôt disponible.')}
        onContact={() => openArtistMessaging(artist)}
        onCollabRequest={() => setNotice('Les demandes de collaboration seront bientôt disponibles.')} />
    </PreProfileFrame>
    <button ref={closeButton} className="ring-artist-preprofile__close" type="button" onClick={onClose} aria-label="Fermer le pré-profil">
      <X aria-hidden="true" />
    </button>
    {notice && <div className="ring-artist-preprofile__notice" role="status">{notice}</div>}
  </>;
}
